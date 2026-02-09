import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Transaction, { TransactionType } from "@/models/Transaction";
import { z } from "zod";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const settlementSchema = z.object({
    minBalance: z.number().min(0),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { minBalance } = settlementSchema.parse(body);

        await connectToDatabase();

        // 1. Fetch ALL wallets (We check everyone)
        const wallets = await Wallet.find({}).populate("userId", "name email");

        if (wallets.length === 0) {
            return NextResponse.json({
                message: "No wallets found.",
                stats: { count: 0, totalAmount: 0 }
            });
        }

        const now = new Date();
        const bulkWalletOps = [];
        const bulkWithdrawalOps = [];
        const bulkTransactionOps = [];

        // Import locally
        const { sendEmail } = await import("@/lib/email");

        let totalSettledAmount = 0;
        console.log(`[Settlement] STARTING. Min Balance to Keep: ${minBalance}`);

        for (const wallet of wallets) {
            const user = wallet.userId as any;
            if (!user || !user._id) continue;

            // --- SIMPLIFIED LOGIC ---
            // "Access Funds" (Excess Funds) = Current Total Liquid Balance - Min Balance
            // Liquid Balance = Profit Wallet + Principal Wallet (Compounded)
            // We DO NOT touch Locked Funds (Investments).

            const currentPrincipal = wallet.principal || 0;
            const currentProfit = wallet.profit || 0;

            const totalLiquidAssets = currentPrincipal + currentProfit;
            const excessFunds = totalLiquidAssets - minBalance;

            console.log(`[Settlement] User ${user.email} | Liquid: ${totalLiquidAssets} (Prin: ${currentPrincipal}, Prof: ${currentProfit}) | Excess: ${excessFunds}`);

            if (excessFunds < 1) {
                // Not enough excess funds to withdraw
                continue;
            }

            // Format to 2 decimals
            const grossAmount = Number(excessFunds.toFixed(2));

            // Calculate Tax (If applicable)
            const SURCHARGE_THRESHOLD = 50000;
            const SURCHARGE_RATE = 0.01;
            let taxDeducted = 0;
            let netPay = grossAmount;

            if (grossAmount > SURCHARGE_THRESHOLD) {
                taxDeducted = Number((grossAmount * SURCHARGE_RATE).toFixed(2));
                netPay = Number((grossAmount - taxDeducted).toFixed(2));
            }

            if (netPay > 0) {
                totalSettledAmount += netPay;

                // Deduct from Wallet (Priority: Profit -> Principal)
                let fromProfit = 0;
                let fromPrincipal = 0;

                if (currentProfit >= grossAmount) {
                    fromProfit = grossAmount;
                } else {
                    fromProfit = currentProfit;
                    fromPrincipal = grossAmount - currentProfit;
                }

                // Operation
                bulkWalletOps.push({
                    updateOne: {
                        filter: { _id: wallet._id },
                        update: {
                            $inc: {
                                profit: -fromProfit,
                                principal: -fromPrincipal,
                                totalWithdrawn: grossAmount
                            }
                        }
                    }
                });

                // Withdrawal Request
                const withdrawalId = new mongoose.Types.ObjectId();
                bulkWithdrawalOps.push({
                    insertOne: {
                        document: {
                            _id: withdrawalId,
                            userId: user._id,
                            amount: netPay,
                            status: WithdrawalStatus.PENDING,
                            adminRemark: `Quarterly Settlement [Gross: ₹${grossAmount}, LiquidAsset Sweep]`,
                            createdAt: now,
                            updatedAt: now,
                        }
                    }
                });

                // Transaction Log
                bulkTransactionOps.push({
                    insertOne: {
                        document: {
                            userId: user._id,
                            type: TransactionType.WITHDRAWAL,
                            amount: netPay,
                            taxDeducted: taxDeducted,
                            referenceId: withdrawalId,
                            status: "PENDING",
                            description: `Quarterly Settlement Sweep`,
                            createdAt: now,
                            updatedAt: now,
                        }
                    }
                });

                // Email (Async)
                sendEmail({
                    to: user.email,
                    subject: "🏦 Quarterly Settlement (Fund Sweep)",
                    html: `<p>Settled Excess Funds: ₹${netPay}</p>`
                }).catch(e => console.error("Email failed", e));
            }
        }

        // Execute
        if (bulkWalletOps.length > 0) {
            console.log(`[Settlement] Executing for ${bulkWalletOps.length} users.`);
            await Wallet.bulkWrite(bulkWalletOps);
            await Withdrawal.bulkWrite(bulkWithdrawalOps);
            await Transaction.bulkWrite(bulkTransactionOps);
        }

        return NextResponse.json({
            message: "Settlement processing complete",
            stats: {
                count: bulkWithdrawalOps.length,
                totalAmount: Number(totalSettledAmount.toFixed(2))
            }
        });

    } catch (error: any) {
        console.error("Settlement Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

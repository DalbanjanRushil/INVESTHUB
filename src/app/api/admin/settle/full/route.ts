import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Transaction, { TransactionType } from "@/models/Transaction";
import Investment from "@/models/Investment";
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

        // 1. Fetch ALL wallets & Investments
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
        const bulkInvestmentOps = [];

        // Import locally
        const { sendEmail } = await import("@/lib/email");

        let totalSettledAmount = 0;
        console.log(`[Full Settlement] STARTING. Min Balance to Keep: ${minBalance}`);

        for (const wallet of wallets) {
            const user = wallet.userId as any;
            if (!user || !user._id) continue;

            // 1. Calculate Current Liquid Funds (Profit + Principal)
            const currentPrincipal = wallet.principal || 0;
            const currentProfit = wallet.profit || 0;
            const currentLocked = wallet.locked || 0;

            // 2. Calculate Active Investment Value (Funds currently in market)
            const activeInvestments = await Investment.find({
                userId: user._id,
                isActive: true
            });

            let investmentLiquidationAmount = 0;
            const investmentIdsToClose = [];

            for (const inv of activeInvestments) {
                investmentLiquidationAmount += inv.amount;
                investmentIdsToClose.push(inv._id);
            }

            // 3. Total Dispersible Assets = Liquid + Locked(In Market)
            // We use 'investmentLiquidationAmount' as the source of truth for investment closing.
            // FIX: Use investmentLiquidationAmount instead of wallet.locked because wallet might be desync.

            const totalAssets = currentPrincipal + currentProfit + investmentLiquidationAmount;
            const excessFunds = totalAssets - minBalance;

            console.log(`[Full Settlement] User ${user.email} | Total Assets: ${totalAssets} (RealLocked: ${investmentLiquidationAmount}) | Excess: ${excessFunds}`);

            if (excessFunds < 1) {
                continue;
            }

            const grossAmount = Number(excessFunds.toFixed(2));

            // Tax Calculation (1% > 50k)
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

                // Operation: ZERO OUT EVERYTHING (except minBalance if any)
                // We simply set fields to 0 (or appropriately distributed if minBalance > 0)

                bulkWalletOps.push({
                    updateOne: {
                        filter: { _id: wallet._id },
                        update: {
                            $set: {
                                profit: 0,
                                principal: minBalance, // Leave min balance in principal
                                locked: 0, // Liquidate all locked funds
                            },
                            $inc: {
                                totalWithdrawn: grossAmount
                            }
                        }
                    }
                });

                // Close all active investments
                if (investmentIdsToClose.length > 0) {
                    bulkInvestmentOps.push({
                        updateMany: {
                            filter: { _id: { $in: investmentIdsToClose } },
                            update: {
                                $set: {
                                    isActive: false,
                                    maturityDate: now // Closed today
                                }
                            }
                        }
                    });
                }

                // Withdrawal Request
                const withdrawalId = new mongoose.Types.ObjectId();
                bulkWithdrawalOps.push({
                    insertOne: {
                        document: {
                            _id: withdrawalId,
                            userId: user._id,
                            amount: netPay,
                            status: WithdrawalStatus.PENDING,
                            adminRemark: `Full Settlement [Gross: ₹${grossAmount}, Liquidation Included]`,
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
                            description: `Full Settlement (Portfolio Liquidation)`,
                            createdAt: now,
                            updatedAt: now,
                        }
                    }
                });

                // Email
                sendEmail({
                    to: user.email,
                    subject: "🏦 Full Portfolio Settlement",
                    html: `<p>Your full portfolio has been liquidated and settled. Withdrawal Amount: ₹${netPay}</p>`
                }).catch(e => console.error("Email failed", e));
            }
        }

        // Execute
        if (bulkWalletOps.length > 0) {
            console.log(`[Full Settlement] Executing for ${bulkWalletOps.length} users.`);
            await Wallet.bulkWrite(bulkWalletOps);
            await Withdrawal.bulkWrite(bulkWithdrawalOps);
            await Transaction.bulkWrite(bulkTransactionOps);
            if (bulkInvestmentOps.length > 0) {
                await Investment.bulkWrite(bulkInvestmentOps);
            }
        }

        return NextResponse.json({
            message: "Full settlement processing complete",
            stats: {
                count: bulkWithdrawalOps.length,
                totalAmount: Number(totalSettledAmount.toFixed(2))
            }
        });

    } catch (error: any) {
        console.error("Full Settlement Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

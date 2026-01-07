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

const settlementSchema = z.object({
    minBalance: z.number().min(0),
});

export async function POST(req: Request) {
    try {
        // 1. Auth Check (Admin Only)
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { minBalance } = settlementSchema.parse(body);

        await connectToDatabase();

        // 2. Find eligible wallets
        // Balance must be strictly greater than minBalance
        const wallets = await Wallet.find({ balance: { $gt: minBalance } });

        if (wallets.length === 0) {
            return NextResponse.json({
                message: "No wallets found exceeding the threshold.",
                stats: { count: 0, totalAmount: 0 }
            });
        }

        const now = new Date();
        const bulkWalletOps = [];
        const bulkWithdrawalOps = [];
        const bulkTransactionOps = [];

        let totalSettledAmount = 0;

        for (const wallet of wallets) {
            const grossAmount = wallet.balance - minBalance;

            // --- FEATURE 1: SMART TAXATION (Wiki: TDS on Exit) ---
            // Rule: If Withdrawal > 50,000, deduct 1% Cess/Fee
            const SURCHARGE_THRESHOLD = 50000;
            const SURCHARGE_RATE = 0.01; // 1%
            let taxDeducted = 0;
            let netAmount = grossAmount;

            if (grossAmount > SURCHARGE_THRESHOLD) {
                taxDeducted = Number((grossAmount * SURCHARGE_RATE).toFixed(2));
                netAmount = Number((grossAmount - taxDeducted).toFixed(2));
            }

            if (netAmount > 0) {
                totalSettledAmount += netAmount;

                // 1. Deduct Balance (Gross Amount removed from system)
                bulkWalletOps.push({
                    updateOne: {
                        filter: { _id: wallet._id },
                        update: {
                            $inc: { balance: -grossAmount, totalWithdrawn: grossAmount }
                        }
                    }
                });

                // 2. Create Withdrawal Request (Generate ID manually for reference)
                const withdrawalId = new mongoose.Types.ObjectId();

                bulkWithdrawalOps.push({
                    insertOne: {
                        document: {
                            _id: withdrawalId,
                            userId: wallet.userId,
                            amount: netAmount, // Net Pay to User
                            status: WithdrawalStatus.PENDING,
                            adminRemark: `Quarterly Settlement [Gross: ₹${grossAmount}, Tax: ₹${taxDeducted}]`,
                            createdAt: now,
                            updatedAt: now,
                        }
                    }
                });

                // 3. Create Transaction Log
                bulkTransactionOps.push({
                    insertOne: {
                        document: {
                            userId: wallet.userId,
                            type: TransactionType.WITHDRAWAL,
                            amount: netAmount,
                            taxDeducted: taxDeducted,
                            referenceId: withdrawalId,
                            status: "PENDING",
                            description: `Quarterly Settlement ${taxDeducted > 0 ? `(Inc. 1% Cess)` : ""}`,
                            createdAt: now,
                            updatedAt: now,
                        }
                    }
                });
            }
        }

        // Execute Bulk Ops
        if (bulkWalletOps.length > 0) {
            await Wallet.bulkWrite(bulkWalletOps);
            await Withdrawal.bulkWrite(bulkWithdrawalOps);
            await Transaction.bulkWrite(bulkTransactionOps);
        }

        return NextResponse.json({
            message: "Settlement processing complete",
            stats: {
                count: bulkWithdrawalOps.length,
                totalAmount: totalSettledAmount
            }
        });

    } catch (error: any) {
        console.error("Settlement Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

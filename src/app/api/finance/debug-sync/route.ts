
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Wallet from "@/models/Wallet";
import LedgerEntry, { LedgerAccountType, LedgerDirection } from "@/models/LedgerEntry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        console.log(`[Sync] Starting ledger reconciliation for user: ${userId}`);

        // Aggregation Pipeline to calculate balances per Account Type
        const balances = await LedgerEntry.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: "$accountType",
                    totalCredits: {
                        $sum: {
                            $cond: [{ $eq: ["$direction", LedgerDirection.CREDIT] }, "$amount", 0]
                        }
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [{ $eq: ["$direction", LedgerDirection.DEBIT] }, "$amount", 0]
                        }
                    }
                }
            },
            {
                $project: {
                    balance: { $subtract: ["$totalCredits", "$totalDebits"] }
                }
            }
        ]);

        let principal = 0;
        let profit = 0;
        let referral = 0;
        let locked = 0;

        balances.forEach((b: any) => {
            if (b._id === LedgerAccountType.PRINCIPAL) principal = b.balance;
            else if (b._id === LedgerAccountType.PROFIT) profit = b.balance;
            else if (b._id === LedgerAccountType.REFERRAL) referral = b.balance;
            else if (b._id === LedgerAccountType.LOCKED) locked = b.balance;
        });

        // Force Update Wallet
        const updatedWallet = await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    principal,
                    profit,
                    referral,
                    locked,
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: "Success! Wallet synced with Ledger.",
            details: {
                wallet: updatedWallet,
                ledgerBreakdown: balances
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

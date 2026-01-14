import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Wallet from "@/models/Wallet";
import Investment from "@/models/Investment";
import Deposit from "@/models/Deposit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        console.log(`[Sync] Starting manual sync for user: ${userId}`);

        // 1. Find all successful deposits for this user
        const deposits = await Deposit.find({ userId, status: "SUCCESS" });

        for (const dep of deposits) {
            // Ensure Investment exists
            const existingInv = await Investment.findOne({ sourceDepositId: dep._id });
            if (!existingInv) {
                await Investment.create({
                    userId: dep.userId,
                    amount: dep.amount,
                    plan: dep.plan || "FLEXI",
                    sourceDepositId: dep._id,
                    isActive: true
                });
            }
        }

        // 2. Recalculate from Ledger (Investments)
        const allInvs = await Investment.find({ userId, isActive: true });
        const principal = allInvs.filter(i => i.plan === "FLEXI").reduce((s, i) => s + i.amount, 0);
        const locked = allInvs.filter(i => i.plan !== "FLEXI").reduce((s, i) => s + i.amount, 0);

        // 3. Force Update Wallet
        const updatedWallet = await Wallet.findOneAndUpdate(
            { userId },
            {
                $set: {
                    principal,
                    locked,
                    balance: 0 // Clear legacy field
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: "Success! Wallet synced with investment ledger.",
            details: {
                principal: updatedWallet.principal,
                locked: updatedWallet.locked,
                investmentsCount: allInvs.length
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

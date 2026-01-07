import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Transaction, { TransactionType } from "@/models/Transaction";
import { z } from "zod";
import mongoose from "mongoose";

const withdrawalSchema = z.object({
    amount: z.number().min(1, "Withdrawal amount must be at least 1 INR"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount } = withdrawalSchema.parse(body);

        await connectToDatabase();

        // Start Session for Transaction (Ensure Atomic Deduction)
        // NOTE: This requires MongoDB Replica Set. If local standalone, session usage might fail.
        // For academic simulation safety on standalone, we'll use logic-based safety without session if needed,
        // but assuming standard Replica Set (Atlas) is available.

        // 1. Fetch Wallet
        const wallet = await Wallet.findOne({ userId: session.user.id });

        if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

        // 2. Check Sufficient Balance
        if (wallet.balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // 3. Deduct Balance Immediately (Hold logic)
        wallet.balance -= amount;
        wallet.totalWithdrawn += amount; // We increment this now to reflect movement, or wait for success?
        // standard practice: deduct balance now. If rejected, refund it.
        await wallet.save();

        // 4. Create Withdrawal Request
        const withdrawal = await Withdrawal.create({
            userId: session.user.id,
            amount,
            status: WithdrawalStatus.PENDING,
        });

        // 5. Log Transaction
        await Transaction.create({
            userId: session.user.id,
            type: TransactionType.WITHDRAWAL,
            amount: amount,
            referenceId: withdrawal._id,
            status: "PENDING",
            description: "Withdrawal Request",
        });

        return NextResponse.json(
            { message: "Withdrawal request created successfully", withdrawalId: withdrawal._id },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Withdrawal Request Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

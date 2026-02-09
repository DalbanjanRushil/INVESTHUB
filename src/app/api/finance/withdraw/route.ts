
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { LedgerService } from "@/lib/services/LedgerService";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Investment, { LockPlan } from "@/models/Investment";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import Transaction from "@/models/Transaction";
import { z } from "zod";
import mongoose from "mongoose";

const withdrawalSchema = z.object({
    amount: z.number().min(1, "Withdrawal amount must be at least 1 INR"),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount } = withdrawalSchema.parse(body);

        await connectToDatabase();

        // Start a session for Atomicity
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // 1. Execute Ledger Transaction (Locks funds)
            // This handles the Waterfall logic and Balance checks
            let transaction;
            try {
                transaction = await LedgerService.requestWithdrawal(session.user.id, amount, dbSession);
            } catch (err: any) {
                if (err.message === "Insufficient Funds" || err.message === "Wallet not found") {
                    await dbSession.abortTransaction(); // Ensure rollback
                    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
                }
                throw err;
            }

            // 2. Sync Investment Ledger (If Principal was used)
            const breakdown = transaction.metadata instanceof Map ?
                transaction.metadata.get('breakdown') :
                transaction.metadata?.breakdown;

            const principalDeducted = breakdown?.principal || 0;

            if (principalDeducted > 0) {
                console.log(`[Withdraw] Deducting ${principalDeducted} from Flexi Investments...`);
                const flexiInvestments = await Investment.find({
                    userId: session.user.id,
                    isActive: true,
                    plan: LockPlan.FLEXI // Corrected to use Enum
                }).sort({ amount: -1 }).session(dbSession);

                let remaining = principalDeducted;

                for (const inv of flexiInvestments) {
                    if (remaining <= 0) break;

                    let deduct = 0;
                    let close = false;

                    if (inv.amount > remaining) {
                        deduct = remaining;
                        remaining = 0;
                    } else {
                        deduct = inv.amount;
                        remaining -= inv.amount;
                        close = true;
                    }

                    // A. Update Investment Doc
                    inv.amount -= deduct;
                    if (close) {
                        inv.isActive = false;
                        inv.maturityDate = new Date();
                    }
                    await inv.save({ session: dbSession });

                    // B. Add Investment Ledger Entry
                    await new InvestmentLedger({
                        investmentId: inv._id,
                        userId: session.user.id,
                        action: InvestmentAction.REDEMPTION,
                        amountChange: -deduct,
                        balanceAfter: inv.amount,
                        description: "Principal Used for Withdrawal Request",
                        transactionId: transaction._id
                    }).save({ session: dbSession });
                }
            }

            // 3. Create Withdrawal Request (Linked to Transaction)
            const withdrawal = await new Withdrawal({
                userId: session.user.id,
                amount,
                status: WithdrawalStatus.PENDING,
            }).save({ session: dbSession });

            // Link Withdrawal ID back to Transaction
            transaction.referenceId = withdrawal._id;
            transaction.referenceType = "WITHDRAWAL";
            await transaction.save({ session: dbSession });

            await dbSession.commitTransaction();

            // 4. Real-time Update (Socket) - Notify Admin
            // (Executed AFTER commit to ensure data is real)
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            try {
                fetch(`${baseUrl}/api/socket/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: "admin:withdrawals:update",
                        data: { type: "NEW_WITHDRAWAL_REQUEST", amount: amount }
                    })
                }).catch(e => console.error("Socket emit fetch failed", e));
            } catch (e) {
                console.error("Socket Emit Error", e);
            }

            return NextResponse.json(
                { message: "Withdrawal request created successfully", withdrawalId: withdrawal._id },
                { status: 200 }
            );

        } catch (error) {
            await dbSession.abortTransaction();
            throw error;
        } finally {
            dbSession.endSession();
        }

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

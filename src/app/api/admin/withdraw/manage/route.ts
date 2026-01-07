import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Wallet from "@/models/Wallet";
import Notification from "@/models/Notification";
import { UserRole } from "@/models/User";
import { z } from "zod";

const actionSchema = z.object({
    withdrawalId: z.string(),
    action: z.enum(["APPROVE", "REJECT"]),
    remark: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        // 1. Admin Security Check
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { withdrawalId, action, remark } = actionSchema.parse(body);

        await connectToDatabase();

        // 2. Fetch Withdrawal
        const withdrawal = await Withdrawal.findById(withdrawalId);
        if (!withdrawal) {
            return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
        }

        if (withdrawal.status !== WithdrawalStatus.PENDING) {
            return NextResponse.json(
                { error: "Request already processed" },
                { status: 400 }
            );
        }

        // 3. Process Action
        if (action === "APPROVE") {
            // Just mark as approved. Money was already deducted at request time.
            withdrawal.status = WithdrawalStatus.APPROVED;
            withdrawal.adminRemark = remark || "Approved by Admin";
            withdrawal.processedAt = new Date();
            await withdrawal.save();
        } else if (action === "REJECT") {
            // Mark as rejected AND REFUND the amount
            withdrawal.status = WithdrawalStatus.REJECTED;
            withdrawal.adminRemark = remark || "Rejected by Admin";
            withdrawal.processedAt = new Date();
            await withdrawal.save();

            // Refund Logic
            await Wallet.findOneAndUpdate(
                { userId: withdrawal.userId },
                {
                    $inc: {
                        balance: withdrawal.amount,
                        totalWithdrawn: -withdrawal.amount // Revert the 'totalWithdrawn' metric if we incremented it earlier? 
                        // In the withdraw API logic was: wallet.balance -= amount; wallet.totalWithdrawn += amount;
                        // So yes, we should revert it.
                    }
                }
            );
        }

        // 4. Send Notification
        await Notification.create({
            userId: withdrawal.userId,
            title: `Withdrawal ${action === "APPROVE" ? "Approved" : "Rejected"}`,
            message:
                action === "APPROVE"
                    ? `Your withdrawal of ₹${withdrawal.amount} has been processed.`
                    : `Your withdrawal request was rejected. Remark: ${remark || "N/A"}. Refund initiated.`,
            isRead: false,
        });

        return NextResponse.json(
            { message: `Withdrawal ${action.toLowerCase()}ed successfully` },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Management Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

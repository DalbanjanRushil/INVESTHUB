
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Wallet from "@/models/Wallet";
import Notification from "@/models/Notification";
import User, { UserRole } from "@/models/User";
import { z } from "zod";
import { LedgerService } from "@/lib/services/LedgerService";
import Transaction, { TransactionType, TransactionStatus } from "@/models/Transaction"; // Needed for ref lookup

const actionSchema = z.object({
    withdrawalId: z.string(),
    action: z.enum(["APPROVE", "REJECT"]),
    remark: z.string().optional(),
    utrNumber: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        // 1. Admin Security Check
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { withdrawalId, action, remark } = actionSchema.parse(body);

        // Validation for UTR Number on Approval
        let utrNumber = body.utrNumber;
        if (action === "APPROVE") {
            if (!utrNumber || utrNumber.length !== 16) {
                return NextResponse.json({ error: "A valid 16-digit UTR Number is required for approval." }, { status: 400 });
            }
        }

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

        // 3. Process Action via Ledger
        if (action === "APPROVE") {
            try {
                // Execute Ledger Movement (Locked -> Admin Bank)
                // We need the Transaction ID. 
                // We can search for the transaction by referenceId.
                const txn = await Transaction.findOne({ referenceId: withdrawal._id, type: TransactionType.WITHDRAWAL });

                // If using LedgerService.approveWithdrawal (which we customized for this):
                await LedgerService.approveWithdrawal(withdrawalId, session.user.id, txn ? txn._id.toString() : "", utrNumber);



                // Update Withdrawal Record
                withdrawal.status = WithdrawalStatus.APPROVED;
                withdrawal.adminRemark = remark || "Approved by Admin";
                withdrawal.utrNumber = utrNumber;
                withdrawal.processedAt = new Date();
                await withdrawal.save();

                // Stats Update (Manually handled here as LedgerService focuses on Balances)
                await Wallet.findOneAndUpdate(
                    { userId: withdrawal.userId },
                    { $inc: { totalWithdrawn: withdrawal.amount } }
                );

            } catch (err: any) {
                console.error("Ledger Approval Failed:", err);
                return NextResponse.json({ error: err.message }, { status: 500 });
            }

        } else if (action === "REJECT") {
            try {
                // Execute Ledger Movement (Locked -> Funds Returned)
                await LedgerService.rejectWithdrawal(withdrawalId, session.user.id, remark || "Rejected by Admin");

                // Update Withdrawal Record
                withdrawal.status = WithdrawalStatus.REJECTED;
                withdrawal.adminRemark = remark || "Rejected by Admin";
                withdrawal.processedAt = new Date();
                await withdrawal.save();

            } catch (err: any) {
                console.error("Ledger Rejection Failed:", err);
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
        }

        // 4. Send Notification
        await Notification.create({
            userId: withdrawal.userId,
            title: `Withdrawal ${action === "APPROVE" ? "Approved" : "Rejected"}`,
            message:
                action === "APPROVE"
                    ? `Your withdrawal of ₹${withdrawal.amount} has been successfully processed.`
                    : `Your withdrawal request was rejected. Remark: ${remark || "N/A"}. Refund initiated.`,
            isRead: false,
        });

        // 5. Real-time Update (Socket)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        try {
            fetch(`${baseUrl}/api/socket/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: `user:${withdrawal.userId}:update`,
                    data: {
                        type: "WITHDRAWAL_UPDATE",
                        status: action,
                        amount: withdrawal.amount
                    }
                })
            }).catch(e => console.error("Socket emit fetch failed", e));
        } catch (e) {
            console.error("Socket Emit Error", e);
        }

        // 6. Send Email Notification
        try {
            const user = await User.findById(withdrawal.userId).select("email name");
            if (user && user.email) {
                const { sendEmail } = await import("@/lib/email");
                const { generateEmailHtml, generateTableHtml } = await import("@/lib/email-templates");

                const isApproved = action === "APPROVE";
                const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

                let contentHtml = "";
                let subject = "";

                if (isApproved) {
                    subject = "Withdrawal Approved - InvestHub";
                    const tableHtml = generateTableHtml([
                        { label: 'Amount', value: `₹${withdrawal.amount.toLocaleString('en-IN')}` },
                        { label: 'UTR Number', value: utrNumber || "N/A" },
                        { label: 'Status', value: '<span style="color: #059669; font-weight: bold;">APPROVED</span>' },
                        { label: 'Processed On', value: date }
                    ]);
                    contentHtml = `<p style="margin-bottom: 24px;">We’re pleased to inform you that your withdrawal request has been approved, and the amount has been successfully credited to your bank account.</p>${tableHtml}`;
                } else {
                    subject = "Withdrawal Request Update";
                    const tableHtml = generateTableHtml([
                        { label: 'Amount', value: `₹${withdrawal.amount.toLocaleString('en-IN')}` },
                        { label: 'Status', value: '<span style="color: #dc2626; font-weight: bold;">REJECTED</span>' },
                        { label: 'Reason', value: remark || "Administrative Decision" },
                        { label: 'Date', value: date }
                    ]);
                    contentHtml = `<p style="margin-bottom: 24px;">We regret to inform you that your withdrawal request has been declined. The amount has been refunded to your wallet/investment balance.</p>${tableHtml}`;
                }

                const html = generateEmailHtml(
                    user.name || "Investor",
                    isApproved ? "Withdrawal Successful" : "Withdrawal Rejected",
                    contentHtml
                );

                await sendEmail({
                    to: user.email,
                    subject: subject,
                    html: html
                });
            }
        } catch (emailError) {
            console.error("Failed to send withdrawal email notification:", emailError);
            // Non-blocking error
        }

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

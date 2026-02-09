
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Transaction, { TransactionStatus, TransactionType, RiskFlag } from "@/models/Transaction";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import { LedgerService } from "@/lib/services/LedgerService";
import { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import { z } from "zod";

const approveSchema = z.object({
    transactionId: z.string(),
});

export async function POST(req: Request) {
    try {
        // 1. Admin Auth
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { transactionId } = approveSchema.parse(body);

        await connectToDatabase();

        // 2. Fetch Transaction
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

        if (transaction.status !== TransactionStatus.PENDING) {
            return NextResponse.json({ error: "Transaction is not pending." }, { status: 400 });
        }
        if (transaction.type !== TransactionType.REFERRAL_BONUS) {
            return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
        }

        const bonusAmount = transaction.amount;
        const referrerId = transaction.userId; // The user receiving the bonus

        // 3. Find Admin (Payer)
        // In a single-admin system, we use the current session user
        // Or we find the 'Main' admin. Let's use session user as the Payer.
        const adminId = session.user.id;
        const adminWallet = await Wallet.findOne({ userId: adminId });

        if (!adminWallet) {
            return NextResponse.json({ error: "Admin wallet not found." }, { status: 404 });
        }

        // 4. Check Admin Solvency (Optional but requested "approving from his fund")
        // We assume Admin pays from their 'Profit' or 'Principal' or 'Available Balance'.
        // Let's check 'Profit' first, then 'Principal'??
        // Or better, just check total liquid balance (Principal + Profit).
        const adminLiquidBalance = (adminWallet.principal || 0) + (adminWallet.profit || 0);

        if (adminLiquidBalance < bonusAmount) {
            return NextResponse.json({
                error: `Insufficient Admin Funds. Available: ₹${adminLiquidBalance}, Required: ₹${bonusAmount}`
            }, { status: 400 });
        }

        // 5. Execute LEDGER TRANSFER (Admin -> User)
        // We use LedgerService to ensure wallets update correctly
        await LedgerService.recordTransaction({
            userId: referrerId.toString(), // Primary owner of the record is the Receiver
            type: TransactionType.REFERRAL_BONUS, // Keep type same
            amount: bonusAmount,
            netAmount: bonusAmount,
            referenceType: LedgerReferenceType.REFERRAL_BONUS,
            description: transaction.description || "Referral Bonus Approved",
            movements: [
                {
                    // DEBIT ADMIN (PAYER)
                    userId: adminId,
                    accountType: LedgerAccountType.PROFIT, // Deduct from Admin Profit
                    direction: LedgerDirection.DEBIT,
                    amount: bonusAmount
                },
                {
                    // CREDIT USER (RECEIVER)
                    userId: referrerId.toString(),
                    accountType: LedgerAccountType.REFERRAL, // Credit User Referral Balance
                    direction: LedgerDirection.CREDIT,
                    amount: bonusAmount
                }
            ]
        });

        // 6. Update Original Transaction Status
        transaction.status = TransactionStatus.SUCCESS;
        transaction.riskFlag = RiskFlag.LOW; // Verified
        transaction.metadata = { ...transaction.metadata, approvedBy: adminId, approvedAt: new Date() };
        await transaction.save();

        return NextResponse.json({
            success: true,
            message: `Referral Bonus of ₹${bonusAmount} approved & transferred from Admin funds.`
        });

    } catch (error: any) {
        console.error("Referral Approval Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

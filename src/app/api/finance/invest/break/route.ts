
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Investment from "@/models/Investment";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Transaction, { TransactionType, TransactionStatus } from "@/models/Transaction";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import { z } from "zod";

const breakSchema = z.object({
    investmentId: z.string(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { investmentId } = breakSchema.parse(body);

        await connectToDatabase();

        const investment = await Investment.findOne({
            _id: investmentId,
            userId: session.user.id,
            isActive: true
        });

        if (!investment) {
            return NextResponse.json({ error: "Investment not found or already inactive" }, { status: 404 });
        }

        // Logic: Calculate Penalty
        const PENALTY_RATE = 0.10; // 10%
        const principal = investment.amount;
        const penalty = principal * PENALTY_RATE;
        const payoutAmount = principal - penalty;

        // 1. Mark Investment as Broken
        investment.isActive = false;
        investment.maturityDate = new Date(); // Matured Now
        await investment.save();

        // 2. Create Ledger Entry for Breakage
        await InvestmentLedger.create({
            investmentId: investment._id,
            userId: session.user.id,
            action: InvestmentAction.REDEMPTION,
            amountChange: -principal, // Full principal removed from investment
            balanceAfter: 0,
            description: `Early Limit Break: 10% Penalty Applied`,
        });

        // 3. Log Penalty Transaction for USER (Debit / Record)
        // Actually, this confuses the ledger. If we just withdraw 'net amount', the penalty is invisible.
        // It's better to show:
        // A. Investment Redemption (Full Amount) but... that's complex logic.
        // The user just receives PayoutAmount.
        // Let's create a record of the DEDUCTION for the user so they know where it went.
        await Transaction.create({
            userId: session.user.id,
            type: TransactionType.ADJUSTMENT,
            status: TransactionStatus.SUCCESS,
            amount: penalty,
            fee: 0,
            netAmount: -penalty,
            description: "Early Withdrawal Penalty / Admin Fee (10%)",
            riskFlag: "LOW",
            referenceId: investment._id
        });

        // 4. FIND ADMIN USER TO RECEIVE FUNDS
        // In a real app, this is a specific system account.
        // Here, we find the first user with role 'ADMIN'.
        const adminUser = await User.findOne({ role: UserRole.ADMIN }).sort({ createdAt: 1 });

        if (adminUser) {
            // 5. CREDIT ADMIN WALLET / LEDGER
            // We create a transaction for the ADMIN showing this income.
            await Transaction.create({
                userId: adminUser._id,
                type: TransactionType.ADMIN_FEE,
                status: TransactionStatus.SUCCESS,
                amount: penalty,
                fee: 0,
                netAmount: penalty, // Positive Income
                description: `Revenue from User ${session.user.name} (Deposit Break)`,
                referenceId: investment._id,
                riskFlag: "LOW"
            });
            console.log(`[Fee] Credited ₹${penalty} to Admin ${adminUser.email}`);
        } else {
            console.warn("[Fee] No Admin found to credit penalty.");
        }

        // 6. Create Withdrawal Request for Net Amount
        const withdrawal = await Withdrawal.create({
            userId: session.user.id,
            amount: payoutAmount,
            status: WithdrawalStatus.PENDING,
            adminRemark: `Auto-generated from Broken Deposit (ID: ${investment._id}). Original: ₹${principal}. Penalty: ₹${penalty}.`
        });

        // 7. Log The Withdrawal Request Transaction
        await Transaction.create({
            userId: session.user.id,
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.PENDING,
            amount: payoutAmount,
            fee: 0,
            netAmount: payoutAmount,
            referenceId: withdrawal._id,
            description: `Early Settlement Payout (Fixed Plan Broken)`
        });

        // 8. UPDATE WALLETS (CRITICAL SYNC)

        // A. User Wallet:
        // - "Locked" funds (from Fixed Inv) decrease by 'principal' (e.g. -10000)
        // - "Locked" funds (for Withdrawal) increase by 'payoutAmount' (e.g. +9000)
        // - Net Change to 'locked': -penalty

        await Wallet.findOneAndUpdate(
            { userId: session.user.id },
            { $inc: { locked: -penalty } }
        );

        // B. Admin Wallet:
        // - "Profit" increases by penalty
        if (adminUser) {
            await Wallet.findOneAndUpdate(
                { userId: adminUser._id },
                { $inc: { profit: penalty } }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Investment broken successfully. Penalty transferred to Admin.",
            penalty,
            payoutAmount
        });

    } catch (error: any) {
        console.error("Break Deposit Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

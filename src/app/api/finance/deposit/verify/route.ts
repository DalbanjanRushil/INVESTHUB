
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Deposit, { DepositStatus } from "@/models/Deposit";
import { LedgerService, SYSTEM_ACCOUNTS } from "@/lib/services/LedgerService";
import { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import Transaction, { TransactionType, RiskFlag, TransactionStatus } from "@/models/Transaction";
import Investment, { LockPlan } from "@/models/Investment";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import User from "@/models/User";
import ErrorLog from "@/models/ErrorLog";
import crypto from "crypto";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    console.log("[Verify] Starting Verification Process with Ledger...");
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = body;

        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay Secret not defined");
        }

        // 1. Verify Signature
        const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(signatureBody.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid Signature", success: false }, { status: 400 });
        }

        await connectToDatabase();

        const deposit = await Deposit.findOne({ razorpayOrderId: razorpay_order_id });
        if (!deposit) {
            return NextResponse.json({ error: "Deposit record not found" }, { status: 404 });
        }

        if (deposit.status === DepositStatus.SUCCESS) {
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        // 2. Atomic Status Update (Idempotency)
        const uniqueDeposit = await Deposit.findOneAndUpdate(
            { _id: deposit._id, status: "PENDING" },
            {
                $set: {
                    status: DepositStatus.SUCCESS,
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                }
            },
            { new: true }
        );

        if (!uniqueDeposit) {
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        // 3. START LEDGER TRANSACTION
        const targetUserId = deposit.userId.toString();
        const plan = uniqueDeposit.plan || "FLEXI";
        const isFlexi = plan === "FLEXI";
        const amount = uniqueDeposit.amount;

        // Determine Wallet Destination
        // Flexi -> Principal, Locked -> Locked
        const targetAccount = isFlexi ? LedgerAccountType.PRINCIPAL : LedgerAccountType.LOCKED;

        // A. Record Financial Transaction (Double Entry)
        const transaction = await LedgerService.recordTransaction({
            userId: targetUserId,
            type: TransactionType.DEPOSIT,
            amount: amount,
            netAmount: amount, // Fees?
            referenceType: LedgerReferenceType.DEPOSIT,
            gatewayOrderId: razorpay_order_id,
            description: `Deposit via Razorpay (${plan})`,
            metadata: {
                plan,
                razorpay_payment_id
            },
            movements: [
                {
                    accountType: targetAccount,
                    direction: LedgerDirection.CREDIT,
                    amount: amount,
                    userId: targetUserId
                },
                {
                    accountType: LedgerAccountType.GATEWAY, // Liability Source
                    direction: LedgerDirection.DEBIT,
                    amount: amount,
                    userId: null // System
                }
            ]
        });

        // B. Create Investment Contract
        let maturityDate = undefined;
        const now = new Date();
        if (plan === "FIXED_3M") maturityDate = new Date(now.setMonth(now.getMonth() + 3));
        else if (plan === "FIXED_6M") maturityDate = new Date(now.setMonth(now.getMonth() + 6));
        else if (plan === "FIXED_1Y") maturityDate = new Date(now.setMonth(now.getMonth() + 12));

        const investment = await Investment.create({
            userId: targetUserId,
            amount: amount,
            plan: plan,
            startDate: new Date(),
            maturityDate: maturityDate,
            sourceDepositId: uniqueDeposit._id,
            isActive: true
        });

        // C. Investment Ledger (Immutable Tracking)
        await InvestmentLedger.create({
            investmentId: investment._id,
            userId: targetUserId,
            action: InvestmentAction.CREATION,
            amountChange: amount,
            balanceAfter: amount,
            description: "Initial Deposit Investment",
            transactionId: transaction._id
        });

        // D. Referral Bonus (Pending Admin Approval)
        try {
            const user = await User.findById(targetUserId);
            if (user && user.referredBy) {
                const REFERRAL_RATE = 0.01;
                const bonusAmount = Number((amount * REFERRAL_RATE).toFixed(2));

                if (bonusAmount > 0) {
                    // CREATE PENDING TRANSACTION ONLY
                    // Logic: "Admin must approve from his fund"
                    await Transaction.create({
                        userId: user.referredBy,
                        type: TransactionType.REFERRAL_BONUS,
                        status: TransactionStatus.PENDING, // ACTION REQUIRED
                        amount: bonusAmount,
                        fee: 0,
                        netAmount: bonusAmount,
                        description: `Referral Bonus for inviting ${user.name} (Pending Approval)`,
                        riskFlag: RiskFlag.LOW,
                        referenceId: uniqueDeposit._id // Link to deposit
                    });
                    console.log(`[Verify] Pending Referral Bonus created for ${user.referredBy}`);
                }
            }
        } catch (err) {
            console.error("[Verify] Bonus Error:", err);
        }

        // E. Real-time Update
        const socketInternalUrl = "http://localhost:3000/api/socket/emit";
        try {
            fetch(socketInternalUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: `user:${session.user.id}:update`,
                    data: { type: "DEPOSIT_SUCCESS", amount: amount }
                })
            }).catch(e => console.error(e));
        } catch (e) { }

        // F. Send Email Notification
        const { sendEmail } = await import("@/lib/email");
        const { generateEmailHtml, generateTableHtml } = await import("@/lib/email-templates");

        if (session.user.email) {
            const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

            const tableHtml = generateTableHtml([
                { label: 'Amount', value: `₹${amount.toLocaleString('en-IN')}` },
                { label: 'Plan', value: plan },
                { label: 'Transaction ID', value: razorpay_payment_id },
                { label: 'Status', value: '<span style="color: #059669; font-weight: bold;">SUCCESS</span>' },
                { label: 'Date', value: date }
            ]);

            const html = generateEmailHtml(
                session.user.name || "Investor",
                "Deposit Confirmation",
                `<p style="margin-bottom: 24px;">We are pleased to inform you that your deposit of <strong>₹${amount.toLocaleString('en-IN')}</strong> has been successfully processed and credited to your account.</p>${tableHtml}`
            );

            await sendEmail({
                to: session.user.email,
                subject: "Deposit Successful - InvestHub",
                html: html
            }).catch(console.error);
        }

        return NextResponse.json({ message: "Verify Success", success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Verification Critical Error:", error);
        await ErrorLog.create({
            path: "/api/finance/deposit/verify",
            error: error.message,
            stack: error.stack
        });
        return NextResponse.json({ error: "Internal Error", details: error.message, success: false }, { status: 200 });
    }
}

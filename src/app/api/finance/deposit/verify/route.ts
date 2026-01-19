
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Deposit, { DepositStatus } from "@/models/Deposit";
import Wallet from "@/models/Wallet";
import Transaction, { TransactionType } from "@/models/Transaction";
import Investment from "@/models/Investment";
import User from "@/models/User";
import ErrorLog from "@/models/ErrorLog";
import crypto from "crypto";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    console.log("[Verify] Starting Verification Process...");
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.error("[Verify] No session found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(`[Verify] Session User ID: ${session.user.id}`);

        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("[Verify] Failed to parse JSON body", e);
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = body;

        console.log(`[Verify] OrderID: ${razorpay_order_id}, PaymentID: ${razorpay_payment_id}`);

        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error("[Verify] RAZORPAY_KEY_SECRET is missing");
            throw new Error("Razorpay Secret not defined");
        }

        // 1. Verify Signature
        const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(signatureBody.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;
        console.log(`[Verify] Signature Authentic: ${isAuthentic}`);

        console.log("[Verify] Connecting to DB...");
        await connectToDatabase();
        console.log("[Verify] Connected to DB.");

        const deposit = await Deposit.findOne({ razorpayOrderId: razorpay_order_id });
        console.log(`[Verify] Deposit Found: ${deposit ? deposit._id : 'NO'}`);

        if (!deposit) {
            return NextResponse.json({ error: "Deposit record not found" }, { status: 404 });
        }

        if (deposit.status === DepositStatus.SUCCESS) {
            console.log("[Verify] Deposit already processed.");
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        if (isAuthentic) {
            // Ensure userId is handled correctly
            const targetUserId = deposit.userId; // Already an ObjectId from Schema
            console.log(`[Verify] Processing for TargetUser: ${targetUserId}`);

            // A. Update Deposit Status
            deposit.status = DepositStatus.SUCCESS;
            deposit.razorpayPaymentId = razorpay_payment_id;
            deposit.razorpaySignature = razorpay_signature;
            await deposit.save();
            console.log("[Verify] Deposit status updated to SUCCESS");

            // B. Create Active Investment Record
            const plan = deposit.plan || "FLEXI";
            let maturityDate = undefined;
            const now = new Date();

            if (plan === "FIXED_3M") maturityDate = new Date(now.setMonth(now.getMonth() + 3));
            else if (plan === "FIXED_6M") maturityDate = new Date(now.setMonth(now.getMonth() + 6));
            else if (plan === "FIXED_1Y") maturityDate = new Date(now.setMonth(now.getMonth() + 12));

            console.log(`[Verify] Creating Investment Record... Plan: ${plan}`);
            await Investment.create({
                userId: targetUserId,
                amount: deposit.amount,
                plan: plan,
                startDate: new Date(),
                maturityDate: maturityDate,
                sourceDepositId: deposit._id,
                isActive: true
            });
            console.log("[Verify] Investment Created.");

            // C. Update Wallet
            console.log("[Verify] Updating Wallet...");
            const incQuery: any = { totalDeposited: deposit.amount };

            if (plan === "FLEXI") {
                incQuery.principal = deposit.amount;
            } else {
                incQuery.locked = deposit.amount;
            }

            const updatedWallet = await Wallet.findOneAndUpdate(
                { userId: targetUserId },
                {
                    $inc: incQuery
                },
                { new: true, upsert: true }
            );
            console.log(`[Verify] Wallet Updated. New Principal: ${updatedWallet?.principal}`);

            // D. Log Transaction
            console.log(`[Verify] Creating Transaction Log...`);
            const transactionRecord = await Transaction.create({
                userId: targetUserId,
                type: TransactionType.DEPOSIT,
                amount: deposit.amount,
                referenceId: deposit._id,
                status: "SUCCESS",
                description: `Deposit via Razorpay (${plan === "FLEXI" ? "Flexi" : "Locked " + plan})`,
            });
            console.log(`[Verify] Transaction Created: ${transactionRecord._id}`);

            // E. Real-time Update
            console.log("[Verify] Emitting Socket Event...");
            const socketInternalUrl = "http://localhost:3000/api/socket/emit";
            try {
                const socketRes = await fetch(socketInternalUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: `user:${session.user.id}:update`,
                        data: { type: "DEPOSIT_SUCCESS", amount: deposit.amount }
                    })
                });
                if (!socketRes.ok) {
                    console.error("[Verify] Socket Emit Status:", socketRes.status);
                } else {
                    console.log("[Verify] Socket Emitted Successfully.");
                }
            } catch (e) {
                console.error("[Verify] Socket Internal Error (Non-Fatal):", e);
            }

            // --- REFERRAL BONUS ---
            console.log("[Verify] Checking Referrals...");
            try {
                const user = await User.findById(targetUserId);
                if (user && user.referredBy) {
                    const referrerId = new mongoose.Types.ObjectId(user.referredBy as any);
                    console.log(`[Verify] Referrer Found: ${referrerId}`);
                    const REFERRAL_RATE = 0.01;
                    const bonusAmount = Number((deposit.amount * REFERRAL_RATE).toFixed(2));

                    if (bonusAmount > 0) {
                        await Wallet.findOneAndUpdate(
                            { userId: referrerId },
                            {
                                $inc: { referral: bonusAmount, totalProfit: bonusAmount },
                                $setOnInsert: { principal: 0, profit: 0, locked: 0, balance: 0 }
                            },
                            { upsert: true }
                        );
                        await Transaction.create({
                            userId: referrerId,
                            type: TransactionType.REFERRAL_BONUS,
                            amount: bonusAmount,
                            status: "SUCCESS",
                            description: `Referral Bonus (1%) from ${user.name}'s deposit`,
                        });
                        console.log(`[Verify] Referral Bonus of ${bonusAmount} credited to ${referrerId}`);
                    }
                }
            } catch (err) { console.error("[Verify] Bonus Error:", err); }

            return NextResponse.json({ message: "Verify Success", success: true }, { status: 200 });
        } else {
            deposit.status = DepositStatus.FAILED;
            await deposit.save();
            console.error("[Verify] Invalid Signature");
            return NextResponse.json({ error: "Invalid Signature", success: false }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Verification Critical Error Stack:", error.stack);

        // Persist Internal Error to DB
        try {
            await connectToDatabase();
            await ErrorLog.create({
                path: "/api/finance/deposit/verify",
                error: error.message,
                stack: error.stack
            });
        } catch (loggingErr) {
            console.error("Failed to log error to DB:", loggingErr);
        }

        return NextResponse.json({ error: "Internal Error", details: error.message, success: false }, { status: 200 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Deposit, { DepositStatus } from "@/models/Deposit";
import Wallet from "@/models/Wallet";
import Transaction, { TransactionType } from "@/models/Transaction";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await req.json();

        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay Secret not defined");
        }

        // 1. Verify Signature (Security)
        // Formula: HMAC_SHA256(order_id + "|" + payment_id, secret)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        await connectToDatabase();

        // 2. Find the Deposit Record
        const deposit = await Deposit.findOne({ razorpayOrderId: razorpay_order_id });

        if (!deposit) {
            return NextResponse.json({ error: "Deposit record not found" }, { status: 404 });
        }

        if (deposit.status === DepositStatus.SUCCESS) {
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        if (isAuthentic) {
            // 3. SUCCESS FLOW

            // A. Update Deposit Status
            deposit.status = DepositStatus.SUCCESS;
            deposit.razorpayPaymentId = razorpay_payment_id;
            deposit.razorpaySignature = razorpay_signature;
            await deposit.save();

            // B. Update Wallet (Atomic Increment)
            await Wallet.findOneAndUpdate(
                { userId: session.user.id },
                {
                    $inc: {
                        balance: deposit.amount,
                        totalDeposited: deposit.amount
                    },
                }
            );

            // C. Log Deposit Transaction
            await Transaction.create({
                userId: session.user.id,
                type: TransactionType.DEPOSIT,
                amount: deposit.amount,
                referenceId: deposit._id,
                status: "SUCCESS",
                description: `Deposit via Razorpay (Order: ${razorpay_order_id})`,
            });

            // --- FEATURE 2: REFERRAL BONUS (1% of Deposit) ---
            const user = await import("@/models/User").then(mod => mod.default.findById(session.user.id));
            if (user && user.referredBy) {
                const REFERRAL_RATE = 0.01; // 1%
                const bonusAmount = Number((deposit.amount * REFERRAL_RATE).toFixed(2));

                if (bonusAmount > 0) {
                    // Credit Referrer
                    await Wallet.findOneAndUpdate(
                        { userId: user.referredBy },
                        { $inc: { balance: bonusAmount, totalProfit: bonusAmount } }
                    );

                    // Log Bonus Transaction for Referrer
                    await Transaction.create({
                        userId: user.referredBy,
                        type: TransactionType.REFERRAL_BONUS,
                        amount: bonusAmount,
                        status: "SUCCESS", // Instant credit
                        description: `Referral Bonus (1%) from ${user.name}'s deposit`,
                    });
                }
            }

            return NextResponse.json({ message: "Payment verified successfully" }, { status: 200 });
        } else {
            // 4. FAILURE FLOW
            deposit.status = DepositStatus.FAILED;
            await deposit.save();

            return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

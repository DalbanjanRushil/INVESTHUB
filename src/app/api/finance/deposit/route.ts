import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Deposit from "@/models/Deposit";
import Razorpay from "razorpay";
import { z } from "zod";

const depositSchema = z.object({
    amount: z.number().min(1, "Minimum deposit amount is 1 INR"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount } = depositSchema.parse(body);

        // Initialize Razorpay
        // NOTE: In a real app, these keys should be in process.env
        // We strictly use TEST MODE keys here.
        // We strictly use TEST MODE keys here.
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error("Razorpay keys are not defined in environment variables");
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Create Razorpay Order
        const options = {
            amount: amount * 100, // Amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: "Razorpay order creation failed" }, { status: 500 });
        }

        await connectToDatabase();

        // Log the Pending Deposit in DB
        const newDeposit = await Deposit.create({
            userId: session.user.id,
            amount: amount,
            razorpayOrderId: order.id,
            status: "PENDING",
        });

        return NextResponse.json(
            {
                orderId: order.id,
                amount: amount,
                currency: "INR",
                keyId: keyId, // Send public key to client
                depositId: newDeposit._id,
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Deposit Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

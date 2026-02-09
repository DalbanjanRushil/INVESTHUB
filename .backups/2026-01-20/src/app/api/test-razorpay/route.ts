import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        const hasId = !!keyId;
        const hasSecret = !!keySecret;

        console.log("TEST_RAZORPAY_DEBUG: Keys Present?", { hasId, hasSecret });

        if (!hasId || !hasSecret) {
            return NextResponse.json({ success: false, error: "Missing Keys from Environment", hasId, hasSecret }, { status: 200 });
        }

        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        console.log("TEST_RAZORPAY_DEBUG: Instance created. Attempting order...");

        const order = await instance.orders.create({
            amount: 100,
            currency: "INR",
            receipt: "test_connection_receipt",
        });

        console.log("TEST_RAZORPAY_DEBUG: Order created!", order.id);

        return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });
    } catch (error: any) {
        console.error("TEST_RAZORPAY_DEBUG: Error", error);
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 200 });
    }
}

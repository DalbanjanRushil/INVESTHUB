import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        // Find users who have this user's ID in their 'referredBy' field
        const referrals = await User.find({ referredBy: session.user.id })
            .select("name email createdAt status")
            .sort({ createdAt: -1 });

        // Fetch current user to get their code
        const currentUser = await User.findById(session.user.id).select("referralCode");

        return NextResponse.json({
            count: referrals.length,
            referrals,
            totalEarnings: referrals.length * 500, // Mock: 500 per referral
            myReferralCode: currentUser?.referralCode || "No Code Generated"
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

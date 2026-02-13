
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Investment from "@/models/Investment";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        // Fetch Users (excluding admins usually, or all users?)
        // "Active user card is shown where registered users are shown"
        const users = await User.find({ role: UserRole.USER }).sort({ createdAt: -1 });

        // Fetch additional data for alignment
        const enrichedUsers = await Promise.all(users.map(async (user) => {
            const wallet = await Wallet.findOne({ userId: user._id });
            const investments = await Investment.find({ userId: user._id, isActive: true });

            // Total Invested is the sum of all active investments (Flexi + Fixed)
            // Note: Wallet.principal mirrors Flexi, so adding it would be double counting.
            const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt,
                investedAmount: totalInvested,
                walletBalance: (wallet?.profit || 0) + (wallet?.referral || 0), // Liquid
                closureStatus: user.closureStatus,
                closureReason: user.closureReason,
                closureRequestedAt: user.closureRequestedAt
            };
        }));

        return NextResponse.json({ success: true, users: enrichedUsers });

    } catch (error: any) {
        console.error("Fetch Users Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

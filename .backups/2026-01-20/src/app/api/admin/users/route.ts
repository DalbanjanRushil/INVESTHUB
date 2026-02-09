import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole, UserStatus } from "@/models/User";
import Wallet from "@/models/Wallet";
import { z } from "zod";

// Schema for PATCH (Block/Unblock)
const updateStatusSchema = z.object({
    userId: z.string(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        // Fetch all users (excluding sensitive data)
        const users = await User.find({ role: UserRole.USER })
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();

        // Fetch corresponding wallets to display balance
        const usersWithWallet = await Promise.all(
            users.map(async (user) => {
                const wallet = await Wallet.findOne({ userId: user._id });
                return {
                    ...user,
                    wallet: wallet || {
                        principal: 0,
                        profit: 0,
                        referral: 0,
                        locked: 0,
                        balance: 0,
                        totalProfit: 0,
                        totalDeposited: 0
                    },
                };
            })
        );

        return NextResponse.json(usersWithWallet, { status: 200 });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, status } = updateStatusSchema.parse(body);

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(
            { message: "User status updated", user: updatedUser },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

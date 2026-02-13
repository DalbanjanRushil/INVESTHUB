
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { ClosureStatus } from "@/models/User";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.closureStatus !== ClosureStatus.REQUESTED) {
            return NextResponse.json({ error: "No pending closure request found." }, { status: 400 });
        }

        // Revert status
        user.closureStatus = ClosureStatus.NONE;
        user.closureReason = undefined;
        user.closureRequestedAt = undefined;
        await user.save();

        // Send Cancellation Email
        await sendEmail({
            to: user.email,
            subject: "Account Closure Request Cancelled",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Closure Request Cancelled</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your request to close your InvestHub account has been successfully cancelled.</p>
                    <p>You can continue using your account as normal.</p>
                    <br/>
                    <p>Best regards,</p>
                    <p>The InvestHub Team</p>
                </div>
            `,
        });

        return NextResponse.json({ message: "Closure request cancelled successfully." });

    } catch (error: any) {
        console.error("Cancel Closure Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

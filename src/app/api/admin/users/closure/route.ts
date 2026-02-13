import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User, { ClosureStatus, UserStatus } from "@/models/User"; // Fixed import 
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, action } = body; // action: 'APPROVE' | 'REJECT'

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(userId);

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (action === "APPROVE") {
            // Soft Delete / Close
            user.closureStatus = ClosureStatus.CLOSED;
            user.status = UserStatus.BLOCKED; // Prevent login

            // We might want to append "CLOSED_" to email to free up the email for re-registration?
            // For now, let's keep it unique to prevent re-registration with same email for audit.
            // But maybe we should rename it to free it? 
            // GDPR says right to be forgotten. 
            // Let's stick to "BLOCKED" for now as per plan.

            await user.save();

            await sendEmail({
                to: user.email,
                subject: "Account Closed - InvestHub",
                text: `Hi ${user.name},\n\nYour account has been closed as requested. You can no longer access the platform.\n\nThank you for being with us.\n\nInvestHub Team`
            });

            return NextResponse.json({ message: "User account closed successfully." });

        } else if (action === "REJECT") {
            user.closureStatus = ClosureStatus.NONE;
            user.closureReason = undefined;
            user.closureRequestedAt = undefined;
            await user.save();

            await sendEmail({
                to: user.email,
                subject: "Closure Request Rejected - InvestHub",
                text: `Hi ${user.name},\n\nYour request to close your account was not approved. Please contact support for more details.\n\nInvestHub Team`
            });

            return NextResponse.json({ message: "Closure request rejected." });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Admin Closure Action Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

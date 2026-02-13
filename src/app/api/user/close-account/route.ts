import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User, { ClosureStatus } from "@/models/User";
import Wallet from "@/models/Wallet";
import Investment from "@/models/Investment";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { reason } = body;

        await connectDB();

        const userId = session.user.id;

        // 1. Check Wallet Balance
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
            const totalBalance = (wallet.principal || 0) + (wallet.profit || 0) + (wallet.referral || 0) + (wallet.locked || 0);
            if (totalBalance > 1) { // Allow trivial dust < 1 rupee? Or strict 0? Let's say > 1 for safety against rounding errors, or strict > 0.
                // Strict 0 might be annoying if there is 0.0001
                if (totalBalance > 0.5) {
                    return NextResponse.json({
                        error: `You have remaining funds (₹${totalBalance.toFixed(2)}). Please withdraw them before closing your account.`
                    }, { status: 400 });
                }
            }
        }

        // 2. Check Active Investments
        const activeInvestments = await Investment.find({ userId, isActive: true, amount: { $gt: 0 } });
        if (activeInvestments.length > 0) {
            return NextResponse.json({
                error: "You have active investments. Please liquidate them before closing your account."
            }, { status: 400 });
        }

        // 3. Update User
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.closureStatus === ClosureStatus.REQUESTED) {
            return NextResponse.json({ error: "Closure request already pending." }, { status: 400 });
        }

        user.closureStatus = ClosureStatus.REQUESTED;
        user.closureReason = reason;
        user.closureRequestedAt = new Date();
        await user.save();

        // 4. Send Email
        await sendEmail({
            to: user.email,
            subject: "Account Closure Request Received - InvestHub",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #d32f2f;">Closure Request Received</h2>
                    <p>Hello ${user.name},</p>
                    <p>We have received your request to close your InvestHub account.</p>
                    <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
                    <p>Our team will review your request shortly. This process may take up to 24-48 hours.</p>
                    
                    <div style="background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeeba; border-radius: 8px; margin: 25px 0;">
                        <strong style="display: flex; align-items: center; gap: 8px; font-size: 16px;">
                            ⚠️ Important Security Check
                        </strong>
                        <p style="margin-top: 10px; margin-bottom: 0;">
                            If you did <strong>NOT</strong> request this, someone may have unauthorized access to your account.
                        </p>
                        <p style="margin-top: 10px;">
                            Please log in immediately and click <strong>"Cancel Request"</strong> in your profile settings.
                        </p>
                    </div>

                    <p style="color: #666; font-size: 14px;">Best regards,<br/>The InvestHub Team</p>
                </div>
            `
        });

        // Optional: Send Admin Notification (can implement later if needed)

        return NextResponse.json({ message: "Closure request submitted successfully." });

    } catch (error: any) {
        console.error("Closure Request Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

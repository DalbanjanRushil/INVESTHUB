
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
import crypto from "crypto";

const forgotSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = forgotSchema.parse(body);

        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) {
            // Security: Don't reveal if user exists
            return NextResponse.json(
                { message: "If that email exists, we have sent a reset link." },
                { status: 200 }
            );
        }

        // Generate Token
        // Create a random hex string
        const resetToken = crypto.randomBytes(32).toString("hex");
        // Hash it before storing in DB (optional but good practice, here we store raw for simplicity, or hash if desired. 
        // For simple implementations, storing raw token with expiry is okay if unrelated to password hash.)
        // We'll store the raw token but typically you'd hash it. 
        // Let's store raw token for simplicity in this MVP.

        const expiry = new Date(Date.now() + 3600000); // 1 Hour from now

        user.resetToken = resetToken;
        user.resetTokenExpiry = expiry;
        await user.save();

        // Send Email
        const { sendEmail } = await import("@/lib/email");
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: email,
            subject: "🔐 Reset Your Password - InvestHub",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <!-- Header -->
                    <div style="background-color: #0F172A; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">InvestHub</h1>
                    </div>

                    <!-- Body -->
                    <div style="background-color: #ffffff; padding: 40px 32px; text-align: center;">
                        <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Hi <strong>${user.name}</strong>,<br>
                            We received a request to reset the password for your InvestHub account. If you made this request, please click the button below to securely reset your password.
                        </p>

                        <!-- Button -->
                        <div style="margin: 32px 0;">
                            <a href="${resetUrl}" style="background: linear-gradient(to right, #2563EB, #4F46E5); background-color: #2563EB; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                Reset Password
                            </a>
                        </div>

                        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                            Or copy and paste this link into your browser:<br>
                            <a href="${resetUrl}" style="color: #2563EB; word-break: break-all;">${resetUrl}</a>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                         <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        <p style="color: #cbd5e1; font-size: 11px; margin-top: 8px;">
                            &copy; ${new Date().getFullYear()} InvestHub Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        });

        return NextResponse.json(
            { message: "If that email exists, we have sent a reset link." },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

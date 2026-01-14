
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetSchema = z.object({
    token: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, password } = resetSchema.parse(body);

        await connectToDatabase();

        // Find user with valid token and not expired
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        }).select("+resetToken +resetTokenExpiry"); // Must select explicitly as they are excluded by default

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update User
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        // Send Confirmation Email
        const { sendEmail } = await import("@/lib/email");
        sendEmail({
            to: user.email,
            subject: "✅ Password Reset Successful",
            html: `
                 <div style="font-family: Arial, sans-serif; color: #333;">
                     <h2>Password Changed</h2>
                     <p>Hi ${user.name},</p>
                     <p>Your password has been successfully reset. You can now login with your new password.</p>
                     <p>If this wasn't you, please contact support immediately.</p>
                 </div>
             `
        }).catch(err => console.error(err));

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

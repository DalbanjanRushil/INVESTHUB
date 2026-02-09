import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation Schema
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    referralCode: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validation
        const { name, email, password } = registerSchema.parse(body);

        await connectToDatabase();

        // 2. Check Exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists with this email" },
                { status: 409 }
            );
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 4. Create User (Transaction-like behavior by creating both sequentially)
        // In production, we'd use a transaction session, but for this scale, sequential is fine.

        // 4. Create User
        // Determine Role
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

        // --- FEATURE 2: REFERRAL SYSTEM ---
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const referralCode = `INVEST-HUB-${randomSuffix}`;

        let referrerId = null;
        if (body.referralCode) {
            // Robust Lookup: Trim whitespace, Case-insensitive match
            const cleanCode = body.referralCode.trim();
            const referrer = await User.findOne({
                referralCode: { $regex: new RegExp(`^${cleanCode}$`, "i") }
            });

            if (referrer) {
                referrerId = referrer._id;
            }
        }

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role,
            referralCode: referralCode, // Auto-generate for everyone
            referredBy: referrerId as any,
        });

        // 5. Create Wallet for User
        // 5. Create Wallet for User
        await Wallet.create({
            userId: newUser._id,
            balance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            totalProfit: 0,
        });

        // --- SEND WELCOME EMAIL ---
        const { sendEmail } = await import("@/lib/email");
        sendEmail({
            to: email,
            subject: "Welcome to InvestHub! 🚀",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Welcome, ${name}!</h1>
                    <p>You have successfully created your account on InvestHub.</p>
                    <p>Your referral code is: <strong>${referralCode}</strong></p>
                    <p>Start investing today and watch your dashboard for daily growth.</p>
                    <br>
                    <p>Best,<br>InvestHub Team</p>
                </div>
            `
        }).catch(err => console.error("Failed to send welcome email:", err));

        return NextResponse.json(
            { message: "User registered successfully", userId: newUser._id },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Registration Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

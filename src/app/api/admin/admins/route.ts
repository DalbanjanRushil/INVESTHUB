
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectDB();

        const admins = await User.find({ role: UserRole.ADMIN })
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json({ admins });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // Option: Could upgrade here, but for now let's say "User already exists" 
            // to avoid accidentally creating duplicate logic or overwriting without explicit consent logic.
            // Or we can just check if they are already admin.
            if (existingUser.role === UserRole.ADMIN) {
                return NextResponse.json({ error: "User is already an Admin." }, { status: 400 });
            }

            // If they are a regular user, we could upgrade them? 
            // The prompt says "admin can add the new admin". 
            // Let's assume creating a NEW user primarily, but if email exists as USER, we can upgrade them.
            // Let's upgrade them for convenience if they exist.
            existingUser.role = UserRole.ADMIN;
            // If password provided, DO NOT overwrite unless explicit? 
            // Actually, if we are "adding new admin" and they already have an account, 
            // maybe we shouldn't change their password.
            // But if it's a new person, we need initial password.

            await existingUser.save();
            return NextResponse.json({ message: "Existing user upgraded to Admin." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: "ACTIVE",
            payoutPreference: "COMPOUND",
            // Generate a random referral code or leave empty/handle in pre-save if exists
            referralCode: `ADMIN${Math.floor(1000 + Math.random() * 9000)}`
        });

        return NextResponse.json({ message: "New Admin created successfully." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

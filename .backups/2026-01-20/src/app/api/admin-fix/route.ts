
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectDB();

        const email = "dalbanjanrushil0@gmail.com";
        const password = "Rushil08@";

        // Check if exists
        let admin = await User.findOne({ email });

        if (admin) {
            // Update to Admin if not
            if (admin.role !== UserRole.ADMIN) {
                admin.role = UserRole.ADMIN;
                await admin.save();
                return NextResponse.json({ message: "Existing user updated to ADMIN." });
            }
            return NextResponse.json({ message: "Admin already exists and is configured." });
        } else {
            // Create New
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                name: "Rushil Admin",
                email: email,
                password: hashedPassword,
                role: UserRole.ADMIN,
                status: "ACTIVE",
                payoutPreference: "COMPOUND",
                referralCode: "ADMIN001"
            });
            return NextResponse.json({ message: "Admin Created Successfully." });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

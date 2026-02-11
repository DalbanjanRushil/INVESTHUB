
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { UserRole } from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
            if (existingUser.role === UserRole.ADMIN) {
                return NextResponse.json({ error: "User is already an Admin." }, { status: 400 });
            }

            existingUser.role = UserRole.ADMIN;
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
            referralCode: `ADMIN${Math.floor(1000 + Math.random() * 9000)}`
        });

        return NextResponse.json({ message: "New Admin created successfully." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { adminId } = await req.json();

        if (!adminId) {
            return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
        }

        // Prevent self-removal
        if (session.user.id === adminId) {
            return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
        }

        const user = await User.findById(adminId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Downgrade to USER instead of deleting
        user.role = UserRole.USER;
        await user.save();

        return NextResponse.json({ message: "Admin privileges revoked successfully." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

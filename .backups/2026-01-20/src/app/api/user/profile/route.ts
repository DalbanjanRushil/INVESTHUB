import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const user = await User.findById(session.user.id).select("-password");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Mock KYC data if not exists (schema update might be needed in real app, but we simulate)
        const userWithKYC = {
            ...user.toObject(),
            kycStatus: "VERIFIED", // Simulation: Everyone is verified for now or we add to schema
            phone: "+91 98765 43210", // Mock
        };

        return NextResponse.json(userWithKYC);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name } = body;

        await connectDB();
        const user = await User.findByIdAndUpdate(session.user.id, { name }, { new: true }).select("-password");

        return NextResponse.json({ message: "Profile updated", user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

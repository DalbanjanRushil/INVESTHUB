import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { preference } = await req.json();

        if (!["COMPOUND", "PAYOUT"].includes(preference)) {
            return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
        }

        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { payoutPreference: preference },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Preference updated successfully",
            preference: updatedUser.payoutPreference,
        });
    } catch (error) {
        console.error("Error updating payout preference:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

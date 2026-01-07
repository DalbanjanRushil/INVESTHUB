import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";
import { UserRole } from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        // Fetch global transactions, populated with user details (name/email)
        const transactions = await Transaction.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .limit(100); // Guard rails

        return NextResponse.json(transactions, { status: 200 });
    } catch (error) {
        console.error("Fetch Global Transactions Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

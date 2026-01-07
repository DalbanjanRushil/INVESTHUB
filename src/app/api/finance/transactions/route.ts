import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch last 50 transactions for the logged-in user
        const transactions = await Transaction.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(transactions, { status: 200 });
    } catch (error) {
        console.error("Fetch Transactions Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

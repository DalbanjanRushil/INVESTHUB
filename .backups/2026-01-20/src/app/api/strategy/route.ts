import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

export async function GET() {
    try {
        await connectDB();

        // Fetch the primary active strategy
        // In a multi-plan system, we might filter by ID, but for this "Pro" view, we show the main fund.
        const strategy = await InvestmentStrategy.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!strategy) {
            return NextResponse.json({ message: "No active strategy found. Please seed the database." }, { status: 404 });
        }

        return NextResponse.json({ strategy });
    } catch (error: any) {
        console.error("Error fetching strategy:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

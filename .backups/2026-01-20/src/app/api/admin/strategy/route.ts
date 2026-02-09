import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, data } = body;

        await connectDB();
        const strategy = await InvestmentStrategy.findOne({ isActive: true });

        if (!strategy) {
            return NextResponse.json({ error: "No active strategy found" }, { status: 404 });
        }

        if (action === "ADD_HISTORY") {
            // data: { date: string, roi: number }
            strategy.history.push({
                date: data.date,
                roi: data.roi
            });
            // Optional: Limit history to last 24 months to keep array clean? 
            // For now, keep all.
        } else if (action === "UPDATE_ALLOCATION") {
            // data: AllocationItem[]
            // Validate 100%
            const total = data.reduce((acc: number, item: any) => acc + item.percentage, 0);
            if (total !== 100) {
                return NextResponse.json({ error: `Allocation must equal 100% (Current: ${total}%)` }, { status: 400 });
            }
            strategy.allocation = data;
        } else if (action === "UPDATE_DETAILS") {
            // data: { description, managerMessage, etc }
            if (data.managerMessage) strategy.managerMessage = data.managerMessage;
            if (data.description) strategy.description = data.description;
            if (data.riskLevel) strategy.riskLevel = data.riskLevel;
        }

        await strategy.save();

        return NextResponse.json({ message: "Strategy updated successfully", strategy });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

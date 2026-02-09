import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Only return LOCKED periods to users
        const periods = await PerformancePeriod.find({ locked: true })
            .sort({ createdAt: 1 }) // Chronological for charts
            .select("-grossProfit -grossLoss -adminShare -declaredBy") // Hide backend details if needed, but transparency suggests showing most. Notes are good.
            // Actually, transparency means showing Gross/Net. Let's send it all except admin-specific IDs.
            .select("-declaredBy");

        return NextResponse.json(periods);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod, { PerformancePeriodType } from "@/models/PerformancePeriod";
import { z } from "zod";

// Schema for Creating/Updating Performance Period
const performanceSchema = z.object({
    periodType: z.enum([PerformancePeriodType.MONTHLY, PerformancePeriodType.QUARTERLY, PerformancePeriodType.YEARLY]),
    periodLabel: z.string().min(3),
    grossProfit: z.number().min(0),
    grossLoss: z.number().min(0),
    capitalDeployed: z.number().min(1),
    notes: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        const periods = await PerformancePeriod.find().sort({ createdAt: -1 });
        return NextResponse.json(periods);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const validated = performanceSchema.parse(body);

        await connectToDatabase();

        // Check for duplicates
        const existing = await PerformancePeriod.findOne({ periodLabel: validated.periodLabel });
        if (existing) {
            return NextResponse.json({ error: "A performance period with this label already exists." }, { status: 400 });
        }

        // Calculate Derived
        const netProfit = validated.grossProfit - validated.grossLoss;
        const roiPercent = (netProfit / validated.capitalDeployed) * 100;

        // Split (50/50 net profit) - Admin takes 50%, Investors take 50%
        // NOTE: If Net Profit is negative, shares are 0 (or negative? Usually losses aren't split this way on display, but logic holds)
        const share = netProfit > 0 ? netProfit / 2 : 0;

        const newPeriod = await PerformancePeriod.create({
            ...validated,
            netProfit,
            roiPercent,
            adminShare: share,
            investorShare: share,
            declaredBy: session.user.id,
            locked: false,
        });

        return NextResponse.json(newPeriod, { status: 201 });

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

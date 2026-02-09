import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod, { PerformancePeriodType } from "@/models/PerformancePeriod";
import { z } from "zod";

// Schema for Creating Historical Performance
const historySchema = z.object({
    periodType: z.enum([PerformancePeriodType.DAILY, PerformancePeriodType.MONTHLY, PerformancePeriodType.QUARTERLY, PerformancePeriodType.YEARLY]),
    periodLabel: z.string().min(3),
    grossProfit: z.number().min(0),
    grossLoss: z.number().min(0),
    capitalDeployed: z.number().min(1),
    notes: z.string().optional(),
    metrics: z.record(z.string(), z.any()).optional(), // JSON Object for Map
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        // Fetch only historical or all? 
        // Let's fetch all but sort by date descending (using periodLabel or createdAt can be tricky for backfilled data).
        // Since backfilled data has new createdAt, we might need a 'periodDate' field in the future, but for now we rely on periodLabel sort or just createdAt.
        // Actually, let's just return all and let frontend sort/filter.
        const periods = await PerformancePeriod.find({ isHistorical: true }).sort({ createdAt: -1 });
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
        const validated = historySchema.parse(body);

        await connectToDatabase();

        // Check for duplicates
        const existing = await PerformancePeriod.findOne({ periodLabel: validated.periodLabel });
        if (existing) {
            return NextResponse.json({ error: "A performance period with this label already exists." }, { status: 400 });
        }

        // Calculate Derived
        const netProfit = validated.grossProfit - validated.grossLoss;
        const roiPercent = (netProfit / validated.capitalDeployed) * 100;

        // Split logic (even for history, we might want to record what it *would* have been)
        const share = netProfit > 0 ? netProfit / 2 : 0;

        const newPeriod = await PerformancePeriod.create({
            ...validated,
            netProfit,
            roiPercent,
            adminShare: share,
            investorShare: share,
            declaredBy: session.user.id,
            locked: true, // History is locked by default
            isHistorical: true, // MARKER
            distributionLinked: false, // No payout
            metrics: validated.metrics || {},
        });

        return NextResponse.json(newPeriod, { status: 201 });

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await connectToDatabase();
        await PerformancePeriod.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

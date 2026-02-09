import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";
import Wallet from "@/models/Wallet";
import Investment from "@/models/Investment";

export const dynamic = 'force-dynamic';

/**
 * Projected Growth Engine API
 * Fetches InvestHub historical performance data and user portfolio structure
 * to calculate realistic growth projections
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Fetch Historical Performance Data (Last 12 months)
        const historicalPerformance = await PerformancePeriod.find({
            locked: true, // Only use locked/finalized periods
        })
            .sort({ createdAt: -1 })
            .limit(12)
            .select('roiPercent periodLabel createdAt')
            .lean();

        // 2. Fetch User Portfolio Structure
        const [wallet, activeInvestments, user] = await Promise.all([
            Wallet.findOne({ userId: session.user.id }).lean(),
            Investment.find({ userId: session.user.id, isActive: true }).lean(),
            (async () => {
                const User = (await import('@/models/User')).default;
                return User.findById(session.user.id).select('payoutPreference').lean();
            })(),
        ]);

        // 3. Calculate Effective Capital
        // NOTE: Active investments are already reflected in wallet.locked
        // So we don't add investmentTotal to prevent double-counting
        const principal = wallet?.principal || 0;
        const profit = wallet?.profit || 0;
        const referral = wallet?.referral || 0;
        const locked = wallet?.locked || 0;
        const investmentTotal = activeInvestments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

        // Effective Capital = All available funds (liquid + locked)
        const effectiveCapital = principal + profit + referral + locked;

        // 4. Calculate Weighted ROI
        const roiData = calculateWeightedROI(historicalPerformance);

        // 5. Prepare Response
        return NextResponse.json({
            success: true,
            data: {
                // User Portfolio
                portfolio: {
                    effectiveCapital,
                    principal,
                    profit,
                    referral,
                    investedAmount: investmentTotal,
                    payoutPreference: user?.payoutPreference || "COMPOUND",
                },
                // InvestHub Performance
                performance: {
                    avgROI: roiData.avgROI,
                    recentROI: roiData.recentROI,
                    longTermROI: roiData.longTermROI,
                    weightedROI: roiData.weightedROI,
                    periodsAnalyzed: historicalPerformance.length,
                    dataQuality: roiData.dataQuality,
                },
                // Historical Data
                history: historicalPerformance.map(p => ({
                    period: p.periodLabel,
                    roi: p.roiPercent,
                    date: p.createdAt,
                })),
            },
        });

    } catch (error: any) {
        console.error("[Projected Growth API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch projection data", details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Calculate Weighted ROI from historical performance
 * Recent periods (last 3) weighted 60%, long-term weighted 40%
 */
function calculateWeightedROI(periods: any[]) {
    if (!periods || periods.length === 0) {
        return {
            avgROI: 24, // Default fallback
            recentROI: 24,
            longTermROI: 24,
            weightedROI: 24,
            dataQuality: "NO_DATA",
        };
    }

    // Calculate average of all periods
    const avgROI = periods.reduce((sum, p) => sum + p.roiPercent, 0) / periods.length;

    // Recent 3 months average
    const recentPeriods = periods.slice(0, Math.min(3, periods.length));
    const recentROI = recentPeriods.reduce((sum, p) => sum + p.roiPercent, 0) / recentPeriods.length;

    // Long-term (all periods) average
    const longTermROI = avgROI;

    // Weighted calculation: 60% recent, 40% long-term
    const recentWeight = 0.6;
    const longTermWeight = 0.4;
    const weightedROI = (recentWeight * recentROI) + (longTermWeight * longTermROI);

    // Data quality assessment
    let dataQuality = "EXCELLENT";
    if (periods.length < 3) dataQuality = "LIMITED";
    else if (periods.length < 6) dataQuality = "GOOD";

    return {
        avgROI: Number(avgROI.toFixed(2)),
        recentROI: Number(recentROI.toFixed(2)),
        longTermROI: Number(longTermROI.toFixed(2)),
        weightedROI: Number(weightedROI.toFixed(2)),
        dataQuality,
    };
}

"use client";

import { Activity, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface IntelligenceProps {
    periods: any[];
    distributions: any[];
}

export default function PerformanceIntelligence({ periods, distributions }: IntelligenceProps) {
    if (!periods || periods.length < 2) {
        return (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl opacity-50">
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent-secondary" />
                    System Intelligence
                </h3>
                <p className="text-muted-foreground text-sm">Not enough data to generate intelligence report. Declare at least 2 periods.</p>
            </div>
        );
    }

    // 1. Consistency Index (Volatility of ROI)
    const roiValues = periods.map(p => p.roiPercent);
    const avgRoi = roiValues.reduce((a, b) => a + b, 0) / roiValues.length;
    const squareDiffs = roiValues.map(value => Math.pow(value - avgRoi, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // Score out of 100 (Lower stdDev is better). Arbitrary scale: 0-5% deviation is good.
    const consistencyScore = Math.max(0, 100 - (stdDev * 10));
    let consistencyLabel = "Volatile";
    if (consistencyScore > 80) consistencyLabel = "Highly Consistent";
    else if (consistencyScore > 50) consistencyLabel = "Moderate";

    // 2. Integrity Checks
    let mismatches = 0;
    let verifiedLiquidity = 0;

    periods.forEach(period => {
        if (period.distributionLinked) {
            const dist = distributions.find(d => d.performancePeriodId === period._id);
            if (dist) {
                const delta = Math.abs(period.investorShare - dist.userShare);
                if (delta > 5) mismatches++; // Allow small rounding error
                verifiedLiquidity += dist.totalProfit;
            } else {
                // Linked but no record found? Odd, but countable
                mismatches++;
            }
        }
    });

    // 3. Growth Readiness
    // Compare latest capital vs first capital
    const sortedPeriods = [...periods].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstCap = sortedPeriods[0].capitalDeployed;
    const lastCap = sortedPeriods[sortedPeriods.length - 1].capitalDeployed;
    const growthRate = ((lastCap - firstCap) / firstCap) * 100;

    let readinessLabel = "Hold";
    if (growthRate > 10 && consistencyScore > 60) readinessLabel = "Scale Up";
    if (consistencyScore < 40) readinessLabel = "Reduce Risk";

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent-secondary" />
                System Intelligence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Consistency Card */}
                <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">ROI Consistency</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-2xl font-bold text-foreground">{consistencyScore.toFixed(0)}/100</span>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${consistencyScore > 70 ? 'bg-accent-primary/20 text-accent-primary' : 'bg-warning/20 text-warning'}`}>
                            {consistencyLabel}
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Std Dev: {stdDev.toFixed(2)}%</p>
                </div>

                {/* Integrity Card */}
                <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Distribution Integrity</p>
                    <div className="mt-2 flex items-end gap-2">
                        {mismatches === 0 ? (
                            <span className="text-2xl font-bold text-accent-primary flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6" /> 100%
                            </span>
                        ) : (
                            <span className="text-2xl font-bold text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6" /> {mismatches} Flags
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                        {mismatches === 0 ? "All distributions match declarations." : "Mismatch between declared & distributed values."}
                    </p>
                </div>

                {/* Growth Card */}
                <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Growth Signal</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-2xl font-bold text-foreground">{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</span>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${readinessLabel === 'Scale Up' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                            {readinessLabel}
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Capital Deployed Trend</p>
                </div>
            </div>
        </div>
    );
}

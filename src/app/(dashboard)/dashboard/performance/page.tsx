import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";
import Transaction, { TransactionType } from "@/models/Transaction";
import { redirect } from "next/navigation";
import PerformanceCharts from "@/components/dashboard/performance/PerformanceCharts";
import AttributionTable from "@/components/dashboard/performance/AttributionTable";
import { Zap, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

async function getData(userId: string) {
    await connectToDatabase();
    const [periods, transactions] = await Promise.all([
        PerformancePeriod.find({ locked: true }).sort({ createdAt: 1 }).lean(),
        Transaction.find({
            userId,
            type: TransactionType.PROFIT
        }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    return {
        periods: JSON.parse(JSON.stringify(periods)),
        transactions: JSON.parse(JSON.stringify(transactions))
    };
}

export default async function UserPerformancePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    const { periods, transactions } = await getData(session.user.id);

    // Calculate Summary Stats
    const totalNetProfit = periods.reduce((sum: number, p: any) => sum + (p.netProfit || 0), 0);
    const avgRoi = periods.length > 0
        ? (periods.reduce((sum: number, p: any) => sum + (p.roiPercent || 0), 0) / periods.length)
        : 0;
    const bestPeriod = periods.reduce((prev: any, current: any) => (prev.roiPercent > current.roiPercent) ? prev : current, periods[0] || {});

    // Personal Stats
    const myTotalProfit = transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    return (
        <div className="space-y-8 min-h-screen bg-[#0B1120] text-white p-8 -m-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-8 text-white shadow-xl border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-64 h-64 text-cyan-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Performance Ledger</h1>
                    <p className="text-slate-400 max-w-2xl">
                        Transparent, immutable record of our trading performance.
                        See exactly how market movements translate to your profit share.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1E293B] p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total System Profit</p>
                    <h3 className="text-2xl font-bold text-white">₹{totalNetProfit.toLocaleString()}</h3>
                </div>
                <div className="bg-[#1E293B] p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Average ROI / Period</p>
                    <h3 className="text-2xl font-bold text-emerald-400">{avgRoi.toFixed(2)}%</h3>
                </div>
                <div className="bg-[#1E293B] p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Best Month</p>
                    <h3 className="text-xl font-bold text-blue-400 truncate">{bestPeriod.periodLabel || "N/A"}</h3>
                    <p className="text-xs text-emerald-400">{bestPeriod.roiPercent ? `+${bestPeriod.roiPercent.toFixed(2)}%` : ""}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-xl border border-emerald-500/30 shadow-lg text-white">
                    <p className="text-xs font-bold uppercase text-emerald-100 mb-1">Your Total Share</p>
                    <h3 className="text-2xl font-bold">₹{myTotalProfit.toLocaleString()}</h3>
                </div>
            </div>

            {/* Charts */}
            <PerformanceCharts data={periods} />

            {/* Attribution Table */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                    Your Attribution History
                </h3>
                <AttributionTable transactions={transactions} />
            </div>
        </div>
    );
}

import PerformanceEntryForm from "@/components/forms/PerformanceEntryForm";
import PerformanceHistory from "@/components/admin/PerformanceHistory";
import PerformanceIntelligence from "@/components/admin/PerformanceIntelligence";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";
import ProfitDistribution from "@/models/ProfitDistribution";
import { redirect } from "next/navigation";
import { History, Target, BrainCircuit } from "lucide-react";

async function getData() {
    await connectToDatabase();

    // Fetch Periods
    const periods = await PerformancePeriod.find().sort({ createdAt: -1 }).lean();

    // Fetch Distributions (for Integrity Checks)
    const distributions = await ProfitDistribution.find({ performancePeriodId: { $ne: null } }).lean();

    return {
        periods: JSON.parse(JSON.stringify(periods)),
        distributions: JSON.parse(JSON.stringify(distributions))
    };
}

export default async function PerformancePage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const { periods, distributions } = await getData();

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8 min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                            Performance Engine
                        </h1>
                        <p className="text-slate-400 font-medium">Declare, Lock, and Publish financial results.</p>
                    </div>
                </div>
            </div>

            {/* Phase 3: Intelligence Layer */}
            <PerformanceIntelligence periods={periods} distributions={distributions} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Entry Form */}
                <div className="lg:col-span-1">
                    <PerformanceEntryForm />
                </div>

                {/* Right: History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-start gap-4">
                        <History className="w-6 h-6 text-cyan-500 mt-1" />
                        <div>
                            <h4 className="font-bold text-white mb-1">How this works</h4>
                            <p className="text-sm text-slate-400">
                                1. <strong>Declare</strong> a period (Draft). It calculates Net Profit & ROI.<br />
                                2. <strong>Review</strong> the figures in the list below.<br />
                                3. <strong>Lock</strong> the period. This makes it visible on user dashboards and available for profit distribution binding.
                            </p>
                        </div>
                    </div>
                    <PerformanceHistory periods={periods} />
                </div>
            </div>
        </div>
    );
}

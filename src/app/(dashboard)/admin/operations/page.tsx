import ProfitDistributionForm from "@/components/forms/ProfitDistributionForm";
import SettlementForm from "@/components/forms/SettlementForm";
import FullSettlementForm from "@/components/forms/FullSettlementForm";
import WithdrawalTable from "@/components/admin/WithdrawalTable";
import connectToDatabase from "@/lib/db";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import PerformancePeriod from "@/models/PerformancePeriod";
import { Layers, ShieldCheck, ArrowRight } from "lucide-react";

async function getPendingWithdrawals() {
    await connectToDatabase();
    const list = await Withdrawal.find({ status: WithdrawalStatus.PENDING })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(list));
}

async function getDistributablePeriods() {
    await connectToDatabase();
    // Fetch periods that are LOCKED but NOT yet distributed (distributionLinked = false)
    const periods = await PerformancePeriod.find({
        locked: true,
        distributionLinked: false
    })
        .sort({ createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(periods));
}

export default async function AdminOperationsPage() {
    const [pendingWithdrawals, performancePeriods] = await Promise.all([
        getPendingWithdrawals(),
        getDistributablePeriods()
    ]);

    return (

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8 min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
                            Financial Operations
                        </h1>
                        <p className="text-muted-foreground font-medium">Manage withdrawals, distribute profits, and settlements.</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        System Active
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Financial Controls */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                        <h3 className="font-bold flex items-center gap-2 mb-8 text-xl text-foreground border-b border-border pb-4">
                            <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            Profit & Settlement Protocol
                        </h3>
                        <div className="space-y-10 relative z-10">
                            <ProfitDistributionForm performancePeriods={performancePeriods} />
                            <div className="h-px bg-border w-full" />
                            <SettlementForm />
                            <div className="h-px bg-border w-full" />
                            <FullSettlementForm />
                        </div>
                    </div>
                </div>

                {/* Right: Withdrawal Management */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl h-fit relative">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                        <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                            Withdrawal Queue
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </h3>
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            {pendingWithdrawals.length} Pending Actions
                        </span>
                    </div>
                    <WithdrawalTable data={pendingWithdrawals} />
                </div>
            </div>
        </div>
    );

}

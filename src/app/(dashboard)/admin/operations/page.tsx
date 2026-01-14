import ProfitDistributionForm from "@/components/forms/ProfitDistributionForm";
import SettlementForm from "@/components/forms/SettlementForm";
import WithdrawalTable from "@/components/admin/WithdrawalTable";
import connectToDatabase from "@/lib/db";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import { Layers, ShieldCheck, ArrowRight } from "lucide-react";

async function getPendingWithdrawals() {
    await connectToDatabase();
    const list = await Withdrawal.find({ status: WithdrawalStatus.PENDING })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(list));
}

export default async function AdminOperationsPage() {
    const pendingWithdrawals = await getPendingWithdrawals();

    return (

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8 min-h-screen bg-[#020617]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                            Financial Operations
                        </h1>
                        <p className="text-slate-400 font-medium">Manage withdrawals, distribute profits, and settlements.</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        System Active
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Financial Controls */}
                <div className="space-y-6">
                    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                        <h3 className="font-bold flex items-center gap-2 mb-8 text-xl text-white border-b border-slate-800 pb-4">
                            <ShieldCheck className="w-6 h-6 text-cyan-400" />
                            Profit & Settlement Protocol
                        </h3>
                        <div className="space-y-10 relative z-10">
                            <ProfitDistributionForm />
                            <div className="h-px bg-slate-800 w-full" />
                            <SettlementForm />
                        </div>
                    </div>
                </div>

                {/* Right: Withdrawal Management */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl h-fit relative">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                        <h3 className="font-bold text-xl text-white flex items-center gap-2">
                            Withdrawal Queue
                            <ArrowRight className="w-5 h-5 text-slate-500" />
                        </h3>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            {pendingWithdrawals.length} Pending Actions
                        </span>
                    </div>
                    <WithdrawalTable data={pendingWithdrawals} />
                </div>
            </div>
        </div>
    );

}

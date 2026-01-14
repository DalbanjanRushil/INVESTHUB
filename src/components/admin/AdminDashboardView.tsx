"use client";

import AdminRealTimeUpdater from "@/components/admin/AdminRealTimeUpdater";
import { Users, Landmark, AlertTriangle, ArrowUpRight, Activity, Layers, FileText, ArrowRight, Rss, ShieldAlert, Database } from "lucide-react";
import Link from "next/link";
import ContentFeed from "@/components/dashboard/ContentFeed";
import { cn } from "@/lib/utils";

interface AdminDashboardViewProps {
    stats: {
        userCount: number;
        poolCapital: number;
        pendingWithdrawals: number;
        pendingWithdrawalsList: any[];
    };
}

export default function AdminDashboardView({ stats }: AdminDashboardViewProps) {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30">
            <AdminRealTimeUpdater />

            {/* Admin Header (Inline) */}
            <div className="border-b border-slate-800/60 bg-[#0F172A]/50 backdrop-blur-md sticky top-0 z-30">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(8,145,178,0.5)]">
                            ADM
                        </div>
                        <span className="text-white font-semibold tracking-wide text-sm">INVESTHUB <span className="text-slate-600 font-normal mx-2">|</span> <span className="text-cyan-500">COMMAND CENTER</span></span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                            <ShieldAlert className="w-3 h-3 text-emerald-500" /> SYSTEM SECURE
                        </span>
                        <span>V 2.5.0</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Hero Metrics - Global Command */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Pool Capital */}
                    <div className="relative overflow-hidden rounded-md bg-[#0F172A] border border-cyan-500/30 shadow-[0_0_30px_rgba(8,145,178,0.1)] group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Landmark className="w-24 h-24 text-cyan-500" />
                        </div>
                        <div className="p-6 relative z-10">
                            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-1">Total Liquidity Pool</p>
                            <h2 className="text-4xl font-bold font-mono tracking-tighter tabular-nums text-white mt-2">
                                ₹{stats.poolCapital.toLocaleString()}
                            </h2>
                            <div className="mt-6 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500 w-[70%] shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
                                <span>ALLOCATED: 70%</span>
                                <span>RESERVE: 30%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Investors */}
                    <div className="rounded-md bg-[#0F172A] border border-slate-800 p-6 shadow-sm hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Registered Investors</span>
                                <h2 className="text-3xl font-bold mt-2 font-mono tabular-nums text-white">
                                    {stats.userCount}
                                </h2>
                            </div>
                            <div className="flex flex-col items-end">
                                <Users className="w-5 h-5 text-slate-600" />
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    <ArrowUpRight className="w-3 h-3" /> ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Pending Actions */}
                    <Link href="/admin/operations" className={cn(
                        "rounded-md bg-[#0F172A] border p-6 shadow-sm transition-all group block relative overflow-hidden",
                        stats.pendingWithdrawals > 0
                            ? "border-amber-500/50 hover:bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                            : "border-slate-800 hover:border-slate-700"
                    )}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={cn("text-xs font-bold uppercase tracking-widest", stats.pendingWithdrawals > 0 ? "text-amber-500" : "text-slate-500")}>
                                    Action Required
                                </span>
                                <h2 className={cn("text-3xl font-bold mt-2 font-mono tabular-nums", stats.pendingWithdrawals > 0 ? "text-amber-400/90" : "text-white")}>
                                    {stats.pendingWithdrawals}
                                </h2>
                            </div>
                            <div className={cn("p-2 rounded-full", stats.pendingWithdrawals > 0 ? "bg-amber-500/10 text-amber-500 animate-pulse" : "bg-slate-800 text-slate-600")}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        {stats.pendingWithdrawals > 0 && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/50"></div>
                        )}
                        <p className="text-xs text-slate-500 mt-2 group-hover:text-amber-400 transition-colors">
                            {stats.pendingWithdrawals > 0 ? "Withdrawal requests pending review" : "No pending items"}
                        </p>
                    </Link>
                </div>

                {/* Technical Panels */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1 border-l-4 border-cyan-600">
                        System Modules
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/admin/investments" className="group p-6 bg-[#1e293b] border border-slate-700 rounded-md hover:border-cyan-500 hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-slate-900 rounded text-cyan-400 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-200 group-hover:text-white">Strategy Manager</h3>
                                <p className="text-xs text-slate-500 mt-1">Configure ROI rates & allocations</p>
                            </div>
                        </Link>

                        <Link href="/admin/operations" className="group p-6 bg-[#1e293b] border border-slate-700 rounded-md hover:border-cyan-500 hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-slate-900 rounded text-cyan-400 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                                    <Database className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-200 group-hover:text-white">Operations Ledger</h3>
                                <p className="text-xs text-slate-500 mt-1">Process settlements & withdrawals</p>
                            </div>
                        </Link>

                        <Link href="/admin/content" className="group p-6 bg-[#1e293b] border border-slate-700 rounded-md hover:border-cyan-500 hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-slate-900 rounded text-cyan-400 group-hover:text-cyan-300 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-200 group-hover:text-white">Content Studio</h3>
                                <p className="text-xs text-slate-500 mt-1">Publish market signals & videos</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Content Monitoring */}
                <div className="bg-[#0b1120] border border-slate-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
                            <Rss className="w-4 h-4 text-cyan-500" />
                            Live Content Feed
                        </h2>
                        <Link href="/admin/content" className="text-xs font-mono text-cyan-500 hover:text-cyan-400 hover:underline">
                            MANAGE FEED
                        </Link>
                    </div>
                    <div className="opacity-90">
                        <ContentFeed />
                    </div>
                </div>
            </main>
        </div>
    );
}

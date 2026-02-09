"use client";

import React, { useEffect, useState } from "react";
import AllocationChart from "./AllocationChart";
import PerformanceGraph from "./PerformanceGraph";

import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, AlertTriangle, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyData {
    name: string;
    description: string;
    riskLevel: string;
    minInvestment: number;
    lockInPeriod: number;
    allocation: any[];
    history: any[];
    conservativeROI: number;
}

export default function InvestmentModule() {
    const [strategy, setStrategy] = useState<StrategyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStrategy() {
            try {
                const res = await fetch("/api/strategy");
                const json = await res.json();

                // Use the first active strategy as the primary showcase
                if (json.success && json.data.strategies?.length > 0) {
                    setStrategy(json.data.strategies[0]);
                }
            } catch (error) {
                console.error("Failed to load strategy", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStrategy();
    }, []);

    if (loading) return <SkeletonLoader />;
    if (!strategy) return null;

    return (
        <section className="space-y-8 text-slate-200">
            {/* Header Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Layers className="w-5 h-5 text-purple-400" />
                        </div>
                        Strategic Portfolio Alpha
                    </h2>
                    <p className="text-sm text-slate-400 mt-1 pl-12">Automated algorithmic rebalancing & growth tracking</p>
                </div>
                <div className="flex gap-3 pl-12 md:pl-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">{strategy.conservativeROI}% Conservative APY</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-blue-400">{strategy.riskLevel} Risk</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Asset Allocation (Chart Container) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" /> Allocation Breakdown
                        </h3>
                        <div className="px-2 py-1 rounded bg-[#1E293B] text-xs text-slate-300 border border-slate-700">Real-time</div>
                    </div>

                    <div className="relative h-[350px] w-full bg-gradient-to-b from-[#1E293B]/20 to-transparent rounded-2xl p-4 border border-dashed border-slate-800/50">
                        {/* Pass a prop to ensure chart text is white/contrasted */}
                        <AllocationChart data={strategy.allocation} />
                    </div>
                </motion.div>

                {/* 2. Performance Graph (Chart Container) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" /> Performance Curve
                        </h3>
                        <div className="flex bg-[#1E293B] rounded-lg p-1 border border-slate-700">
                            {['1M', '3M', '6M', '1Y'].map(period => (
                                <button key={period} className={cn(
                                    "px-3 py-1 rounded text-[10px] font-bold transition-all",
                                    period === '1Y' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                )}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[350px] w-full bg-gradient-to-b from-[#1E293B]/20 to-transparent rounded-2xl p-4 border border-dashed border-slate-800/50">
                        <PerformanceGraph data={strategy.history} />
                    </div>
                </motion.div>
            </div>

            {/* 3. Lock-In Timeline Removed as per user request */}
        </section>
    );
}

function SkeletonLoader() {
    return (
        <div className="space-y-6">
            <div className="h-20 w-full bg-[#1E293B] rounded-2xl animate-pulse border border-slate-800" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px] bg-[#0F172A] rounded-3xl animate-pulse border border-slate-800" />
                <div className="h-[400px] bg-[#0F172A] rounded-3xl animate-pulse border border-slate-800" />
            </div>
        </div>
    );
}

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

    const [selectedPeriod, setSelectedPeriod] = useState("1Y");

    useEffect(() => {
        async function fetchStrategy() {
            try {
                const res = await fetch("/api/strategy");
                const json = await res.json();

                // Use the first active strategy as the primary showcase
                if (json.success && json.data.strategies?.length > 0) {
                    const primary = json.data.strategies[0];

                    // Fallback generator for demo if history is missing
                    if (!primary.history || primary.history.length === 0) {
                        const now = new Date();
                        const fallbackHistory = [];
                        let currentRoi = 0;
                        const targetRoi = primary.conservativeROI || 10;

                        for (let i = 11; i >= 0; i--) {
                            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            // Simple cumulative growth curve
                            currentRoi += (targetRoi / 12) + (Math.random() * 0.5 - 0.25);
                            fallbackHistory.push({
                                date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                                roi: Number(Math.max(0, currentRoi).toFixed(2))
                            });
                        }
                        primary.history = fallbackHistory;
                    }

                    setStrategy(primary);
                }
            } catch (error) {
                console.error("Failed to load strategy", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStrategy();
    }, []);

    const getFilteredHistory = () => {
        if (!strategy?.history) return [];

        const now = new Date();
        const cutoffDate = new Date();

        switch (selectedPeriod) {
            case "1M":
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case "3M":
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case "6M":
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
            case "1Y":
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                cutoffDate.setFullYear(now.getFullYear() - 1);
        }

        return strategy.history.filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate >= cutoffDate;
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    if (loading) return <SkeletonLoader />;
    if (!strategy) return null;

    return (
        <section className="space-y-8 text-foreground">
            {/* Header Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-lg">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Strategic Portfolio Alpha
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 pl-12">Automated algorithmic rebalancing & growth tracking</p>
                </div>
                <div className="flex gap-3 pl-12 md:pl-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{strategy.conservativeROI}% Conservative APY</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{strategy.riskLevel} Risk</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Asset Allocation (Chart Container) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-card border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" /> Allocation Breakdown
                        </h3>
                        <div className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground border border-border">Real-time</div>
                    </div>

                    <div className="relative h-[350px] w-full bg-gradient-to-b from-secondary/30 to-transparent rounded-2xl p-4 border border-dashed border-border/50">
                        {/* Pass a prop to ensure chart text is white/contrasted */}
                        <AllocationChart data={strategy.allocation} />
                    </div>
                </motion.div>

                {/* 2. Performance Graph (Chart Container) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full bg-card border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" /> Performance Curve
                        </h3>
                        <div className="flex bg-secondary rounded-lg p-1 border border-border">
                            {['1M', '3M', '6M', '1Y'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={cn(
                                        "px-3 py-1 rounded text-[10px] font-bold transition-all",
                                        selectedPeriod === period ? 'bg-emerald-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'
                                    )}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[350px] w-full bg-gradient-to-b from-secondary/30 to-transparent rounded-2xl p-4 border border-dashed border-border/50">
                        <PerformanceGraph data={getFilteredHistory()} />
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
            <div className="h-20 w-full bg-card rounded-2xl animate-pulse border border-border" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px] bg-card rounded-3xl animate-pulse border border-border" />
                <div className="h-[400px] bg-card rounded-3xl animate-pulse border border-border" />
            </div>
        </div>
    );
}

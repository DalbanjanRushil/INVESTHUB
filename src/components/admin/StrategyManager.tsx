"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    PieChart,
    TrendingUp,
    Briefcase,
    Globe,
    Zap,
    ArrowUpRight,
    Lock,
    Info,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

interface Strategy {
    _id: string;
    name: string;
    category: string;
    description: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    minInvestment: number;
    lockInPeriod: number;
    totalCapitalDeployed: number;
    conservativeROI: number;
    internalROI?: number; // Only for admin
    roi?: number; // Conservative ROI for users
    status: string;
    allocation: any[];
    tenureAllocation?: {
        flexi: number;
        months3: number;
        months6: number;
        months12: number;
    };
}

interface StrategyManagerProps {
    strategies: Strategy[];
    metrics: {
        totalDeployed: number;
        availableLiquid?: number;
        activeCount: number;
        avgConservativeROI: number;
        riskDistribution: { low: number; medium: number; high: number };
    };
    isAdmin?: boolean;
    onEdit?: (strategy: Strategy) => void;
}

export default function StrategyManager({ strategies, metrics, isAdmin, onEdit }: StrategyManagerProps) {
    if (!metrics) return null;

    return (
        <div className="space-y-12">
            {/* SECTION A: Strategy Overview Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Capital Deployed"
                    value={`₹${(metrics.totalDeployed || 0).toLocaleString('en-IN')}`}
                    icon={<Briefcase className="w-5 h-5 text-accent-primary" />}
                    subtitle="Real-world fund allocation"
                />
                <MetricCard
                    title="Available Liquidity"
                    value={`₹${(metrics.availableLiquid || 0).toLocaleString('en-IN')}`}
                    icon={<Zap className="w-5 h-5 text-emerald-500" />}
                    subtitle="Undeployed capital reserve"
                />
                <MetricCard
                    title="Active Strategies"
                    value={(metrics.activeCount || 0).toString()}
                    icon={<PieChart className="w-5 h-5 text-accent-secondary" />}
                    subtitle="Live investment buckets"
                />
                <MetricCard
                    title="Avg. Conservative ROI"
                    value={`${metrics.avgConservativeROI || 0}%`}
                    icon={<TrendingUp className="w-5 h-5 text-accent-secondary" />}
                    subtitle="Transparent profit targets"
                />
            </div>

            {/* SECTION B: Strategy Allocation Map (Core UI) */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Fund Allocation & Strategy Map</h2>
                        <p className="text-muted-foreground text-sm">Real-time breakdown of how funds are diversified across various asset classes.</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-secondary border border-border text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Global Distribution
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {strategies.map((strat, idx) => (
                        <StrategyCard
                            key={strat._id}
                            strategy={strat}
                            idx={idx}
                            isAdmin={isAdmin}
                            totalCapital={metrics.totalDeployed}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            </div>

            {/* SECTION E: Transparency Panel (Psychological Trust) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden p-8 rounded-3xl bg-accent-primary/5 border border-accent-primary/20"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck className="w-32 h-32 text-accent-primary" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="p-4 bg-accent-primary/20 rounded-2xl text-accent-primary">
                        <Info className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">Investment Strategy Transparency</h3>
                        <p className="text-foreground leading-relaxed max-w-3xl">
                            InvestHub strictly follows a <span className="text-accent-primary font-bold">Conservative Disclosure Policy</span>.
                            The ROI displayed for each strategy is typically 50% of our actual internal target performance. This approach ensures
                            we maintain consistent distributions even during market volatility and protects our investors from unrealistic expectations.
                            Any performance exceeding the displayed conservative ROI is reinvested into the platform's stability fund.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-accent-primary/20 rounded-lg text-accent-primary text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> SECURED ALLOCATION
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-accent-secondary/20 rounded-lg text-accent-secondary text-xs font-bold">
                            <ArrowUpRight className="w-4 h-4" /> AUDITED PERFORMANCE
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function MetricCard({ title, value, icon, subtitle }: { title: string; value: string; icon: React.ReactNode; subtitle: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border border-border shadow-lg flex flex-col gap-4"
        >
            <div className="flex justify-between items-start">
                <div className="p-3 bg-muted border border-border rounded-xl">{icon}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live Feed</div>
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <p className="text-[10px] text-muted-foreground mt-2">{subtitle}</p>
            </div>
        </motion.div>
    );
}

function StrategyCard({ strategy, idx, isAdmin, totalCapital, onEdit }: { strategy: Strategy; idx: number; isAdmin?: boolean; totalCapital: number; onEdit?: (s: Strategy) => void }) {
    const allocationPct = totalCapital > 0 ? (strategy.totalCapitalDeployed / totalCapital) * 100 : 0;
    const riskColor = strategy.riskLevel === "LOW" ? "text-accent-primary bg-accent-primary/10 border-accent-primary/20" :
        strategy.riskLevel === "MEDIUM" ? "text-warning bg-warning/10 border-warning/20" :
            "text-destructive bg-destructive/10 border-destructive/20";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => isAdmin && onEdit && onEdit(strategy)}
            className={`group relative p-6 rounded-2xl bg-card border border-border hover:bg-background hover:border-accent-primary/40 transition-all overflow-hidden shadow-xl ${isAdmin ? 'cursor-pointer' : ''}`}
        >
            {/* Category Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${riskColor}`}>
                    {strategy.riskLevel} RISK • {strategy.category.replace('_', ' ')}
                </div>
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                </div>
            </div>

            {/* Title & Description */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent-primary transition-colors">{strategy.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{strategy.description}</p>
            </div>

            {/* Metrics Grid */}
            <div className={`grid grid-cols-2 gap-4 ${strategy.tenureAllocation ? 'mb-4' : 'mb-6'}`}>
                <div className="p-3 rounded-xl bg-muted border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Invested
                    </div>
                    <div className="text-sm font-bold text-foreground">₹{strategy.totalCapitalDeployed.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Lock-in
                    </div>
                    <div className="text-sm font-bold text-foreground">{strategy.lockInPeriod} Months</div>
                </div>
            </div>

            {/* Tenure Allocation Breakdown */}
            {strategy.tenureAllocation && (
                <div className="mb-6 bg-secondary/30 rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                        <PieChart className="w-3 h-3" /> Fund Allocation Breakdown
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                            <div className="text-[9px] text-muted-foreground uppercase">Flexi</div>
                            <div className="text-xs font-bold">{((strategy.tenureAllocation.flexi || 0) / strategy.totalCapitalDeployed * 100 || 0).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-muted-foreground uppercase">3M</div>
                            <div className="text-xs font-bold">{((strategy.tenureAllocation.months3 || 0) / strategy.totalCapitalDeployed * 100 || 0).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-muted-foreground uppercase">6M</div>
                            <div className="text-xs font-bold">{((strategy.tenureAllocation.months6 || 0) / strategy.totalCapitalDeployed * 100 || 0).toFixed(0)}%</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-muted-foreground uppercase">12M</div>
                            <div className="text-xs font-bold">{((strategy.tenureAllocation.months12 || 0) / strategy.totalCapitalDeployed * 100 || 0).toFixed(0)}%</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROI Logic (Disclosure Rule) */}
            <div className="relative p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/10 mb-6 group-hover:bg-accent-primary/10 transition-colors">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="text-[10px] text-accent-primary/70 uppercase font-bold mb-1">Target Distribution (Conservative)</div>
                        <div className="text-2xl font-black text-accent-primary">{strategy.roi || strategy.conservativeROI}% <span className="text-xs font-normal opacity-70">Annualized</span></div>
                    </div>
                    {isAdmin && (
                        <div className="text-right">
                            <div className="text-[10px] text-destructive uppercase font-bold mb-1">Internal Target</div>
                            <div className="text-sm font-bold text-foreground opacity-40">{strategy.internalROI}%</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Allocation Progress */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Portfolio Allocation</span>
                    <span className="text-xs font-bold text-foreground">{allocationPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${allocationPct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                    />
                </div>
            </div>

            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </motion.div>
    );
}

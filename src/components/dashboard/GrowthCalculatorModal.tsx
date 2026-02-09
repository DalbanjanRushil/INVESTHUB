"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, DollarSign, Percent, RefreshCw, Info, Sparkles, Target, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGrowth, compareGrowthModes, type GrowthInput, type GrowthOutput } from "@/lib/finance/growthCalculator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface GrowthCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultPrincipal: number;
}

interface ProjectionData {
    portfolio: {
        effectiveCapital: number;
        principal: number;
        profit: number;
        referral: number;
        investedAmount: number;
        payoutPreference: string;
    };
    performance: {
        avgROI: number;
        recentROI: number;
        longTermROI: number;
        weightedROI: number;
        periodsAnalyzed: number;
        dataQuality: string;
    };
    history: Array<{
        period: string;
        roi: number;
        date: string;
    }>;
}

type ProjectionMode = "REALISTIC" | "CONSERVATIVE" | "OPTIMISTIC" | "CUSTOM";

export default function GrowthCalculatorModal({ isOpen, onClose, defaultPrincipal }: GrowthCalculatorModalProps) {
    // Input States
    const [principal, setPrincipal] = useState(0); // Start at 0, will be set by API
    const [roiRate, setRoiRate] = useState(24); // Default, will be overridden by API
    const [compoundingMode, setCompoundingMode] = useState<"NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
    const [payoutMode, setPayoutMode] = useState<"COMPOUND" | "PAYOUT">("COMPOUND");
    const [projectionMode, setProjectionMode] = useState<ProjectionMode>("REALISTIC");

    // API Data States
    const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dataQuality, setDataQuality] = useState<string>("LOADING");
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Output State
    const [result, setResult] = useState<GrowthOutput | null>(null);
    const [comparison, setComparison] = useState<any>(null);

    // Fetch InvestHub projection data on mount
    useEffect(() => {
        if (isOpen) {
            fetchProjectionData();
        }
    }, [isOpen]);

    async function fetchProjectionData() {
        setLoading(true);
        try {
            const res = await fetch("/api/projections/growth");
            const json = await res.json();

            if (json.success && json.data) {
                setProjectionData(json.data);
                setDataQuality(json.data.performance.dataQuality);

                // Only set values on first load to prevent doubling
                if (!initialLoadDone) {
                    setPrincipal(json.data.portfolio.effectiveCapital);
                    setPayoutMode(json.data.portfolio.payoutPreference);
                    setInitialLoadDone(true);

                    // Set ROI based on mode
                    updateROIFromMode("REALISTIC", json.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch projection data:", error);
        } finally {
            setLoading(false);
        }
    }

    // Update ROI when projection mode changes
    useEffect(() => {
        if (projectionData) {
            updateROIFromMode(projectionMode, projectionData);
        }
    }, [projectionMode, projectionData]);

    function updateROIFromMode(mode: ProjectionMode, data: ProjectionData) {
        const baseROI = data.performance.weightedROI;

        switch (mode) {
            case "REALISTIC":
                setRoiRate(baseROI);
                break;
            case "CONSERVATIVE":
                setRoiRate(Number((baseROI * 0.7).toFixed(2)));
                break;
            case "OPTIMISTIC":
                setRoiRate(Number((baseROI * 1.3).toFixed(2)));
                break;
            case "CUSTOM":
                // Keep user's custom ROI
                break;
        }
    }

    // State for Debouncing
    const [debouncedInput, setDebouncedInput] = useState<GrowthInput | null>(null);

    // Debounce Input Changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (principal > 0 && roiRate > 0) {
                // Auto-determine time period based on compounding mode
                let timeInMonths = 1; // Default for simple/monthly

                switch (compoundingMode) {
                    case "NONE":
                        timeInMonths = 1; // 1 month for simple interest
                        break;
                    case "MONTHLY":
                        timeInMonths = 1; // 1 month
                        break;
                    case "QUARTERLY":
                        timeInMonths = 3; // 3 months
                        break;
                    case "YEARLY":
                        timeInMonths = 12; // 12 months
                        break;
                }

                // UI-Logic Sync: If Payout is selected, force logical mode to NONE but keep UI state as is for user preference
                // Actually for correct math, if Payout is selected, we should treat it as 'NONE' for compounding in the util effectively.
                // But let's strictly follow the prompt: Enable mutual exclusivity OR disable UI.
                // Better approach: If payoutMode is PAYOUT, we pass 'NONE' to the calculator for compoundingMode, 
                // OR we just rely on calculator's safe logic which already handles this. 
                // However, the prompt asks to "Enforce mutual exclusivity".
                // We will handle this by disabling compounding selection in UI when PAYOUT is active (in the render).

                setDebouncedInput({
                    principal,
                    roiRate,
                    timePeriod: timeInMonths,
                    compoundingMode,
                    payoutMode,
                });
            } else {
                setDebouncedInput(null); // Clear on invalid input
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [principal, roiRate, compoundingMode, payoutMode]);

    // Calculate Result based on Debounced Input
    useEffect(() => {
        if (debouncedInput) {
            const output = calculateGrowth(debouncedInput);
            setResult(output);

            if (output) {
                const comp = compareGrowthModes(debouncedInput.principal, debouncedInput.roiRate, debouncedInput.timePeriod);
                setComparison(comp);
            } else {
                setComparison(null);
            }
        } else {
            setResult(null);
            setComparison(null);
        }
    }, [debouncedInput]);

    if (!isOpen) return null;

    // Prepare chart data (sample every N months for cleaner display)
    const chartData = result?.monthlyBreakdown
        .filter((_, index) => index % Math.max(1, Math.floor(result.monthlyBreakdown.length / 24)) === 0 || index === result.monthlyBreakdown.length - 1)
        .map((item) => ({
            month: item.month,
            value: item.value,
            profit: item.profit,
        })) || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl border border-border shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent-primary/10 rounded-2xl border border-accent-primary/20 shadow-lg shadow-accent-primary/10">
                                    <TrendingUp className="w-7 h-7 text-accent-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Projected Growth Engine</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Data-driven forecasts powered by InvestHub's real performance</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-muted rounded-xl transition-all group border border-transparent hover:border-border"
                            >
                                <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Input Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Inputs */}
                            <div className="space-y-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Simulation Parameters
                                </h3>

                                {/* Initial Capital */}
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2.5 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-accent-primary" />
                                        Your Portfolio Value
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary font-bold text-lg">₹</span>
                                        <input
                                            type="number"
                                            value={principal}
                                            onChange={(e) => setPrincipal(Number(e.target.value))}
                                            disabled={loading}
                                            className="w-full pl-10 pr-4 py-3.5 bg-muted border border-border rounded-xl text-foreground font-mono text-lg focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20 outline-none transition-all hover:border-accent-primary/30 disabled:opacity-50"
                                            placeholder="50000"
                                        />
                                    </div>
                                    {projectionData && (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-muted-foreground">Cash + Active Investments</p>
                                            <p className="text-xs font-semibold text-accent-primary">₹{projectionData.portfolio.effectiveCapital.toLocaleString('en-IN')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Projection Mode Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2.5">Projection Mode</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "REALISTIC", label: "Realistic", icon: <Target className="w-4 h-4" />, color: "emerald" },
                                            { value: "CONSERVATIVE", label: "Conservative", icon: <TrendingDown className="w-4 h-4" />, color: "blue" },
                                            { value: "OPTIMISTIC", label: "Optimistic", icon: <Sparkles className="w-4 h-4" />, color: "purple" },
                                            { value: "CUSTOM", label: "Custom", icon: <RefreshCw className="w-4 h-4" />, color: "amber" },
                                        ].map((mode) => (
                                            <button
                                                key={mode.value}
                                                onClick={() => setProjectionMode(mode.value as ProjectionMode)}
                                                disabled={loading}
                                                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${projectionMode === mode.value
                                                    ? `bg-gradient-to-r from-${mode.color}-500/20 to-${mode.color}-500/10 text-${mode.color}-400 border border-${mode.color}-500/50 shadow-lg shadow-${mode.color}-500/20`
                                                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground hover:border-border"
                                                    }`}
                                            >
                                                {mode.icon}
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                    {projectionData && projectionMode !== "CUSTOM" && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {projectionData.performance.periodsAnalyzed > 0 ? (
                                                <>Based on InvestHub's {projectionData.performance.periodsAnalyzed} month{projectionData.performance.periodsAnalyzed > 1 ? 's' : ''} history</>
                                            ) : (
                                                <>Using default projections (No performance history yet)</>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Estimated ROI Rate */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                            <Percent className="w-4 h-4 text-accent-secondary" />
                                            {projectionMode === "CUSTOM" ? "Expected Returns" : "InvestHub Est. Returns"}
                                        </label>
                                        <div className="px-4 py-1.5 bg-accent-secondary/10 rounded-lg border border-accent-secondary/40 shadow-lg shadow-accent-secondary/10">
                                            <span className="text-xl font-bold text-accent-secondary">{roiRate}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="2"
                                                max="100"
                                                step="1"
                                                value={roiRate}
                                                onChange={(e) => {
                                                    setRoiRate(Number(e.target.value));
                                                    setProjectionMode("CUSTOM");
                                                }}
                                                disabled={loading}
                                                className="w-full h-3 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background disabled:opacity-50"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                                <span>2%</span>
                                                <span className="text-muted-foreground/70">Annual ROI</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        {/* Quick Presets */}
                                        <div className="flex gap-2">
                                            {[12, 24, 36, 50].map((preset) => (
                                                <button
                                                    key={preset}
                                                    onClick={() => setRoiRate(preset)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${roiRate === preset
                                                        ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                                                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
                                                        }`}
                                                >
                                                    {preset}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Compounding Mode */}
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2.5">Investment Period & Compounding</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: "NONE", label: "Simple", icon: "📊", period: "1 Month" },
                                            { value: "MONTHLY", label: "Monthly", icon: "🌙", period: "1 Month" },
                                            { value: "QUARTERLY", label: "Quarterly", icon: "📅", period: "3 Months" },
                                            { value: "YEARLY", label: "Yearly", icon: "🎯", period: "12 Months" },
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setCompoundingMode(option.value as any)}
                                                disabled={payoutMode === "PAYOUT" && option.value !== "NONE"}
                                                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${compoundingMode === option.value
                                                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/50 shadow-lg shadow-accent-primary/20"
                                                    : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground hover:border-border"
                                                    } ${payoutMode === "PAYOUT" && option.value !== "NONE" ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <span>{option.icon}</span>
                                                    <span>{option.label}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground/70">{option.period}</div>
                                                {payoutMode === "PAYOUT" && option.value !== "NONE" && (
                                                    <div className="hidden group-hover:block absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center">
                                                        <span className="text-xs font-bold text-red-400">N/A</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payout Preference */}
                                <div>
                                    <label className="block text-sm font-semibold text-muted-foreground mb-2.5">Profit Strategy</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPayoutMode("COMPOUND")}
                                            className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${payoutMode === "COMPOUND"
                                                ? "bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/50 shadow-lg shadow-accent-secondary/20"
                                                : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground hover:border-border"
                                                }`}
                                        >
                                            <div className="text-xl mb-1">🔄</div>
                                            Reinvest
                                            <div className="text-[10px] text-muted-foreground/70 mt-1">Compound Growth</div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPayoutMode("PAYOUT");
                                                setCompoundingMode("NONE"); // Auto-reset compounding to simple when withdrawing
                                            }}
                                            className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${payoutMode === "PAYOUT"
                                                ? "bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/50 shadow-lg shadow-accent-secondary/20"
                                                : "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:text-foreground hover:border-border"
                                                }`}
                                        >
                                            <div className="text-xl mb-1">💰</div>
                                            Withdraw
                                            <div className="text-[10px] text-muted-foreground/70 mt-1">Take Profits</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Results */}
                            <div className="space-y-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Projected Outcomes
                                </h3>

                                {result ? (
                                    <>
                                        {/* Metric Cards */}
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-accent-primary/10 via-accent-primary/5 to-transparent border border-accent-primary/30 overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/10 to-accent-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                <div className="relative">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-accent-primary mb-2">Final Portfolio Value</p>
                                                    <p className="text-4xl font-bold text-foreground font-mono">₹{result.finalValue.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>

                                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-accent-secondary/10 via-accent-secondary/5 to-transparent border border-accent-secondary/30 overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-accent-secondary/0 via-accent-secondary/10 to-accent-secondary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                <div className="relative">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-accent-secondary mb-2">Total Profit Earned</p>
                                                    <p className="text-4xl font-bold text-foreground font-mono">₹{result.totalProfit.toLocaleString('en-IN')}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="px-2 py-1 bg-accent-secondary/20 rounded-lg">
                                                            <p className="text-xs font-bold text-accent-secondary">+{result.growthPercentage.toFixed(2)}% growth</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comparison Insight */}
                                        {comparison && compoundingMode !== "NONE" && comparison.compoundingBenefit > 0 && (
                                            <div className="relative p-5 rounded-2xl bg-gradient-to-r from-accent-primary/10 via-accent-secondary/10 to-accent-primary/10 border border-accent-primary/30 overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 rounded-full blur-3xl"></div>
                                                <div className="relative flex items-start gap-3">
                                                    <div className="p-2 bg-accent-primary/20 rounded-lg">
                                                        <Info className="w-5 h-5 text-accent-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-accent-primary mb-2">💡 Compounding Magic</p>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            By reinvesting your profits, you earn an extra{" "}
                                                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">₹{comparison.compoundingBenefit.toLocaleString('en-IN')}</span>{" "}
                                                            compared to withdrawing them!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Psychological Insight - "If you stay invested..." */}
                                        <div className="relative p-6 rounded-2xl bg-gradient-to-r from-warning/10 via-orange-500/10 to-warning/10 border border-warning/30 overflow-hidden">
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl"></div>
                                            <div className="relative">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="text-2xl">🚀</div>
                                                    <h4 className="text-sm font-bold text-warning">If you stay invested in InvestHub...</h4>
                                                </div>
                                                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                                    {projectionMode === "CUSTOM" ? (
                                                        <>
                                                            With your estimated <span className="font-bold text-amber-400">{roiRate}% annual returns</span> and{" "}
                                                            <span className="font-bold text-amber-400">
                                                                {compoundingMode === "NONE" && "simple interest"}
                                                                {compoundingMode === "MONTHLY" && "monthly compounding"}
                                                                {compoundingMode === "QUARTERLY" && "quarterly compounding"}
                                                                {compoundingMode === "YEARLY" && "yearly compounding"}
                                                            </span>, your <span className="font-bold text-white">₹{principal.toLocaleString('en-IN')}</span> portfolio could grow to{" "}
                                                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">₹{result.finalValue.toLocaleString('en-IN')}</span> in{" "}
                                                            <span className="font-bold text-amber-400">
                                                                {compoundingMode === "MONTHLY" && "1 month"}
                                                                {compoundingMode === "QUARTERLY" && "3 months"}
                                                                {compoundingMode === "YEARLY" && "1 year"}
                                                                {compoundingMode === "NONE" && "1 month"}
                                                            </span>.
                                                        </>
                                                    ) : projectionData && projectionData.performance.periodsAnalyzed > 0 ? (
                                                        <>
                                                            Based on InvestHub's actual {projectionData.performance.periodsAnalyzed}-month track record (avg{" "}
                                                            <span className="font-bold text-amber-400">{projectionData.performance.avgROI}% monthly</span>), your{" "}
                                                            <span className="font-bold text-white">₹{principal.toLocaleString('en-IN')}</span> could become{" "}
                                                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">₹{result.finalValue.toLocaleString('en-IN')}</span> in just{" "}
                                                            <span className="font-bold text-amber-400">
                                                                {compoundingMode === "MONTHLY" && "1 month"}
                                                                {compoundingMode === "QUARTERLY" && "3 months"}
                                                                {compoundingMode === "YEARLY" && "1 year"}
                                                                {compoundingMode === "NONE" && "1 month"}
                                                            </span> with {payoutMode === "COMPOUND" ? "profit reinvestment" : "profit withdrawal"}.
                                                        </>
                                                    ) : (
                                                        <>
                                                            With estimated <span className="font-bold text-amber-400">{roiRate}% annual returns</span> and{" "}
                                                            <span className="font-bold text-amber-400">
                                                                {compoundingMode === "MONTHLY" && "monthly compounding"}
                                                                {compoundingMode === "QUARTERLY" && "quarterly compounding"}
                                                                {compoundingMode === "YEARLY" && "yearly compounding"}
                                                                {compoundingMode === "NONE" && "simple interest"}
                                                            </span>, your <span className="font-bold text-white">₹{principal.toLocaleString('en-IN')}</span> could grow to{" "}
                                                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">₹{result.finalValue.toLocaleString('en-IN')}</span> in{" "}
                                                            <span className="font-bold text-amber-400">
                                                                {compoundingMode === "MONTHLY" && "1 month"}
                                                                {compoundingMode === "QUARTERLY" && "3 months"}
                                                                {compoundingMode === "YEARLY" && "1 year"}
                                                                {compoundingMode === "NONE" && "1 month"}
                                                            </span>. (InvestHub performance history coming soon!)
                                                        </>
                                                    )}
                                                </p>
                                                {projectionData && projectionMode !== "CUSTOM" && projectionData.performance.periodsAnalyzed > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            <span>Recent 3M: {projectionData.performance.recentROI}%</span>
                                                        </div>
                                                        <span>•</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                            <span>Long-term: {projectionData.performance.longTermROI}%</span>
                                                        </div>
                                                        <span>•</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                            <span>Weighted: {projectionData.performance.weightedROI}%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-[400px] border border-dashed border-border rounded-2xl bg-muted/20">
                                        <div className="text-center px-6">
                                            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <TrendingUp className="w-8 h-8 text-accent-primary" />
                                            </div>
                                            <p className="text-muted-foreground text-sm">Enter your parameters on the left</p>
                                            <p className="text-muted-foreground/70 text-xs mt-2">Results will appear here instantly</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Growth Chart */}
                        {result && chartData.length > 0 && (
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-accent-primary" />
                                        Growth Trajectory
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="w-3 h-3 rounded-full bg-accent-primary"></span>
                                        Portfolio Value
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="month"
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                            label={{ value: "Month", position: "insideBottom", offset: -5, fill: "var(--color-text-muted)" }}
                                        />
                                        <YAxis
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--color-bg-surface)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "12px",
                                                color: "var(--color-text-primary)",
                                            }}
                                            formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, "Portfolio Value"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="var(--color-accent-primary)"
                                            strokeWidth={2}
                                            fill="url(#colorValue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="p-5 rounded-2xl bg-muted border border-border">
                            <div className="flex items-start gap-3">
                                <div className="text-lg">⚠️</div>
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Important Disclaimer</p>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                        {projectionMode === "CUSTOM" ? (
                                            "This calculator provides simulated projections based on your custom assumptions. "
                                        ) : (
                                            "Projections are based on InvestHub's historical performance data and statistical analysis. "
                                        )}
                                        Actual returns depend on market conditions, declared performance periods, and trading results. Past performance does not guarantee future results. This is an educational tool, not financial advice.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

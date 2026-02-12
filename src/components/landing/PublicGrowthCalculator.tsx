"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, TrendingUp, IndianRupee, Percent, RefreshCw, BarChart2, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGrowth, type GrowthInput, type GrowthOutput } from "@/lib/finance/growthCalculator";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

interface PublicGrowthCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PublicGrowthCalculator({ isOpen, onClose }: PublicGrowthCalculatorProps) {
    const [mounted, setMounted] = useState(false);

    // Input States
    const [principal, setPrincipal] = useState(50000);
    const [roiRate, setRoiRate] = useState(60);
    const [compoundingMode, setCompoundingMode] = useState<"NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");

    // Output State
    const [result, setResult] = useState<GrowthOutput | null>(() => calculateGrowth({
        principal: 50000,
        roiRate: 60,
        timePeriod: 36, // 3 years
        compoundingMode: "MONTHLY",
        payoutMode: 'COMPOUND'
    }));

    useEffect(() => {
        setMounted(true);
    }, []);

    // Debounced Calculation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (principal >= 0) {
                const input: GrowthInput = {
                    principal,
                    roiRate,
                    timePeriod: 36, // 3 years
                    compoundingMode,
                    payoutMode: 'COMPOUND'
                };
                const output = calculateGrowth(input);
                setResult(output);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [principal, roiRate, compoundingMode]);

    // Lock scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Prepare chart data
    const chartData = result?.monthlyBreakdown.map((item) => ({
        month: `Month ${item.month}`,
        value: item.value,
        profit: item.profit,
    })) || [];

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        key="modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0F172A] rounded-3xl border border-white/10 shadow-2xl shadow-black/50 text-white scrollbar-hide"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/5 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Logo size="sm" />
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Investment Simulator</h2>
                                    <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">Powered by InvestHub Logic</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                                <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Inputs */}
                            <div className="md:col-span-12 lg:col-span-5 space-y-8 pr-0 lg:pr-4">

                                {/* Principal Amount */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Initial Investment (₹)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <IndianRupee className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <input
                                            type="number"
                                            value={principal}
                                            onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                                            className="w-full pl-12 pr-4 py-4 bg-[#1E293B]/50 hover:bg-[#1E293B] focus:bg-[#1E293B] border border-white/10 focus:border-emerald-500/50 rounded-xl text-white text-lg font-mono outline-none transition-all placeholder:text-slate-600"
                                            placeholder="50000"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        {[10000, 50000, 100000].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setPrincipal(amt)}
                                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-lg text-slate-400 hover:text-white transition-all"
                                            >
                                                +₹{(amt / 1000)}k
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ROI Slider */}
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Annual Return Rate</label>
                                        <span className="text-2xl font-bold text-emerald-400 tabular-nums tracking-tight">{roiRate}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="60"
                                        value={roiRate}
                                        onChange={(e) => setRoiRate(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                        <span>Conservative (5%)</span>
                                        <span>Aggressive (60%)</span>
                                    </div>
                                </div>

                                {/* Compounding Toggle */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Compounding Frequency</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: "MONTHLY", label: "Monthly" },
                                            { id: "QUARTERLY", label: "Quarterly" },
                                            { id: "YEARLY", label: "Yearly" },
                                            { id: "NONE", label: "None" }
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setCompoundingMode(mode.id as any)}
                                                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 ${compoundingMode === mode.id
                                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                                                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                                                    }`}
                                            >
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Results */}
                            <div className="md:col-span-12 lg:col-span-7 space-y-6 lg:pl-4 lg:border-l border-white/5">

                                {/* Key Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Projected Value</p>
                                        <div className="relative z-10 overflow-x-auto scrollbar-hide pb-1">
                                            <p className="text-xl sm:text-2xl font-bold text-white tracking-tighter leading-none whitespace-nowrap">
                                                ₹{result?.finalValue.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-[#1E293B]/30 border border-white/10 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total Profit</p>
                                        <div className="relative z-10 overflow-x-auto scrollbar-hide pb-1">
                                            <p className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tighter leading-none whitespace-nowrap">
                                                +₹{result?.totalProfit.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="h-64 w-full bg-[#0B1120] rounded-2xl border border-white/5 p-4 text-xs relative">
                                    <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-none opacity-20"></div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.5} vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#64748B"
                                                tick={{ fontSize: 10, fontWeight: 500 }}
                                                tickFormatter={(val) => {
                                                    const m = parseInt(val.replace('Month ', ''));
                                                    return m % 6 === 0 ? `${m}M` : '';
                                                }}
                                                interval="preserveStartEnd"
                                                axisLine={false}
                                                tickLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#64748B"
                                                tick={{ fontSize: 10, fontWeight: 500 }}
                                                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                                width={40}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                                itemStyle={{ color: '#10B981', fontWeight: 600, fontSize: '14px' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                                                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, "Portfolio Value"]}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#10B981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                                    <Link
                                        href="/register"
                                        className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-bold rounded-xl text-center text-lg transition-all transform hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] tracking-wide uppercase"
                                    >
                                        Start Investing Now
                                    </Link>
                                    <button
                                        onClick={onClose}
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/5 hover:border-white/20 uppercase tracking-wide text-sm"
                                    >
                                        Close
                                    </button>
                                </div>

                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

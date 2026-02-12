"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Shield, Zap, Target, BarChart2, Clock, AlertCircle, X, Info, TrendingDown, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Data ---

interface Strategy {
    id: string;
    title: string;
    description: string;
    fullDescription: string;
    return: string;
    risk: "Low" | "Medium" | "High" | "Very High";
    badge?: string;
    badgeColor?: string;
    category: string;
    minInvestment: string;
    maxDrawdown: string; // New metric for realism
    horizon: string;
    assets: string[];
    chartData: number[]; // Normalized price history (e.g. starting at 100)
}

const STRATEGIES: Strategy[] = [
    {
        id: "alpha-momentum",
        title: "Alpha Momentum",
        description: "Captures short-term trends in high-volatility assets.",
        fullDescription: "Our flagship high-frequency strategy that leverages proprietary moving average crossover algorithms to identify and capitalize on short-term market inefficiencies. While providing superior upside, this strategy experiences significant volatility during market corrections.",
        return: "+32.5%",
        risk: "High",
        badge: "Top Performer",
        badgeColor: "emerald",
        category: "Aggressive Growth",
        minInvestment: "$5,000",
        maxDrawdown: "-18.4%",
        horizon: "3-6 Months",
        assets: ["Tech Stocks", "Crypto", "Derivatives"],
        chartData: [100, 108, 115, 102, 98, 110, 125, 118, 112, 130, 142, 132] // Volatile path
    },
    {
        id: "blue-chip-divs",
        title: "Blue Chip Dividends",
        description: "Established large-cap companies with consistent payouts.",
        fullDescription: "A conservative wealth-building strategy focused on the 'Dividend Aristocrats'—S&P 500 companies that have increased dividends for at least 25 consecutive years. Reinvests dividends for compound growth while mitigating downside risk.",
        return: "+12.8%",
        risk: "Low",
        badge: "Stable Growth",
        badgeColor: "blue",
        category: "Income",
        minInvestment: "$10,000",
        maxDrawdown: "-5.2%",
        horizon: "3+ Years",
        assets: ["Coca-Cola", "J&J", "P&G", "Utility Bonds"],
        chartData: [100, 101, 102, 101.5, 103, 104, 105, 104.5, 106, 108, 110, 112.8] // Steady
    },
    {
        id: "global-tech",
        title: "Global Tech ETF",
        description: "Diversified exposure to AI, robotics, and cloud computing.",
        fullDescription: "A thematic growth portfolio capturing the value chain of the Fourth Industrial Revolution. Investments cover semiconductor manufacturing, cloud infrastructure, cybersecurity, and artificial intelligence software providers.",
        return: "+18.4%",
        risk: "Medium",
        badge: "Balanced",
        badgeColor: "purple",
        category: "Thematic",
        minInvestment: "$2,500",
        maxDrawdown: "-12.1%",
        horizon: "1-2 Years",
        assets: ["NVIDIA", "Microsoft", "ASML", "CrowdStrike"],
        chartData: [100, 105, 112, 108, 115, 110, 105, 118, 125, 120, 128, 118.4] // Tech volatility
    },
    {
        id: "asian-tigers",
        title: "Asian Tigers",
        description: "Aggressive growth targeting SE Asia industrialization.",
        fullDescription: "Focuses on the rapid urbanization and digital transformation of Southeast Asian markets (Vietnam, Indonesia, Philippines). High upside potential driven by demographic shifts and manufacturing relocation.",
        return: "+24.1%",
        risk: "High",
        badge: "Emerging Markets",
        badgeColor: "cyan",
        category: "International",
        minInvestment: "$5,000",
        maxDrawdown: "-22.5%",
        horizon: "2-4 Years",
        assets: ["Vingroup", "Sea Ltd", "Bank Central Asia"],
        chartData: [100, 110, 95, 90, 105, 115, 100, 110, 125, 115, 130, 124] // High volatility
    }
];

const ACTIVE_OPPORTUNITIES: Strategy[] = [
    {
        id: "crypto-yield",
        title: "Crypto Yield Farming",
        description: "Leveraging stablecoin liquidity pools for consistent yield.",
        fullDescription: "Market-neutral strategy that provides liquidity to decentralized exchanges in exchange for trading fees and governance tokens. Risks are hedged using delta-neutral positions.",
        return: "15-22%",
        risk: "High",
        category: "DeFi",
        minInvestment: "$1,000",
        maxDrawdown: "-8.5%",
        horizon: "6 Months",
        assets: ["USDC", "ETH", "Curve", "Aave"],
        chartData: [100, 102, 104, 103, 105, 108, 106, 110, 114, 112, 116, 118]
    },
    {
        id: "green-bonds",
        title: "Green Energy Bonds",
        description: "Government-backed renewable energy infrastructure.",
        fullDescription: "Fixed-income securities funding solar and wind projects. Backed by government guarantees and power purchase agreements (PPAs), offering predictable yields.",
        return: "8-12%",
        risk: "Low",
        category: "ESG",
        minInvestment: "$5,000",
        maxDrawdown: "-3.1%",
        horizon: "12 Months",
        assets: ["Green Bonds", "Solar ETF", "Wind Farm REIT"],
        chartData: [100, 100.5, 101, 101.5, 102, 102.5, 103, 103.5, 104, 105, 106, 108]
    },
    {
        id: "saas-venture",
        title: "SaaS Venture Fund",
        description: "Early-stage equity in B2B software companies.",
        fullDescription: "High-risk, high-reward venture capital allocation. Targets pre-Series A B2B SaaS companies with proven product-market fit and recurring revenue models.",
        return: "25-40%",
        risk: "Very High",
        category: "Venture",
        minInvestment: "$25,000",
        maxDrawdown: "-35%",
        horizon: "36 Months",
        assets: ["Private Equity", "Convertible Notes"],
        chartData: [100, 90, 85, 95, 105, 95, 110, 125, 115, 130, 120, 135] // J-Curve
    }
];

// --- Helper for SVG Path ---
const getSparkline = (data: number[], width: number, height: number) => {
    if (data.length < 2) return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    // Add 10% padding to avoid clipping
    const paddedMin = min - (range * 0.1);
    const paddedRange = range * 1.2;

    const stepX = width / (data.length - 1);

    // Generate Line Path
    const points = data.map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - paddedMin) / paddedRange) * height;
        return `${x},${y}`;
    });

    return points.join(" ");
};

export default function StrategiesPage() {
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

    // Helpers to define color styles based on risk/badge
    const getRiskColor = (risk: string) => {
        if (risk === "Very High" || risk === "High") return "text-orange-400";
        if (risk === "Medium") return "text-yellow-400";
        return "text-emerald-400";
    };

    const getBadgeStyles = (color?: string) => {
        switch (color) {
            case "emerald": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "blue": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "purple": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "cyan": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30 font-sans">
            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-bold tracking-tight text-white">InvestHub</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About</Link>
                        <Link href="/strategies" className="text-sm font-medium text-white relative">
                            Strategies
                            <span className="absolute -bottom-5 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        </Link>
                        <Link href="/contact" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Contact</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/20 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20">

                {/* 1. HERO SECTION */}
                <section className="container mx-auto px-6 mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                            <Zap className="w-4 h-4" />
                            <span>Professional Grade Algorithms</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            Curated Investment <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Strategies for Every Goal.</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Backtested against 10 years of market data. Select a strategy to view detailed performance charts and risk analysis.
                        </p>
                    </motion.div>
                </section>

                {/* 2. TOP PERFORMERS */}
                <section className="mb-24 overflow-hidden">
                    <div className="container mx-auto px-6 mb-8 flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Top Performers</h2>
                            <p className="text-slate-400 text-sm">Strategies consistently beating the market benchmark.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-8 px-6 container mx-auto scrollbar-hide snap-x scroll-pl-6">
                        {STRATEGIES.map((strat) => (
                            <motion.div
                                key={strat.id}
                                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
                                onClick={() => setSelectedStrategy(strat)}
                                className="min-w-[260px] md:min-w-[280px] snap-start bg-[#1E293B]/40 hover:bg-[#1E293B] border border-white/5 hover:border-white/10 rounded-2xl p-5 cursor-pointer transition-colors group relative overflow-hidden"
                            >
                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none bg-${strat.badgeColor}-500 group-hover:opacity-40 transition-opacity`}></div>

                                <div className="mb-4">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyles(strat.badgeColor)}`}>
                                        {strat.badge}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{strat.title}</h3>
                                <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{strat.description}</p>

                                <div className="flex items-end justify-between pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">Ret (Yearly)</p>
                                        <p className={`text-xl font-bold ${strat.return.includes("+") ? "text-emerald-400" : "text-white"}`}>{strat.return}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${getRiskColor(strat.risk)}`}>
                                            {strat.risk === 'Low' ? <Shield className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                            {strat.risk} Risk
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 3. PAST PERFORMANCE */}
                <section className="container mx-auto px-6 mb-24">
                    <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/5 rounded-[32px] p-8 md:p-10 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-4">Historical Precision</h2>
                                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                    Our strategies have executed over 50 unique cycles, maintaining a 92% success ratio.
                                    We enforce strict algorithmic stop-losses to protect capital.
                                </p>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-2xl font-bold text-white">54</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Executed</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-emerald-400">21.8%</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg. Return</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-[180px] bg-[#0B1120]/50 rounded-xl p-4 flex items-end justify-between gap-1">
                                {[40, 55, 45, 60, 75, 65, 85, 95, 80, 100, 120, 140].map((h, i) => (
                                    <div key={i} className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. ACTIVE OPPORTUNITIES */}
                <section className="container mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-white mb-2">Active Opportunities</h2>
                        <p className="text-slate-400 text-sm">Open for new capital allocation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ACTIVE_OPPORTUNITIES.map((strat, i) => (
                            <motion.div
                                key={strat.id}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedStrategy(strat)}
                                className="bg-[#1E293B]/20 border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5 text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{strat.title}</h3>
                                <p className="text-slate-400 text-xs mb-4 leading-relaxed line-clamp-2">
                                    {strat.description}
                                </p>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] text-slate-500 mb-0.5">Return</p>
                                        <p className="text-sm font-bold text-emerald-400">{strat.return}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 mb-0.5">Risk</p>
                                        <p className={`text-sm font-semibold ${getRiskColor(strat.risk)}`}>{strat.risk}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/5 py-8 bg-[#0B1120]">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} InvestHub. All rights reserved.
                </div>
            </footer>

            {/* DETAILED VIEW MODAL */}
            <AnimatePresence>
                {selectedStrategy && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setSelectedStrategy(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedStrategy(null)}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 pb-0">
                                <span className={`inline-block px-3 py-1 mb-4 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedStrategy.badge ? getBadgeStyles(selectedStrategy.badgeColor) : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}>
                                    {selectedStrategy.badge || "Active Opportunity"}
                                </span>
                                <h2 className="text-3xl font-bold text-white mb-2">{selectedStrategy.title}</h2>
                                <p className="text-slate-400 text-sm mb-6">{selectedStrategy.category} • {selectedStrategy.horizon} Horizon</p>
                            </div>

                            {/* UPDATED: Realistic SVG Chart */}
                            <div className="px-8 mb-8">
                                <div className="bg-[#0B1120] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6 z-10 relative">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4 text-emerald-400" /> Performance Growth
                                            </h4>
                                            <p className="text-[10px] text-slate-500 mt-1">Simulated NAV Performance (1Y)</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-white">{selectedStrategy.return}</p>
                                            <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Annualized</p>
                                        </div>
                                    </div>

                                    {/* SVG Chart */}
                                    <div className="h-48 w-full relative z-10">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {/* Area */}
                                            <path
                                                d={`M 0 100 ${getSparkline(selectedStrategy.chartData, 100, 100).split(' ').map(p => 'L ' + p).join(' ')} L 100 100 Z`}
                                                fill="url(#chartGradient)"
                                            />
                                            {/* Line */}
                                            <polyline
                                                points={getSparkline(selectedStrategy.chartData, 100, 100)}
                                                fill="none"
                                                stroke="#10B981"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>

                                    {/* Grid Lines */}
                                    <div className="absolute inset-x-0 bottom-6 h-[1px] bg-white/10 pointer-events-none"></div>
                                    <div className="absolute inset-x-0 bottom-[50%] h-[1px] bg-white/5 pointer-events-none"></div>
                                </div>
                            </div>

                            {/* Metrics Grid (Expanded with Drawdown) */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 pb-8">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Risk Profile</p>
                                    <p className={`text-sm font-bold ${getRiskColor(selectedStrategy.risk)}`}>{selectedStrategy.risk}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Max Drawdown</p>
                                    <p className="text-sm font-bold text-orange-400 flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" /> {selectedStrategy.maxDrawdown}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Min. Invest</p>
                                    <p className="text-sm font-bold text-white">{selectedStrategy.minInvestment}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] text-slate-400 uppercase mb-1">Time Horizon</p>
                                    <p className="text-sm font-bold text-white">{selectedStrategy.horizon}</p>
                                </div>
                            </div>

                            <div className="px-8 pb-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-slate-400" /> Strategy Overview
                                    </h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {selectedStrategy.fullDescription}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-3">Top Holdings</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStrategy.assets.map((asset) => (
                                            <span key={asset} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                                                {asset}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-[#0B1120]/50 sticky bottom-0 backdrop-blur-xl flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-slate-500">Next Rebalance</p>
                                    <p className="text-xs text-slate-300">In 2 days</p>
                                </div>
                                <Link href="/register" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 text-center">
                                    Invest Now
                                </Link>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

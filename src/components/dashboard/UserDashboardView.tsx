"use client";

import { useState } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import FinancialActions from "@/components/dashboard/FinancialActions";
import RealTimeUpdater from "@/components/dashboard/RealTimeUpdater";
import ClientTime from "@/components/common/ClientTime";
import GrowthCalculatorButton from "@/components/dashboard/GrowthCalculatorButton";
import GrowthCalculatorModal from "@/components/dashboard/GrowthCalculatorModal";
import { ArrowRight, Wallet, PieChart, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import MaturityTimeline from "@/components/dashboard/MaturityTimeline";

interface UserDashboardViewProps {
    data: {
        wallet: any;
        transactions: any[];
        user: any;
        totalReferrals: number;
        investments: any[];
    };
}

export default function UserDashboardView({ data }: UserDashboardViewProps) {
    const { wallet, transactions, user, investments } = data;
    console.log("Dashboard received transactions:", transactions?.length, transactions?.[0]);
    const recentTransactions = transactions?.slice(0, 7) || [];

    // Growth Calculator State
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const userPrincipal = (wallet?.principal || 0) + (wallet?.profit || 0) + (wallet?.referral || 0);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
                <RealTimeUpdater />

                {/* HEADER SECTION (Design Plan C) */}
                <div className="relative w-full p-8 rounded-3xl overflow-hidden mb-8 border border-border shadow-2xl group bg-card">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-background z-0"></div>
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

                    {/* Decorative Shine */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border backdrop-blur-sm mb-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-xs font-medium text-primary">Market Active</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-secondary">{user?.name?.split(" ")[0]}</span>
                            </h1>
                            <p className="text-muted-foreground text-sm max-w-md">
                                Your portfolio has been analyzing market trends in real-time. Here is your performance summary for today.
                            </p>
                        </div>
                        <div className="mt-6 md:mt-0 items-end flex flex-col gap-4">
                            <GrowthCalculatorButton onClick={() => setIsCalculatorOpen(true)} />
                            <div className="flex flex-col items-end">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> System Time
                                </div>
                                <div className="text-xl font-mono font-medium text-foreground">
                                    <ClientTime />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 0. MATURITY TIMELINE (NEW) */}
                <MaturityTimeline investments={investments} />

                {/* 1. HERO STATS */}
                <DashboardHero wallet={wallet} />

                {/* 2. QUICK ACTIONS */}
                <div id="actions">
                    <FinancialActions preference={user?.payoutPreference || "COMPOUND"} />
                </div>

                {/* 3. DEEP NAVIGATION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Portfolio Shortcut */}
                    <Link href="/dashboard/portfolio" className="group relative p-6 rounded-2xl bg-card border border-border hover:bg-secondary/50 transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-3 bg-accent-secondary/10 rounded-xl text-accent-secondary group-hover:text-white group-hover:bg-accent-secondary transition-colors">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="relative z-10 text-lg font-bold text-foreground mb-1">Portfolio Analysis</h3>
                        <p className="relative z-10 text-sm text-muted-foreground">Detailed asset allocation & performance metrics.</p>
                    </Link>

                    {/* Market Shortcut */}
                    <Link href="/dashboard/market" className="group relative p-6 rounded-2xl bg-card border border-border hover:bg-secondary/50 transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-3 bg-accent-primary/10 rounded-xl text-accent-primary group-hover:text-white group-hover:bg-accent-primary transition-colors">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="relative z-10 text-lg font-bold text-foreground mb-1">Market Insights</h3>
                        <p className="relative z-10 text-sm text-muted-foreground">Latest strategies and market simulation data.</p>
                    </Link>
                </div>

                {/* 4. RECENT TRANSACTIONS */}
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Recent Activity
                        </h3>
                        <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:text-primary/80 uppercase tracking-wider hover:underline">
                            View Full History
                        </Link>
                    </div>

                    <div className="divide-y divide-border">
                        {recentTransactions.map((t: any) => (
                            <div key={t._id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-full transition-transform group-hover:scale-110",
                                        t.type === 'DEPOSIT' ? 'bg-success/10 text-success' :
                                            t.type === 'PROFIT' ? 'bg-accent-secondary/10 text-accent-secondary' :
                                                t.type === 'REFERRAL_BONUS' ? 'bg-warning/10 text-warning' :
                                                    'bg-destructive/10 text-destructive'
                                    )}>
                                        {(t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ?
                                            <ArrowRight className="w-4 h-4 rotate-45" /> :
                                            <ArrowRight className="w-4 h-4 -rotate-45" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{t.description || t.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-bold font-mono text-sm tracking-tight",
                                        (t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ? 'text-success' : 'text-foreground'
                                    )}>
                                        {(t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] uppercase font-bold mt-0.5",
                                        t.status === 'SUCCESS' || t.status === 'APPROVED' ? 'text-success/80' : 'text-muted-foreground'
                                    )}>
                                        {t.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No recent activity recorded.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Growth Calculator Modal */}
            <GrowthCalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
                defaultPrincipal={userPrincipal}
            />
        </div>
    );
}

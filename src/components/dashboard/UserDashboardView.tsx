import DashboardHero from "@/components/dashboard/DashboardHero";
import FinancialActions from "@/components/dashboard/FinancialActions";
import RealTimeUpdater from "@/components/dashboard/RealTimeUpdater";
import ClientTime from "@/components/common/ClientTime";
import { ArrowRight, Wallet, PieChart, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UserDashboardViewProps {
    data: {
        wallet: any;
        transactions: any[];
        user: any;
        totalReferrals: number;
    };
}

export default function UserDashboardView({ data }: UserDashboardViewProps) {
    const { wallet, transactions, user } = data;
    const recentTransactions = transactions?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-emerald-500/30">
            <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
                <RealTimeUpdater />

                {/* HEADER SECTION (Design Plan C) */}
                <div className="relative w-full p-8 rounded-3xl overflow-hidden mb-8 border border-white/5 shadow-2xl group">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 via-[#0B1120] to-[#0B1120] z-0"></div>
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

                    {/* Decorative Shine */}
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-medium text-emerald-400">Market Active</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{user?.name?.split(" ")[0]}</span>
                            </h1>
                            <p className="text-slate-400 text-sm max-w-md">
                                Your portfolio has been analyzing market trends in real-time. Here is your performance summary for today.
                            </p>
                        </div>
                        <div className="mt-6 md:mt-0 items-end flex flex-col">
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> System Time
                            </div>
                            <div className="text-xl font-mono font-medium text-white/80">
                                <ClientTime />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. HERO STATS */}
                <DashboardHero wallet={wallet} />

                {/* 2. QUICK ACTIONS */}
                <div id="actions">
                    <FinancialActions preference={user?.payoutPreference || "COMPOUND"} />
                </div>

                {/* 3. DEEP NAVIGATION CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Portfolio Shortcut */}
                    <Link href="/dashboard/portfolio" className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="relative z-10 text-lg font-bold text-white mb-1">Portfolio Analysis</h3>
                        <p className="relative z-10 text-sm text-slate-400">Detailed asset allocation & performance metrics.</p>
                    </Link>

                    {/* Market Shortcut */}
                    <Link href="/dashboard/market" className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:text-white group-hover:bg-purple-500 transition-colors">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h3 className="relative z-10 text-lg font-bold text-white mb-1">Market Insights</h3>
                        <p className="relative z-10 text-sm text-slate-400">Latest strategies and market simulation data.</p>
                    </Link>
                </div>

                {/* 4. RECENT TRANSACTIONS */}
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1120] shadow-xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-500" />
                            Recent Activity
                        </h3>
                        <Link href="/dashboard/transactions" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 uppercase tracking-wider hover:underline">
                            View Full History
                        </Link>
                    </div>

                    <div className="divide-y divide-white/5">
                        {recentTransactions.map((t: any) => (
                            <div key={t._id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-full transition-transform group-hover:scale-110",
                                        t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' :
                                            t.type === 'PROFIT' ? 'bg-blue-500/10 text-blue-400' :
                                                t.type === 'REFERRAL_BONUS' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-rose-500/10 text-rose-400'
                                    )}>
                                        {(t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ?
                                            <ArrowRight className="w-4 h-4 rotate-45" /> :
                                            <ArrowRight className="w-4 h-4 -rotate-45" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-200">{t.description || t.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-bold font-mono text-sm tracking-tight",
                                        (t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ? 'text-emerald-400' : 'text-slate-200'
                                    )}>
                                        {(t.type === 'DEPOSIT' || t.type === 'PROFIT' || t.type === 'REFERRAL_BONUS') ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] uppercase font-bold mt-0.5",
                                        t.status === 'SUCCESS' || t.status === 'APPROVED' ? 'text-emerald-500/60' : 'text-slate-600'
                                    )}>
                                        {t.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No recent activity recorded.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

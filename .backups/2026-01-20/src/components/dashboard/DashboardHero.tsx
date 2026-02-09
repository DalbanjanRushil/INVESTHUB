"use client";

import { Wallet, TrendingUp, Lock, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
    wallet: any; // We use any to support the dynamic fields from backend
}

export default function DashboardHero({ wallet }: DashboardHeroProps) {
    // Multi-Wallet Aggregation (Safety Wrapped)
    const principal = Number(wallet?.principal) || 0;
    const profit = Number(wallet?.profit) || 0;
    const referral = Number(wallet?.referral) || 0;
    const lockedAmount = Number(wallet?.locked) || 0;

    // Total Assets = Funds Available + Locked Investments
    const totalValue = principal + profit + referral + lockedAmount;

    const stats = [
        {
            title: "Total Portfolio Value",
            value: totalValue,
            icon: Wallet,
            change: "+2.4%", // Todo: Real calculation vs last month
            subtext: "Including locked assets",
            colorClass: "text-emerald-400",
            bgClass: "bg-emerald-500/10",
            glowClass: "group-hover:from-emerald-500/10"
        },
        {
            title: "Total Profit Earned",
            value: wallet.totalProfit || 0,
            icon: TrendingUp,
            change: "+12.5%",
            subtext: "All time return",
            colorClass: "text-blue-400",
            bgClass: "bg-blue-500/10",
            glowClass: "group-hover:from-blue-500/10"
        },
        {
            title: "Locked Assets",
            value: lockedAmount,
            icon: Lock,
            change: lockedAmount > 0 ? "Active" : "None",
            subtext: "Fixed Deposit / Strategies",
            colorClass: "text-amber-400",
            bgClass: "bg-amber-500/10",
            glowClass: "group-hover:from-amber-500/10"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg hover:bg-white/[0.07] transition-all duration-300 group overflow-hidden">
                    {/* Inner Glow Effect on Hover */}
                    <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent transition-all duration-500", stat.glowClass)}></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl transition-colors group-hover:text-white group-hover:shadow-lg", stat.bgClass, stat.colorClass.replace('text', 'bg').replace('400', '500'))}>
                                <stat.icon className="w-6 h-6 text-current" />
                            </div>
                            <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/5 border border-white/5", stat.colorClass)}>
                                <ArrowUpRight className="w-3 h-3" />
                                {stat.change}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wide">{stat.title}</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">
                                ₹{stat.value.toLocaleString()}
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full inline-block", stat.colorClass.replace("text-", "bg-"))}></span>
                                {stat.subtext}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Copy, Users, Check, Gift, TrendingUp, Share2, Loader2 } from "lucide-react";

export default function ReferralPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch("/api/user/referrals")
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const copyToClipboard = () => {
        if (!data?.myReferralCode) return;
        navigator.clipboard.writeText(data.myReferralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Loading Referral Program...</p>
        </div>
    );

    return (

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8 min-h-screen bg-background">
            {/* Header - Unified Glass Style */}
            <div className="flex items-center justify-between p-6 bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <Gift className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
                            Referral Program
                        </h1>
                        <p className="text-muted-foreground font-medium">Invite friends and earn rewards together.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Stats & Code */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Hero Card */}
                    <div className="p-8 relative overflow-hidden rounded-2xl border border-indigo-500/30 shadow-2xl bg-card group">
                        {/* Animated background accent */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-3 text-foreground">Share the wealth</h2>
                            <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
                                Earn <span className="font-bold text-emerald-500 dark:text-emerald-400">₹500</span> for every friend who joins and makes their first investment. They get exclusive access to premium strategies.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <div className="bg-secondary/50 backdrop-blur-md rounded-xl p-2 pl-5 flex items-center border border-indigo-500/30 w-full sm:w-auto shadow-inner">
                                    <code className="font-mono text-xl font-bold tracking-widest text-indigo-500 dark:text-indigo-400">
                                        {data?.myReferralCode || "GENERATING..."}
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="ml-6 p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                        title="Copy Code"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <button className="px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:translate-y-[-2px]">
                                    <Share2 className="w-4 h-4" /> Share Link
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex items-center gap-5 relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Referrals</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{data?.count || 0}</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex items-center gap-5 relative overflow-hidden">
                            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Earnings</p>
                                <p className="text-3xl font-bold text-foreground mt-1">₹{data?.totalEarnings?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: List */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl h-fit">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground border-b border-border pb-4">
                        <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        Your Network
                    </h3>

                    {data?.referrals?.length > 0 ? (
                        <div className="space-y-3">
                            {data.referrals.map((ref: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border hover:border-indigo-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                            {ref.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{ref.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                                                {new Date(ref.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                        ACTIVE
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No referrals yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

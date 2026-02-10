"use client";

import { useEffect, useState } from "react";
import ContentFeed from "@/components/dashboard/ContentFeed";
import StrategyManager from "@/components/admin/StrategyManager";
import AllocationCharts from "@/components/admin/AllocationCharts";
import { Loader2, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function MarketFeedPage() {
    const { data: session, status } = useSession();
    const [strategyData, setStrategyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/login");
        }

        if (status === "authenticated") {
            fetchStrategyData();
        }
    }, [status]);

    async function fetchStrategyData() {
        try {
            const res = await fetch("/api/strategy");
            const json = await res.json();
            if (json.success) {
                setStrategyData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch strategy data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSeed() {
        if (!confirm("This will replace all existing strategies with seed data. Continue?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/strategy/seed", { method: "POST" });
            const json = await res.json();
            if (json.success) {
                alert("Seeding successful!");
                fetchStrategyData();
            } else {
                alert("Seeding failed: " + json.error);
            }
        } catch (error) {
            alert("Error seeding data");
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-12 pb-24 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Market & Strategy Intelligence</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Deep-dive into InvestHub's real-world fund allocation, risk-adjusted performance maps, and latest market broadcasts.
                    </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    STRATEGY LIVE
                </div>
            </div>

            {/* SECTION 1: Fund Allocation & Strategy Manager (NEW) */}
            {strategyData && strategyData.metrics && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StrategyManager
                        strategies={strategyData.strategies}
                        metrics={strategyData.metrics}
                        isAdmin={session?.user?.role === "ADMIN"}
                    />

                    <AllocationCharts strategies={strategyData.strategies} />
                </div>
            )}

            {(!strategyData || !strategyData.metrics) && !loading && (
                <div className="p-12 rounded-3xl bg-secondary/30 border border-border text-center">
                    <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No active strategies found</h3>
                    <p className="text-muted-foreground mb-6">The strategy map is currently being updated by the administration.</p>

                    {session?.user?.role === "ADMIN" && (
                        <button
                            onClick={handleSeed}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg"
                        >
                            Seed Initial Strategies
                        </button>
                    )}
                </div>
            )}

            {/* SECTION 2: Market Feed & CEO Broadcasts (EXISTING) */}
            <div className="pt-12 border-t border-border">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Broadcasts & Intelligence</h2>
                    <p className="text-muted-foreground text-sm">Latest technical updates, macro analysis, and CEO's vision.</p>
                </div>
                <ContentFeed />
            </div>
        </div>
    );
}


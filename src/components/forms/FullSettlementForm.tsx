"use client";

import { useState } from "react";
import { Loader2, Landmark, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FullSettlementForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [threshold, setThreshold] = useState("0");

    const handleFullSettlement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm("⚠️ WARNING: This is a DESTRUCTIVE action.\n\nThis will:\n1. LIQUIDATE all active investments (Locked funds).\n2. Withdraw ALL Profit & Principal.\n3. Close all open positions.\n\nAre you absolutely sure you want to proceed?")) return;

        setLoading(true);

        try {
            const res = await fetch("/api/admin/settle/full", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ minBalance: Number(threshold) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to run full settlement");
            }

            toast.success(`Full Settlement Complete! Liquidated & Withdrawn regarding ${data.stats.count} users. Total: ₹${data.stats.totalAmount}`);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] p-6 relative overflow-hidden group mt-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/20 transition-all" />

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <RefreshCcw className="w-5 h-5 text-red-500" />
                Full Portfolio Liquidation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
                Emergency/Exit Protocol: Liquidates <strong>LOCKED (Flexi/Fixed)</strong> funds + Liquid funds. Creates withdrawal requests for the <strong>Entire Portfolio Value</strong>.
            </p>

            <form onSubmit={handleFullSettlement} className="space-y-4 relative z-10">
                <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                        Residual Balance (Usually 0)
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-muted-foreground/50"
                        placeholder="0"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                    />
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <p>
                        <strong>Extreme Action:</strong> This closes active investments early. Users will receive full capital + currently realized profit.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex justify-center shadow-lg shadow-red-600/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "EXECUTE FULL DISSOLUTION"}
                </button>
            </form>
        </div>
    );
}

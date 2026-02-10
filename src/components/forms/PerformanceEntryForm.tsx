"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PerformanceEntryForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [periodType, setPeriodType] = useState("MONTHLY");
    const [periodLabel, setPeriodLabel] = useState("");
    const [grossProfit, setGrossProfit] = useState("");
    const [grossLoss, setGrossLoss] = useState("0");
    const [capitalDeployed, setCapitalDeployed] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/performance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    periodType,
                    periodLabel,
                    grossProfit: Number(grossProfit),
                    grossLoss: Number(grossLoss),
                    capitalDeployed: Number(capitalDeployed),
                    notes
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create period");
            }

            toast.success("Performance Period Declared (Draft)");
            // Reset form
            setPeriodLabel("");
            setGrossProfit("");
            setCapitalDeployed("");
            setNotes("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Declare Performance
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Type</label>
                        <select
                            value={periodType}
                            onChange={(e) => setPeriodType(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="MONTHLY" className="bg-background text-foreground">Monthly</option>
                            <option value="QUARTERLY" className="bg-background text-foreground">Quarterly</option>
                            <option value="YEARLY" className="bg-background text-foreground">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Label</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Jan 2026"
                            value={periodLabel}
                            onChange={(e) => setPeriodLabel(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-500 mb-1">Gross Profit (₹)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={grossProfit}
                            onChange={(e) => setGrossProfit(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-destructive mb-1">Gross Loss (₹)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={grossLoss}
                            onChange={(e) => setGrossLoss(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase text-blue-600 dark:text-blue-500 mb-1">Capital Deployed (₹)</label>
                    <input
                        type="number"
                        required
                        min="1"
                        value={capitalDeployed}
                        onChange={(e) => setCapitalDeployed(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Notes / Context</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50"
                        placeholder="Market conditions, strategy used, etc."
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Declare Period"}
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        Creates a DRAFT. You must LOCK it later to make it public.
                    </p>
                </div>
            </form>
        </div>
    );
}

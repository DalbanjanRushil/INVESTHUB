"use client";

import { useState, useMemo, useEffect } from "react";
import { Loader2, TrendingUp, AlertTriangle, Link as LinkIcon, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProfitDistributionFormProps {
    performancePeriods?: any[]; // Passed from parent
}

export default function ProfitDistributionForm({ performancePeriods = [] }: ProfitDistributionFormProps) {
    const [amount, setAmount] = useState("");
    const [selectedPeriodId, setSelectedPeriodId] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter only valid periods for distribution (Locked AND Not Linked)
    const availablePeriods = useMemo(() => {
        return performancePeriods.filter(p => p.locked && !p.distributionLinked);
    }, [performancePeriods]);

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedPeriodId(id);

        if (id) {
            const period = availablePeriods.find(p => p._id === id);
            if (period && period.netProfit) {
                setAmount(period.netProfit.toString());
            }
        } else {
            setAmount("");
        }
    };

    const handleDistribute = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid profit amount");
            return;
        }

        const confirmMessage = selectedPeriodId
            ? `Connect Profit Distribution to Period?\nAmount: ₹${amount}\n\nThis will mark the period as 'Distributed' and pay users.`
            : `Are you sure you want to distribute ₹${amount} as an Ad-Hoc payment? This action cannot be undone.`;

        const confirm = window.confirm(confirmMessage);
        if (!confirm) return;

        setLoading(true);

        try {
            const payload: any = { amount: Number(amount) };
            if (selectedPeriodId) {
                payload.performancePeriodId = selectedPeriodId;
            }

            const res = await fetch("/api/admin/distribute-profit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to distribute");
            }

            toast.success(`Success! Distributed to ${data.stats.recipients} users.`);
            setAmount("");
            setSelectedPeriodId("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="bg-card rounded-2xl border border-border shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp className="w-32 h-32" />
            </div>

            <h3 className="text-lg font-bold mb-1 text-foreground">Profit Engine</h3>
            <p className="text-sm text-muted-foreground mb-6">
                Declare monthly returns. System automatically splits 50% to Admin and 50% to Investors.
            </p>

            <div className="space-y-4">
                {/* Period Selector */}
                {availablePeriods.length > 0 ? (
                    <div>
                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> Link to Performance Period
                        </label>
                        <select
                            value={selectedPeriodId}
                            onChange={handlePeriodChange}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-foreground appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-background text-foreground">-- Select Ad-hoc / Manual --</option>
                            {availablePeriods.map((p) => (
                                <option key={p._id} value={p._id} className="bg-background text-foreground">
                                    {p.periodLabel} (Net: ₹{p.netProfit.toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic">
                        No locked performance periods available for distribution.
                        <a href="/admin/performance" className="text-emerald-500 underline ml-1">Create One</a>
                    </div>
                )}

                {/* Amount Input */}
                <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                        Total Profit to Distribute (₹)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={!!selectedPeriodId} // Disable editing if linked
                            placeholder="e.g. 100000"
                            suppressHydrationWarning
                            className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors text-foreground ${selectedPeriodId
                                ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                                : "bg-background border-border focus:ring-2 focus:ring-emerald-500"
                                }`}
                        />
                        {selectedPeriodId && <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />}
                    </div>
                </div>

                <button
                    onClick={handleDistribute}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <TrendingUp className="w-4 h-4" /> Run {selectedPeriodId ? 'Linked' : 'Manual'} Distribution
                        </>
                    )}
                </button>

                <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        <strong>Warning:</strong> This updates all user wallets immediately. Ensure calculations are final.
                    </p>
                </div>
            </div>
        </div>
    );
}

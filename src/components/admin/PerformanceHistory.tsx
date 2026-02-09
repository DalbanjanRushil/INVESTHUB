"use client";

import { useState } from "react";
import { Lock, Unlock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Period {
    _id: string;
    periodLabel: string;
    netProfit: number;
    roiPercent: number;
    locked: boolean;
    createdAt: string;
}

export default function PerformanceHistory({ periods }: { periods: Period[] }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleLock = async (id: string) => {
        if (!confirm("Are you sure you want to LOCK this period? This makes it immutable and visible to users.")) return;

        setLoadingId(id);
        try {
            const res = await fetch(`/api/admin/performance/${id}/lock`, { method: "PATCH" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            toast.success("Period Locked Successfully");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Performance Ledger</h3>
            </div>

            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {periods.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No periods declared yet.</div>
                ) : (
                    periods.map((period) => (
                        <div key={period._id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-foreground text-lg">{period.periodLabel}</span>
                                    {period.locked ? (
                                        <span className="px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> Locked
                                        </span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                            <Unlock className="w-3 h-3" /> Draft
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground space-x-3 font-mono">
                                    <span>Net: <span className={period.netProfit >= 0 ? "text-accent-primary" : "text-destructive"}>
                                        ₹{period.netProfit.toLocaleString()}
                                    </span></span>
                                    <span>•</span>
                                    <span>ROI: <span className={period.roiPercent >= 0 ? "text-accent-primary" : "text-destructive"}>
                                        {period.roiPercent.toFixed(2)}%
                                    </span></span>
                                </div>
                            </div>

                            <div>
                                {!period.locked && (
                                    <button
                                        onClick={() => handleLock(period._id)}
                                        disabled={loadingId === period._id}
                                        className="p-2 bg-secondary hover:bg-muted text-muted-foreground rounded-lg border border-border transition"
                                        title="Lock Period"
                                    >
                                        {loadingId === period._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    </button>
                                )}
                                {period.locked && (
                                    <div className="p-2 text-accent-primary">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

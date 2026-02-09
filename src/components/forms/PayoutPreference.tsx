"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

interface PayoutPreferenceProps {
    initialPreference: "COMPOUND" | "PAYOUT";
}

import { toast } from "sonner";

export default function PayoutPreference({ initialPreference }: PayoutPreferenceProps) {
    const [preference, setPreference] = useState<"COMPOUND" | "PAYOUT">(initialPreference);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const togglePreference = async (newVal: "COMPOUND" | "PAYOUT") => {
        if (newVal === preference) return;
        setLoading(true);

        try {
            const res = await fetch("/api/settings/update-preference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payoutPreference: newVal }),
            });

            if (!res.ok) throw new Error("Failed to update");

            setPreference(newVal);
            toast.success("Preference Updated!");
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update preference");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm mt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white dark:text-white">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Profit Strategy
            </h3>

            <div className="flex bg-slate-900 dark:bg-slate-900 p-1 rounded-xl border border-white/10">
                <button
                    onClick={() => togglePreference("COMPOUND")}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${preference === "COMPOUND"
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    <RefreshCw className={`w-4 h-4 ${preference === "COMPOUND" ? "animate-spin-slow" : ""}`} />
                    Auto-Compound
                </button>
                <button
                    onClick={() => togglePreference("PAYOUT")}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${preference === "PAYOUT"
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                >
                    <Wallet className="w-4 h-4" />
                    Payout Wallet
                </button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
                {preference === "COMPOUND"
                    ? "Profits will be automatically added to your principal balance for compound growth."
                    : "Profits will be credited to your Payout Wallet, available for withdrawal anytime."}
            </p>
        </div>
    );
}

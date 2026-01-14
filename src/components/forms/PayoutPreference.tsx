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
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                Profit Strategy
            </h3>

            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                    onClick={() => togglePreference("COMPOUND")}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${preference === "COMPOUND"
                        ? "bg-white dark:bg-black shadow-sm text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <RefreshCw className={`w-4 h-4 ${preference === "COMPOUND" ? "animate-spin-slow" : ""}`} />
                    Auto-Compound
                </button>
                <button
                    onClick={() => togglePreference("PAYOUT")}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${preference === "PAYOUT"
                        ? "bg-white dark:bg-black shadow-sm text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Wallet className="w-4 h-4" />
                    Payout Wallet
                </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
                {preference === "COMPOUND"
                    ? "Profits will be automatically added to your principal balance for compound growth."
                    : "Profits will be credited to your Payout Wallet, available for withdrawal anytime."}
            </p>
        </div>
    );
}

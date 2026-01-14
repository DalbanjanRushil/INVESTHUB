"use client";

import { useState } from "react";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function ProfitDistributionForm() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDistribute = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid profit amount");
            return;
        }

        const confirm = window.confirm(
            `Are you sure you want to distribute ₹${amount}? This action cannot be undone.`
        );
        if (!confirm) return;

        setLoading(true);

        try {
            const res = await fetch("/api/admin/distribute-profit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to distribute");
            }

            toast.success(`Success! Distributed to ${data.stats.recipients} users.`);
            setAmount("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp className="w-32 h-32" />
            </div>

            <h3 className="text-lg font-bold mb-1">Profit Engine</h3>
            <p className="text-sm text-gray-500 mb-6">
                Declare monthly returns. System automatically splits 50% to Admin and 50% to Investors.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">
                        Total Profit Generated (₹)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 100000"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                </div>

                <button
                    onClick={handleDistribute}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <TrendingUp className="w-4 h-4" /> Run Distribution
                        </>
                    )}
                </button>

                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-500">
                        <strong>Warning:</strong> This updates all user wallets immediately. Ensure calculations are final.
                    </p>
                </div>
            </div>
        </div>
    );
}

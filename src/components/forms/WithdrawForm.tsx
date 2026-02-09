"use client";

import { useState } from "react";
import { Loader2, ArrowDownCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function WithdrawForm() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleWithdraw = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/finance/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to request withdrawal");
            }

            toast.success("Withdrawal requested! Funds deducted and held pending approval.");
            setAmount("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white dark:text-white">
                <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                Withdraw Funds
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase text-slate-300 dark:text-slate-300 mb-1 block">Amount (INR)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-900 border border-white/10 dark:border-white/10 rounded-lg text-white dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleWithdraw}
                    disabled={loading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Withdrawal"}
                </button>
                <p className="text-xs text-center text-slate-400 dark:text-slate-400">
                    Funds are locked until Admin approval.
                </p>
            </div>
        </div>
    );
}

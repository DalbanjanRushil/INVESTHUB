"use client";

import { useState } from "react";
import { Loader2, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettlementForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [threshold, setThreshold] = useState("0");

    const handleSettlement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm("Are you sure you want to run Quarterly Settlement? This will create withdrawal requests for all users with excess balance.")) return;

        setLoading(true);

        try {
            const res = await fetch("/api/admin/settle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ minBalance: Number(threshold) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to run settlement");
            }

            alert(`Settlement Complete! Created ${data.stats.count} withdrawal requests totaling ₹${data.stats.totalAmount}`);
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-600" />
                Quarterly Settlement
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Automatically create withdrawal requests for users with balance above a threshold.
            </p>

            <form onSubmit={handleSettlement} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">
                        Minimum Wallet Balance To Keep (₹)
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-lg"
                        placeholder="e.g. 0 to withdraw all"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                    />
                </div>

                <div className="p-3 bg-purple-50 text-purple-700 rounded-lg text-xs">
                    <strong>Note:</strong> Excess funds will be converted into PENDING withdrawal requests.
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex justify-center"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Settlement"}
                </button>
            </form>
        </div>
    );
}

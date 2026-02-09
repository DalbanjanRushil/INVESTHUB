"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

// Extend window interface for Razorpay
declare global {
    interface Window {
        Razorpay: any;
    }
}

import { toast } from "sonner";

export default function DepositModal() {
    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePayment = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Order
            const res = await fetch("/api/finance/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to initiate deposit");
            }

            // 2. Open Razorpay Modal
            const options = {
                key: data.keyId,
                amount: data.amount * 100, // in paise
                currency: data.currency,
                name: "InvestHub Simulation",
                description: "Virtual Wallet Deposit (Test Mode)",
                order_id: data.orderId,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch("/api/finance/deposit/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            toast.success("Deposit Successful!");
                            setAmount("");
                            router.refresh(); // Refresh dashboard data
                        } else {
                            toast.error("Payment verification failed.");
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error("Error verifying payment");
                    }
                },
                prefill: {
                    name: "InvestHub User",
                    email: "user@example.com",
                },
                theme: {
                    color: "#2563EB",
                },
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />
            <div className="p-6 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white dark:text-white">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Add Funds (Simulation)
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-300 dark:text-slate-300 mb-1 block">Amount (INR)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-900 border border-white/10 dark:border-white/10 rounded-lg text-white dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deposit via Razorpay (Test)"}
                    </button>
                    <p className="text-xs text-center text-slate-400 dark:text-slate-400">
                        *This is a test mode simulation. No real money is deducted.
                    </p>
                </div>
            </div>
        </>
    );
}

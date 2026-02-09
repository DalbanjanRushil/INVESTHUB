"use client";

import { useState } from "react";
import { Plus, ArrowDown, RefreshCw, Landmark, X, Loader2 } from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Razorpay Type Definition
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface FinancialActionsProps {
    preference: "COMPOUND" | "PAYOUT";
}

export default function FinancialActions({ preference: initialPref }: FinancialActionsProps) {
    const [preference, setPreference] = useState(initialPref);
    const [loadingPref, setLoadingPref] = useState(false);

    // Modal States
    const [activeModal, setActiveModal] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
    const [amount, setAmount] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("FLEXI");
    const [processing, setProcessing] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const router = useRouter();

    // --- Payout Preference Toggle ---
    const togglePreference = async () => {
        setLoadingPref(true);
        const newPref = preference === "COMPOUND" ? "PAYOUT" : "COMPOUND";
        try {
            const res = await fetch("/api/user/payout-preference", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preference: newPref }),
            });
            if (res.ok) {
                setPreference(newPref);
                toast.success(`Preference updated to ${newPref === "COMPOUND" ? "Reinvesting" : "Payout"}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update preference");
        } finally {
            setLoadingPref(false);
        }
    };

    // --- Deposit Logic ---
    const handleDeposit = async () => {
        if (!amount || Number(amount) <= 0) return toast.error("Enter valid amount");
        setProcessing(true);
        try {
            const res = await fetch("/api/finance/deposit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount), plan: selectedPlan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const options = {
                key: data.keyId,
                amount: data.amount * 100,
                currency: data.currency,
                name: "InvestHub",
                description: "Portfolio Deposit",
                order_id: data.orderId,
                handler: async function (response: any) {
                    setVerifying(true);
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
                            const data = await verifyRes.json();
                            if (data.success !== undefined && !data.success) {
                                throw new Error(data.error || "Verification failed logically");
                            }

                            toast.success("Deposit Successful! Funds added to your wallet.");
                            setAmount("");
                            setActiveModal(null);
                            router.refresh();
                            // Backup refresh to ensure DB consistency if primary was too fast
                            setTimeout(() => router.refresh(), 2000);
                        } else {
                            const errorData = await verifyRes.json();
                            toast.error(errorData.error || "Verification failed");
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Error verifying payment");
                        // Keep modal open so they can retry or see error
                        setVerifying(false);
                    } finally {
                        if (activeModal === null) setVerifying(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                },
                theme: { color: "#10B981" },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            toast.error(err.message);
            setProcessing(false);
        }
    };

    // --- Withdraw Logic ---
    const handleWithdraw = async () => {
        if (!amount || Number(amount) <= 0) return toast.error("Enter valid amount");
        setProcessing(true);
        try {
            const res = await fetch("/api/finance/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount) }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error);
            }
            toast.success("Withdrawal Requested Successfully");
            setAmount("");
            setActiveModal(null);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessing(false);
        }
    };

    // --- Helper to Open Modal Cleanly ---
    const openModal = (type: "DEPOSIT" | "WITHDRAW") => {
        setProcessing(false);
        setVerifying(false);
        setAmount("");
        setActiveModal(type);
    };

    return (
        <>
            <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Button 1: Add Funds */}
                <button
                    onClick={() => openModal("DEPOSIT")}
                    className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-emerald-500/25 active:scale-95"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="rounded-full bg-white/20 p-1">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-wide">Add Funds</span>
                    </div>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1s_infinite]" />
                </button>

                {/* Button 2: Withdraw */}
                <button
                    onClick={() => openModal("WITHDRAW")}
                    className="group relative h-14 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-blue-500/25 active:scale-95"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="rounded-full bg-white/20 p-1">
                            <ArrowDown className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-wide">Withdraw</span>
                    </div>
                </button>

                {/* Button 3: Preference Toggle */}
                <button
                    onClick={togglePreference}
                    disabled={loadingPref}
                    className={cn(
                        "group relative h-14 w-full overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-between px-6",
                        preference === "COMPOUND"
                            ? "border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400"
                            : "border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-400"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {preference === "COMPOUND" ? <RefreshCw className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                        <span className="font-bold text-sm">
                            {preference === "COMPOUND" ? "Reinvesting" : "Bank Payout"}
                        </span>
                    </div>

                    {/* Toggle Switch Visual */}
                    <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-300",
                        preference === "COMPOUND" ? "bg-blue-300 dark:bg-blue-800" : "bg-purple-300 dark:bg-purple-800"
                    )}>
                        <div className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                            preference === "COMPOUND" ? "left-0.5" : "translate-x-5"
                        )} />
                    </div>
                </button>
            </div>

            {/* --- Unified Modal Overlay --- */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { setActiveModal(null); setAmount(""); }}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-bold mb-1 text-foreground">
                            {activeModal === "DEPOSIT" ? "Add Funds" : "Request Withdrawal"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            {activeModal === "DEPOSIT"
                                ? "Secure payment gateway via Razorpay"
                                : "Funds will be transferred to your linked bank account"}
                        </p>

                        <div className="space-y-4">
                            {activeModal === "DEPOSIT" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground block">Investment Plan</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'FLEXI', label: 'Flexi (No Lock)', desc: 'Standard Return' },
                                            { id: 'FIXED_3M', label: '3 Months', desc: 'Locked' },
                                            { id: 'FIXED_6M', label: '6 Months', desc: 'Locked' },
                                            { id: 'FIXED_1Y', label: '1 Year', desc: 'Locked' },
                                        ].map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan.id)}
                                                className={cn(
                                                    "p-3 rounded-lg border text-left transition-all",
                                                    selectedPlan === plan.id
                                                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                        : "bg-muted border-border hover:bg-muted/80 text-foreground"
                                                )}
                                            >
                                                <div className="text-sm font-bold">{plan.label}</div>
                                                <div className={cn("text-[10px]", selectedPlan === plan.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Enter Amount (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-4 text-xl font-bold bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                onClick={activeModal === "DEPOSIT" ? handleDeposit : handleWithdraw}
                                disabled={processing || verifying}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                                    activeModal === "DEPOSIT"
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                                )}
                            >
                                {(processing || verifying) && <Loader2 className="w-5 h-5 animate-spin" />}
                                {verifying ? "Verifying Payment..." : (activeModal === "DEPOSIT" ? "Proceed to Pay" : "Confirm Request")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

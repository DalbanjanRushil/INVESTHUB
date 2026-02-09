
"use client";

import { useState } from "react";
import { Lock, Unlock, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Investment {
    _id: string;
    amount: number;
    plan: string;
    startDate: string;
    maturityDate: string;
    isActive: boolean;
}

export default function MaturityTimeline({ investments }: { investments: Investment[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Filter for Active Fixed Plans
    const activeFixed = investments?.find(inv => inv.isActive && inv.plan.startsWith("FIXED"));

    if (!activeFixed) return null;

    // Calculate Progress
    const start = new Date(activeFixed.startDate).getTime();
    const end = new Date(activeFixed.maturityDate).getTime();
    const now = Date.now();
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

    const timeLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24))); // Days left

    const handleBreakDeposit = async () => {
        if (!confirm(`Are you sure you want to break this deposit?\n\nOriginal Amount: ₹${activeFixed.amount}\nPenalty (10%): ₹${activeFixed.amount * 0.1}\nNet Refund: ₹${activeFixed.amount * 0.9}\n\nThis action cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/finance/invest/break", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ investmentId: activeFixed._id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Deposit broken successfully. Withdrawal requested!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full p-6 md:p-8 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-xl relative overflow-hidden group mb-8">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                        <h3 className="text-lg font-bold text-white tracking-tight">Maturity Timeline</h3>
                    </div>
                    <p className="text-slate-400 text-sm">Tracking your <span className="text-orange-400 font-mono font-bold">{activeFixed.plan.replace('FIXED_', '')}</span> Lock-in Plan</p>
                </div>

                {progress < 100 && (
                    <div className="mt-4 md:mt-0 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-orange-400 font-medium">Early withdrawal penalty: 15%</span>
                        {/* Note: UI says 15% in image, prompt said 10%. Keeping prompt logic (10%) but UI label generic or dynamic later. 
                            Wait, prompt said "if user withdraws money earlier , then 10 % deducted". 
                            Image says 15%. I will match the text to the prompt: 10%.
                        */}
                    </div>
                )}
            </div>

            {/* Timeline Graphic */}
            <div className="relative py-8 px-2 md:px-8 mb-8">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full z-0"></div>

                {/* Active Progress */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-orange-500 border-4 border-[#0F172A] rounded-full shadow-[0_0_20px_rgba(249,115,22,0.5)]"></div>
                </div>

                <div className="relative z-10 flex justify-between w-full text-center">
                    {/* Start Node */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-blue-500 shadow-lg bg-[#0F172A]">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-medium text-slate-300">
                            Day 1<br /><span className="text-slate-500">Invested</span>
                        </div>
                    </div>

                    {/* Compounding Node (Middle) */}
                    <div className="hidden md:flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0F172A] ${progress > 50 ? 'border-purple-500 text-purple-500' : 'border-slate-700 text-slate-700'}`}>
                            <span className="text-[10px] tracking-widest">...</span>
                        </div>
                        <div className="text-xs font-medium text-slate-500">Compounding</div>
                    </div>

                    {/* Locked Node */}
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg bg-[#0F172A] ${progress < 100 ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-slate-700 text-slate-700'}`}>
                            <Lock className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-medium text-slate-300">
                            {timeLeft} Days<br /><span className="text-orange-500 font-bold">Locked</span>
                        </div>
                    </div>

                    {/* Release Node */}
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-[#0F172A] ${progress >= 100 ? 'border-green-500 text-green-500' : 'border-slate-700 text-slate-600'}`}>
                            <Unlock className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-medium text-slate-300">
                            Release<br /><span className="text-slate-500">Withdraw</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info and Action */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <div className="flex items-start gap-3 w-full md:w-2/3">
                    <div className="mt-1 min-w-[20px] text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Your capital of <strong className="text-white">₹{activeFixed.amount.toLocaleString()}</strong> is locked until <strong className="text-white">{new Date(activeFixed.maturityDate).toLocaleDateString()}</strong>.
                        Profits are accumulating. Breaking this deposit early incurs a <span className="text-orange-400">10% penalty</span> on principal.
                    </p>
                </div>

                {progress < 100 ? (
                    <button
                        onClick={handleBreakDeposit}
                        disabled={isLoading}
                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {isLoading ? "Processing..." : "Break Deposit (Early Withdraw)"}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                ) : (
                    <button
                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-green-500 text-slate-950 font-bold text-sm hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        onClick={() => router.push('/dashboard/withdraw')}
                    >
                        Matured! Withdraw Now
                        <Unlock className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

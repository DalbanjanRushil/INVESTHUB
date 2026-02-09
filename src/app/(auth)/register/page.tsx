"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, User, Mail, Lock, Gift, CheckCircle, X, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        referralCode: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Referral State
    const [showReferralInput, setShowReferralInput] = useState(false);
    const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
    const [referrerName, setReferrerName] = useState("");

    const checkReferralCode = async (code: string) => {
        if (!code || code.length < 5) return;

        setReferralStatus("checking");
        try {
            const res = await fetch("/api/users/check-referral", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (data.valid) {
                setReferralStatus("valid");
                setReferrerName(data.name);
            } else {
                setReferralStatus("invalid");
                setReferrerName("");
            }
        } catch (err) {
            setReferralStatus("invalid");
        }
    };

    const handleReferralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value;
        setFormData({ ...formData, referralCode: code });
        if (code.length >= 6) {
            checkReferralCode(code);
        } else {
            setReferralStatus("idle");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to register");
            }

            // Automatically redirect to login
            router.push("/login?registered=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30 flex flex-col font-sans overflow-hidden">

            {/* Custom Navbar */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1E293B] rounded-xl flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                            <ArrowLeft className="text-white w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Back to Home</span>
                    </Link>
                    <span className="text-lg md:text-xl font-bold tracking-tight text-white">InvestHub</span>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative pt-20 md:pt-0">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-bounce-slow"></div>

                <div className="w-full max-w-[420px] bg-[#1E293B]/90 backdrop-blur-2xl border border-white/10 rounded-[30px] p-6 md:p-8 shadow-2xl relative z-10 mx-auto">

                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
                        <p className="text-slate-400 text-xs mt-1">Start your journey with InvestHub today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="group relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0F172A]/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Full Name"
                                />
                            </div>

                            <div className="group relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0F172A]/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Email Address"
                                />
                            </div>

                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0F172A]/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Password (min 6 chars)"
                                />
                            </div>
                        </div>

                        {/* Referral Section (Compact & Expandable) */}
                        <div className="pt-1">
                            {!showReferralInput && !formData.referralCode ? (
                                <button
                                    type="button"
                                    onClick={() => setShowReferralInput(true)}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors hover:translate-x-1"
                                >
                                    <Gift className="w-3 h-3" />
                                    Have a referral code?
                                </button>
                            ) : (
                                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Gift className="w-3 h-3 text-purple-400" />
                                            Referral Code
                                        </label>
                                        {!formData.referralCode && (
                                            <button
                                                type="button"
                                                onClick={() => setShowReferralInput(false)}
                                                className="text-[10px] text-slate-500 hover:text-white"
                                            >
                                                Hide
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.referralCode}
                                            onChange={handleReferralChange}
                                            className={`w-full pl-4 pr-10 py-2.5 bg-[#0F172A]/50 border rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-all uppercase tracking-widest font-mono
                                                ${referralStatus === 'valid' ? 'border-purple-500/50 focus:border-purple-500 bg-purple-500/5' :
                                                    referralStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' :
                                                        'border-slate-700/50 focus:border-emerald-500'}
                                            `}
                                            placeholder="REFERRAL123"
                                        />

                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {referralStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                                            {referralStatus === 'valid' && <CheckCircle className="w-4 h-4 text-purple-400" />}
                                            {referralStatus === 'invalid' && <X className="w-4 h-4 text-red-400" />}
                                        </div>
                                    </div>

                                    {/* Success Message */}
                                    <AnimatePresence>
                                        {referralStatus === 'valid' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-medium text-purple-200 uppercase tracking-wider">Referral Applied!</p>
                                                    <p className="text-xs text-white truncate">
                                                        Referred by <span className="font-bold text-purple-300">{referrerName}</span>
                                                    </p>
                                                </div>
                                                <div className="text-purple-400 text-xs font-bold">Woohoo! 🎉</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[1px] mt-2 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    Create Account
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-700/40"></span>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-[#1E293B] px-2 text-slate-500 font-medium tracking-wider">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px]"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign up with Google
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}

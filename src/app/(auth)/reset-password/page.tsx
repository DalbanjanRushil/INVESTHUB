
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            setStatus("error");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters");
            setStatus("error");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Something went wrong");

            setStatus("success");
            // Redirect after delay
            setTimeout(() => router.push("/login"), 3000);
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl text-center">
                <div className="p-4 text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 flex items-center gap-2 justify-center">
                    Invalid or expired link. Please request a new password reset link.
                </div>
                <Link href="/forgot-password" className="text-emerald-400 hover:text-white font-medium transition-colors">Go back</Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative z-10">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Reset Password</h1>
                <p className="text-slate-400 text-sm">
                    Enter your new password below.
                </p>
            </div>

            {status === "success" ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Password Reset!</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        Your password has been changed successfully. Redirecting to login...
                    </p>
                    <Link
                        href="/login"
                        className="block w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all border border-slate-700"
                    >
                        Login Now
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {status === "error" && (
                        <div className="p-4 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                            New Password
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
                    >
                        {status === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset Password"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30 flex flex-col">

            {/* Custom Navbar */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-[#1E293B] rounded-xl flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                            <ArrowLeft className="text-white w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Back to Home</span>
                    </Link>
                    <span className="text-xl font-bold tracking-tight text-white">InvestHub</span>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden pt-32">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-bounce-slow"></div>

                <Suspense fallback={
                    <div className="flex items-center justify-center text-slate-400 relative z-10">
                        <span className="animate-pulse">Loading secure form...</span>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}

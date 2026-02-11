
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Something went wrong");

            setStatus("success");
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        }
    };

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
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="sm" />
                        <span className="text-xl font-bold tracking-tight text-white">InvestHub</span>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden pt-32">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50 animate-bounce-slow"></div>

                <div className="w-full max-w-md bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Forgot Password?</h1>
                        <p className="text-slate-400 text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {status === "success" ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
                            <p className="text-slate-400 text-sm mb-8">
                                We've sent a password reset link to <span className="font-semibold text-white">{email}</span>.
                            </p>
                            <Link
                                href="/login"
                                className="block w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white font-medium rounded-xl transition-all border border-slate-700"
                            >
                                Back to Login
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
                                <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-[#0F172A] border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-inner"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
                            >
                                {status === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
                            </button>

                            <div className="text-center mt-6">
                                <Link
                                    href="/login"
                                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}


"use client";

import { useState } from "react";
import Link from "next/link";

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

        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-40"></div>

            <div className="w-full max-w-md bg-[#0F172A]/70 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Forgot Password?</h1>
                    <p className="text-slate-400 text-sm">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
                        <p className="text-slate-400 text-sm mb-8">
                            We've sent a password reset link to <span className="font-semibold text-white">{email}</span>.
                        </p>
                        <Link
                            href="/login"
                            className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                        >
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === "error" && (
                            <div className="p-4 text-sm text-red-200 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-bold ml-1 text-slate-300">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
                        >
                            {status === "loading" ? "Sending..." : "Send Reset Link"}
                        </button>

                        <div className="text-center mt-6">
                            <Link
                                href="/login"
                                className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

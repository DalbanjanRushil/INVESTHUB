
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
            <div className="w-full max-w-md bg-[#0F172A]/70 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl text-center">
                <div className="p-4 text-red-200 bg-red-900/30 border border-red-800 rounded-xl mb-6">
                    Invalid or expired link. Please request a new password reset link.
                </div>
                <Link href="/forgot-password" className="text-blue-400 hover:text-white font-medium transition-colors">Go back</Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-[#0F172A]/70 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl relative z-10">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">Reset Password</h1>
                <p className="text-slate-400 text-sm">
                    Enter your new password below.
                </p>
            </div>

            {status === "success" ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Password Reset!</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        Your password has been changed successfully. Redirecting to login...
                    </p>
                    <Link
                        href="/login"
                        className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                    >
                        Login Now
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
                        <label className="block text-sm font-bold ml-1 text-slate-300">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold ml-1 text-slate-300">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
                    >
                        {status === "loading" ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden px-4">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-40"></div>

            <Suspense fallback={
                <div className="flex items-center justify-center text-slate-400 relative z-10">
                    <span className="animate-pulse">Loading secure form...</span>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}

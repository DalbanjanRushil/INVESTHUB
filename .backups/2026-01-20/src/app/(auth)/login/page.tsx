"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

                <div className="w-full max-w-md bg-[#0F172A]/70 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                            <span className="text-2xl font-bold text-white">IH</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
                        <p className="text-slate-400 text-sm">Sign in to your InvestHub account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 text-sm text-red-200 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1 mr-1">
                                <label className="text-sm font-bold text-slate-300">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

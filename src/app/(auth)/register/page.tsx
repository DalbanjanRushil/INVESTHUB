"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        referralCode: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-[#020617] flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none opacity-50"></div>

                <div className="w-full max-w-md bg-[#0F172A]/70 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h1>
                        <p className="text-slate-400 text-sm">Join the academic simulation platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 text-sm text-red-200 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">
                                Referral Code (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.referralCode}
                                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                                className="w-full px-4 py-3 bg-[#1E293B] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-inner"
                                placeholder="e.g. RUSH1234"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px] mt-4"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign Up"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
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

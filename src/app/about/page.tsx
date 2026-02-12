import Link from "next/link";
import { Users, Target, Shield, Globe } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30">

            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" />
                        <span className="text-xl font-bold tracking-tight text-white">InvestHub</span>
                    </Link>

                    {/* Centered Links */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Link href="/about" className="text-sm font-medium text-white relative">
                            About
                            <span className="absolute -bottom-5 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        </Link>
                        <Link href="/strategies" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Strategies</Link>
                        <Link href="/contact" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Contact</Link>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/20 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20">
                {/* HERO SECTION */}
                <section className="container mx-auto px-6 mb-32 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
                            <span className="text-emerald-400 text-sm font-medium tracking-wide">Our Mission</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                            Democratizing Financial <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Wisdom Through Simulation.</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            InvestHub wasn't built just to track numbers. It was built to bridge the gap between theory and practice, providing a safe harbor for aspiring investors to test their strategies against real-world logic.
                        </p>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
                </section>

                {/* VALUES GRID */}
                <section className="container mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Target className="w-8 h-8 text-purple-400" />,
                                title: "Precision Simulation",
                                desc: "Our algorithms mirror real-market volatility and compound logic to provide the most accurate learning experience possible."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-blue-400" />,
                                title: "Community First",
                                desc: "We believe in the power of collective learning. Share strategies, compete in leaderboards, and grow together."
                            },
                            {
                                icon: <Shield className="w-8 h-8 text-emerald-400" />,
                                title: "Risk-Free Environment",
                                desc: "Master the psychological aspects of investing without the fear of financial ruin. Fail here so you succeed there."
                            }
                        ].map((value, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-[#1E293B]/50 border border-slate-800 hover:bg-[#1E293B] transition-all duration-300">
                                <div className="mb-6 bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{value.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* STATS SECTION */}
                <section className="container mx-auto px-6 mb-32">
                    <div className="rounded-[40px] bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/5 p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                            {[
                                { number: "10K+", label: "Simulated Trades" },
                                { number: "$50M+", label: "Virtual Volume" },
                                { number: "99.9%", label: "Platform Uptime" },
                                { number: "24/7", label: "Market Access" }
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TEAM SECTION (Simplified) */}
                <section className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Built by Traders, For Traders</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Our team combines decades of financial experience with cutting-edge software engineering to deliver the ultimate simulation platform.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        {/* Placeholder for team or trusted by logos if needed. Using a simple 'Global Reach' card for now */}
                        <div className="flex items-center gap-4 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            <span>Operating Globally across 12+ Virtual Markets</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/5 py-8 bg-[#0B1120]">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} InvestHub. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

"use client";

import Link from "next/link";
import { Mail, MessageSquare, MapPin, Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        message: ""
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setStatus("success");
            setFormData({ firstName: "", lastName: "", email: "", message: "" });

            // Reset success message after 5 seconds
            setTimeout(() => setStatus("idle"), 5000);

        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        }
    };

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
                        <Link href="/about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">About</Link>
                        <Link href="/strategies" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Strategies</Link>
                        <Link href="/contact" className="text-sm font-medium text-white relative">
                            Contact
                            <span className="absolute -bottom-5 left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        </Link>
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

            <main className="pt-32 pb-20 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

                    {/* LEFT COLUMN: Info */}
                    <div className="space-y-12">
                        <div>
                            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
                                <span className="text-emerald-400 text-sm font-medium tracking-wide">Support Center</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Let's start a <br />
                                <span className="text-emerald-400">conversation.</span>
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                Whether you have a technical question, feedback on the simulation, or just want to talk about market strategies, our team is here to help.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
                                    <p className="text-slate-400 mb-1">Our team typically responds within 2 hours.</p>
                                    <a href="mailto:support@investhub.com" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">support@investhub.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                                    <MessageSquare className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Community Discord</h3>
                                    <p className="text-slate-400 mb-1">Join 5,000+ traders in our live channels.</p>
                                    <a href="#" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">Join Server &rarr;</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/20">
                                    <MapPin className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Global HQ</h3>
                                    <p className="text-slate-400">
                                        123 Financial District Pvt Ltd.<br />
                                        Cyber City, Techno Park
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <div className="relative">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10 rounded-full opacity-50"></div>

                        <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl">
                            <h3 className="text-2xl font-bold text-white mb-8">Send us a message</h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</label>
                                    <textarea
                                        rows={4}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === "loading" || status === "success"}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${status === "success"
                                        ? "bg-green-500 hover:bg-green-600 cursor-default"
                                        : status === "error"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-emerald-500 hover:bg-emerald-600"
                                        }`}
                                >
                                    {status === "loading" ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : status === "success" ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Message Sent!
                                        </>
                                    ) : status === "error" ? (
                                        <>
                                            <XCircle className="w-5 h-5" />
                                            Retry?
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Message
                                        </>
                                    )}
                                </button>

                                {status === "error" && (
                                    <p className="text-red-400 text-sm text-center mt-2">{errorMessage}</p>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

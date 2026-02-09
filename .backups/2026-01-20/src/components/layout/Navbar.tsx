"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import { motion } from "framer-motion";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="w-full border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 h-18 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        <span className="font-bold text-lg">IH</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white leading-tight">InvestHub</span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Wealth Management</span>
                    </div>
                </Link>

                {/* Links */}
                <div className="flex items-center gap-6">
                    {session ? (
                        <>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-900/50 p-1 rounded-full border border-gray-100 dark:border-zinc-800">
                                <Link
                                    href={session.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white hover:shadow-sm transition-all flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>

                                {session.user.role !== "ADMIN" ? (
                                    <Link
                                        href="/dashboard/profile"
                                        className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white hover:shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                ) : (
                                    <div className="px-4 py-2 rounded-full text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 flex items-center gap-2 cursor-default border border-red-100 dark:border-red-900/20">
                                        <Shield className="w-3 h-3" />
                                        ADMIN MODE
                                    </div>
                                )}
                            </div>

                            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2" />

                            <NotificationBell />

                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {session.user.name || "User"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 max-w-[120px] truncate">
                                        {session.user.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-zinc-800"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

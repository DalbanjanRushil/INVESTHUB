"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="w-full border-b backdrop-blur-md bg-white/70 dark:bg-black/70 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        IH
                    </div>
                    <span className="hidden sm:block">InvestHub</span>
                </Link>

                {/* Links */}
                <div className="flex items-center gap-6">
                    {session ? (
                        <>
                            {session.user.role === "ADMIN" ? (
                                <Link
                                    href="/admin/dashboard"
                                    className="text-sm font-medium hover:text-blue-600 transition-colors"
                                >
                                    Admin Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-medium hover:text-blue-600 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}

                            <NotificationBell />

                            <div className="flex items-center gap-4 border-l border-gray-200 dark:border-zinc-700 pl-6">
                                <span className="text-sm text-gray-500 hidden sm:block">
                                    {session.user.email}
                                </span>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
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

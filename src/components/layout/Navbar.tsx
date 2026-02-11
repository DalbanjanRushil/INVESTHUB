"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import { motion } from "framer-motion";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { Logo } from "../ui/Logo";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

    return (
        <nav className="w-full border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto px-4 h-18 flex items-center justify-between">
                {/* Logo - Hidden on Dashboard (Duplicate prevention) */}
                {!isDashboard ? (
                    <Link href="/" className="flex items-center gap-3 group group-hover:opacity-90 transition-opacity">
                        <Logo showText />
                    </Link>
                ) : (
                    <div /> // Spacer
                )}

                {/* Links */}
                <div className="flex items-center gap-6">
                    {session ? (
                        <>
                            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border">
                                <Link
                                    href={session.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>

                                {session.user.role !== "ADMIN" ? (
                                    <Link
                                        href="/dashboard/profile"
                                        className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                ) : (
                                    <div className="px-4 py-2 rounded-full text-xs font-bold text-destructive bg-destructive/10 flex items-center gap-2 cursor-default border border-destructive/20">
                                        <Shield className="w-3 h-3" />
                                        ADMIN MODE
                                    </div>
                                )}
                            </div>

                            <div className="h-6 w-px bg-border mx-2" />

                            <NotificationBell />

                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-xs font-bold text-foreground">
                                        {session.user.name || "User"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">
                                        {session.user.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
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
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
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

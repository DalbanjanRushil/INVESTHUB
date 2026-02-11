"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PieChart,
    UserCircle,
    LogOut,
    ShieldCheck,
    Menu,
    X,
    Wallet,
    TrendingUp,
    Users,
    Settings,
    HelpCircle,
    Briefcase,
    Activity,
    FileText,
    Layers,
    Zap
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "../ui/theme-toggle";
import { Logo } from "../ui/Logo";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname() || "";
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!session) return <>{children}</>;

    // User Navigation
    const userNavItems = [
        {
            label: "Overview",
            href: "/dashboard",
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            label: "Portfolio",
            href: "/dashboard/portfolio",
            icon: PieChart, // or Briefcase
            active: pathname.startsWith("/dashboard/portfolio"),
        },
        {
            label: "Performance", // NEW
            href: "/dashboard/performance",
            icon: Zap,
            active: pathname.startsWith("/dashboard/performance"),
        },
        {
            label: "Transactions",
            href: "/dashboard/transactions",
            icon: Wallet,
            active: pathname.startsWith("/dashboard/transactions"),
        },
        {
            label: "Market Feed",
            href: "/dashboard/market",
            icon: TrendingUp,
            active: pathname.startsWith("/dashboard/market"),
        },
        {
            label: "My Profile",
            href: "/dashboard/profile",
            icon: UserCircle,
            active: pathname.startsWith("/dashboard/profile"),
        },
        {
            label: "Referrals",
            href: "/dashboard/referral",
            icon: Users,
            active: pathname.startsWith("/dashboard/referral"),
        },
    ];

    // Admin Navigation
    const adminNavItems = [
        {
            label: "User Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            label: "Command Center",
            href: "/admin/dashboard",
            icon: ShieldCheck,
            active: pathname === "/admin/dashboard",
        },
        {
            label: "Performance Engine", // NEW
            href: "/admin/performance",
            icon: Zap,
            active: pathname.startsWith("/admin/performance"),
        },
        {
            label: "Strategy Manager",
            href: "/admin/investments",
            icon: Activity,
            active: pathname.startsWith("/admin/investments"),
        },
        {
            label: "Operations",
            href: "/admin/operations",
            icon: Layers,
            active: pathname.startsWith("/admin/operations"),
        },
        {
            label: "Content Studio",
            href: "/admin/content",
            icon: FileText,
            active: pathname.startsWith("/admin/content"),
        },
    ];

    const navItems = session.user.role === "ADMIN" ? adminNavItems : userNavItems;

    const dashboardHome = session?.user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

    return (
        <div className="min-h-screen bg-background flex font-sans">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4">
                <Link href={dashboardHome} className="flex items-center gap-2">
                    <Logo size="sm" />
                    <span className="font-bold text-lg tracking-tight text-foreground">InvestHub</span>
                </Link>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-foreground">
                    {isMobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside
                onMouseEnter={() => setIsCollapsed(false)}
                className={cn(
                    "fixed lg:sticky top-0 left-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ease-in-out flex flex-col shadow-xl",
                    isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "lg:w-[80px]" : "lg:w-[240px]"
                )}>
                {/* Logo Area */}
                <div className="h-20 border-b border-border/50 flex items-center">
                    <Link href={dashboardHome} className="w-full h-full flex items-center px-6">
                        <Logo size="md" className={cn("mr-3 transition-transform group-hover:scale-110", isCollapsed ? "mx-auto mr-0" : "")} />
                        <div className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0 hidden" : "opacity-100 block")}>
                            <h1 className="font-bold text-lg leading-tight tracking-tight text-foreground">InvestHub</h1>
                            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                                {session.user.role === 'ADMIN' ? 'Admin Console' : 'Wealth Portal'}
                            </p>
                        </div>
                    </Link>
                </div>

                {/* User Profile Card - Premium Spec */}
                <div className="px-4 py-6">
                    <div className={cn(
                        "rounded-2xl border border-border flex items-center transition-all duration-300 hover:bg-secondary/50 cursor-pointer overflow-hidden relative group",
                        isCollapsed ? "p-2 justify-center bg-transparent border-none" : "p-4 bg-secondary/30"
                    )}>
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold border-2 border-background shadow-sm">
                                {session.user.name?.[0]}
                            </div>
                            {/* KYC Status Ring */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent-primary border-2 border-background" title="Verified Investor"></div>
                        </div>

                        {/* Text (Hidden on collapse) */}
                        <div className={cn("ml-3 flex-1 min-w-0 transition-all duration-300", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
                            <p className="text-sm font-semibold truncate text-foreground">{session.user.name}</p>
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm",
                                    session.user.role === 'ADMIN' ? 'bg-destructive' : 'bg-warning'
                                )}>
                                    {session.user.role === 'ADMIN' ? 'SUPER ADMIN' : 'PREMIUM'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                item.active
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? item.label : ""}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )} />

                            <span className={cn(
                                "transition-all duration-300",
                                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border/50 space-y-1">
                    {!isCollapsed && (
                        <div className="flex items-center justify-between px-2 mb-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">System</span>
                            <span className="text-[10px] text-muted-foreground opacity-50">v2.5.0</span>
                        </div>
                    )}

                    <div className={cn("flex flex-col gap-2", isCollapsed ? "items-center" : "")}>
                        {/* Theme Toggle */}
                        <ThemeToggle isCollapsed={isCollapsed} />

                        {/* Logout */}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className={isCollapsed ? "hidden" : "block"}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 min-h-screen transition-all bg-background">
                {children}
            </main>
        </div>
    );
}

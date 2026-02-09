import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertTriangle, Activity, Database, FileText, ArrowRight, Rss, Users, Landmark, ArrowUpRight, Zap, ClipboardList, TrendingUp } from "lucide-react";
import AdminRealTimeUpdater from "@/components/admin/AdminRealTimeUpdater";
import ContentFeed from "@/components/dashboard/ContentFeed";
import UserManagementModal from "@/components/admin/UserManagementModal";

interface AdminDashboardViewProps {
    stats: {
        userCount: number;
        poolCapital: number;
        pendingWithdrawals: number;
        pendingWithdrawalsList: any[];
        pools?: {
            FLEXI: number;
            FIXED_3M: number;
            FIXED_6M: number;
            FIXED_1Y: number;
        };
    };
}

export default function AdminDashboardView({ stats }: AdminDashboardViewProps) {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            <AdminRealTimeUpdater />

            {/* Admin Header (Inline) */}
            {/* ... */}

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Hero Metrics - Global Command */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Pool Capital */}
                    <div className="relative overflow-hidden rounded-md bg-card border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] group">
                        {/* ... content */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Landmark className="w-24 h-24 text-primary" />
                        </div>
                        <div className="p-6 relative z-10">
                            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Total Liquidity Pool</p>
                            <h2 className="text-4xl font-bold font-mono tracking-tighter tabular-nums text-foreground mt-2">
                                ₹{stats.poolCapital.toLocaleString()}
                            </h2>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/50 rounded border border-border">
                                    <p className="text-[10px] text-accent-primary font-bold uppercase mb-1">Flexi (Liquid)</p>
                                    <p className="text-lg font-mono text-foreground">₹{stats.pools?.FLEXI?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded border border-border">
                                    <p className="text-[10px] text-warning font-bold uppercase mb-1">Locked (Fixed)</p>
                                    <p className="text-lg font-mono text-foreground">
                                        ₹{((stats.pools?.FIXED_3M || 0) + (stats.pools?.FIXED_6M || 0) + (stats.pools?.FIXED_1Y || 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Investors (CLICKABLE) */}
                    <div
                        onClick={() => setIsUserModalOpen(true)}
                        className="rounded-md bg-card border border-border p-6 shadow-sm hover:border-primary/50 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Registered Investors</span>
                                <h2 className="text-3xl font-bold mt-2 font-mono tabular-nums text-foreground group-hover:scale-105 transition-transform origin-left">
                                    {stats.userCount}
                                </h2>
                            </div>
                            <div className="flex flex-col items-end">
                                <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded border border-accent-primary/20 group-hover:bg-accent-primary/20 transition-colors">
                                    <ArrowUpRight className="w-3 h-3" /> ACTIVE
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground relative z-10">
                            <span>Click to Manage Users</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* Card 3: Pending Actions */}
                    <Link href="/admin/operations" className={cn(
                        "rounded-md bg-card border p-6 shadow-sm transition-all group block relative overflow-hidden",
                        stats.pendingWithdrawals > 0
                            ? "border-warning/50 hover:bg-warning/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                            : "border-border hover:border-primary/50"
                    )}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={cn("text-xs font-bold uppercase tracking-widest", stats.pendingWithdrawals > 0 ? "text-warning" : "text-muted-foreground")}>
                                    Action Required
                                </span>
                                <h2 className={cn("text-3xl font-bold mt-2 font-mono tabular-nums", stats.pendingWithdrawals > 0 ? "text-warning/90" : "text-foreground")}>
                                    {stats.pendingWithdrawals}
                                </h2>
                            </div>
                            <div className={cn("p-2 rounded-full", stats.pendingWithdrawals > 0 ? "bg-warning/10 text-warning animate-pulse" : "bg-secondary text-muted-foreground")}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        {stats.pendingWithdrawals > 0 && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-warning/50"></div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 group-hover:text-warning transition-colors">
                            {stats.pendingWithdrawals > 0 ? "Withdrawal requests pending review" : "No pending items"}
                        </p>
                    </Link>
                </div>

                {/* Technical Panels */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1 border-l-4 border-primary">
                            System Modules
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Performance Module (NEW) */}
                        <Link href="/admin/performance" className="group p-6 bg-card border border-primary/20 dark:border-primary/30 rounded-md hover:border-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all flex flex-col justify-between h-[160px] relative overflow-hidden">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-2 bg-primary/10 rounded text-primary border border-primary/30">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-base font-bold text-foreground">Performance Engine</h3>
                                <p className="text-xs text-muted-foreground mt-1">Declare & Lock Results</p>
                            </div>
                        </Link>

                        <Link href="/admin/investments" className="group p-6 bg-secondary border border-border rounded-md hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded text-primary group-hover:text-primary/80 border border-border group-hover:border-primary/30 transition-colors">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground group-hover:text-foreground">Strategy Manager</h3>
                                <p className="text-xs text-muted-foreground mt-1">Configure ROI & Plans</p>
                            </div>
                        </Link>

                        <Link href="/admin/operations" className="group p-6 bg-secondary border border-border rounded-md hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded text-primary group-hover:text-primary/80 border border-border group-hover:border-primary/30 transition-colors">
                                    <Database className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground group-hover:text-foreground">Operations Ledger</h3>
                                <p className="text-xs text-muted-foreground mt-1">Process Payouts</p>
                            </div>
                        </Link>

                        <Link href="/admin/content" className="group p-6 bg-secondary border border-border rounded-md hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded text-primary group-hover:text-primary/80 border border-border group-hover:border-primary/30 transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground group-hover:text-foreground">Content Studio</h3>
                                <p className="text-xs text-muted-foreground mt-1">Publish Signals</p>
                            </div>
                        </Link>

                        <Link href="/admin/reports" className="group p-6 bg-secondary border border-border rounded-md hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded text-primary group-hover:text-primary/80 border border-border group-hover:border-primary/30 transition-colors">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground group-hover:text-foreground">Financial Reports</h3>
                                <p className="text-xs text-muted-foreground mt-1">Full Transaction Ledger</p>
                            </div>
                        </Link>

                        <Link href="/admin/history" className="group p-6 bg-secondary border border-border rounded-md hover:border-primary hover:shadow-lg transition-all flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-muted rounded text-primary group-hover:text-primary/80 border border-border group-hover:border-primary/30 transition-colors">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground group-hover:text-foreground">Track Record</h3>
                                <p className="text-xs text-muted-foreground mt-1">Manage Past Performance</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Content Monitoring */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                            <Rss className="w-4 h-4 text-primary" />
                            Live Content Feed
                        </h2>
                        <Link href="/admin/content" className="text-xs font-mono text-primary hover:text-primary/80 hover:underline">
                            MANAGE FEED
                        </Link>
                    </div>
                    <div className="opacity-90">
                        <ContentFeed />
                    </div>
                </div>
            </main>

            <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
        </div>
    );
}

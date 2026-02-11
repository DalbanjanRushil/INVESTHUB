"use client";

import { useState } from "react";
import { Download, Filter, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TransactionControls() {
    const [isExporting, setIsExporting] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleExport = async (duration: string) => {
        setIsExporting(true);
        setShowDropdown(false);
        const toastId = toast.loading("Preparing your transaction report...");

        try {
            const response = await fetch(`/api/user/transactions/export?duration=${duration}`, {
                method: "GET",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to export transactions");
            }

            const data = await response.json();
            toast.success(data.message || "Export successful! Check your email.", {
                id: toastId,
            });
        } catch (error: any) {
            toast.error(error.message || "Something went wrong", {
                id: toastId,
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex gap-3 relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 hover:text-foreground transition-all cursor-pointer">
                <Filter className="w-4 h-4" /> Filter
            </button>
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    Export CSV
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showDropdown && "rotate-180")} />
                </button>

                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-secondary/30 border-b border-border">
                                Select Duration
                            </div>
                            <button
                                onClick={() => handleExport("all")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 text-foreground transition-colors flex items-center gap-2"
                            >
                                All Time
                            </button>
                            <button
                                onClick={() => handleExport("1m")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 text-foreground transition-colors flex items-center gap-2"
                            >
                                Last 1 Month
                            </button>
                            <button
                                onClick={() => handleExport("3m")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 text-foreground transition-colors flex items-center gap-2"
                            >
                                Last 3 Months
                            </button>
                            <button
                                onClick={() => handleExport("6m")}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/50 text-foreground transition-colors flex items-center gap-2"
                            >
                                Last 6 Months
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

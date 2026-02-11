"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Search, Filter } from "lucide-react";

interface Transaction {
    _id: string;
    userId: {
        name: string;
        email: string;
    } | null;
    type: string;
    status: string;
    amount: number;
    netAmount: number;
    currency: string;
    description?: string;
    createdAt: string;
    referenceId?: string;
    gatewayOrderId?: string;
    utrNumber?: string;
}

export default function ReportsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 10;

    useEffect(() => {
        fetchTransactions(currentPage);
    }, [currentPage]);

    const fetchTransactions = async (page: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/transactions?page=${page}&limit=${LIMIT}`);
            const data = await res.json();
            if (data.success) {
                setTransactions(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch =
            (t.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.userId?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t._id.includes(searchTerm) ||
                (t.gatewayOrderId && t.gatewayOrderId.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesType = typeFilter === "ALL" || t.type === typeFilter;

        return matchesSearch && matchesType;
    });

    // Calculate totals for filtering summary (Note: only for current page now, or we'd need a separate stats API)
    const totalVolume = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="h-[calc(100vh-80px)] bg-background text-foreground p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Financial Reports</h1>
                    <p className="text-muted-foreground mt-1">Comprehensive ledger of all system transactions.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-card border border-border px-4 py-2 rounded-md shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Page Volume</p>
                        <p className="text-lg font-mono font-bold text-foreground">{formatCurrency(totalVolume)}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border shadow-sm shrink-0">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search user, email, tx ID, order ID..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    {["ALL", "DEPOSIT", "WITHDRAWAL", "PROFIT", "REFERRAL_BONUS"].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${typeFilter === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-transparent hover:border-border"
                                }`}
                        >
                            {type.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container - Fixed Height & Scrollable */}
            <div className="border border-border rounded-lg bg-card shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 w-full">
                    <table className="w-full text-sm text-left relative">
                        <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border sticky top-0 backdrop-blur-md z-10 whitespace-nowrap">
                            <tr>
                                <th className="px-3 py-3 w-[150px]">Date & Time</th>
                                <th className="px-3 py-3 max-w-[180px]">User Details</th>
                                <th className="px-3 py-3">Type</th>
                                <th className="px-3 py-3 text-right">Amount</th>
                                <th className="px-3 py-3 text-right">Net Amount</th>
                                <th className="px-3 py-3 text-center">Status</th>
                                <th className="px-3 py-3 text-center">UTR No.</th>
                                <th className="px-3 py-3 max-w-[160px]">Ref / Order ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            <p>Loading ledger entries...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                                        <p>No transactions found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx._id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-3 whitespace-nowrap text-muted-foreground font-mono text-xs">
                                            {format(new Date(tx.createdAt), "MMM d, yyyy")}<br />
                                            {format(new Date(tx.createdAt), "HH:mm:ss")}
                                        </td>
                                        <td className="px-3 py-3 max-w-[180px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase shrink-0">
                                                    {tx.userId?.name?.substring(0, 2) || "??"}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="font-medium text-foreground truncate text-xs" title={tx.userId?.name}>{tx.userId?.name || "Unknown"}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono truncate" title={tx.userId?.email}>{tx.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${getTypeStyles(tx.type)} shadow-sm`}>
                                                {tx.type.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-medium text-muted-foreground text-xs whitespace-nowrap">
                                            {formatCurrency(tx.amount, tx.currency)}
                                        </td>
                                        <td className={`px-3 py-3 text-right font-mono font-bold text-xs whitespace-nowrap ${["DEPOSIT", "PROFIT", "REFERRAL_BONUS"].includes(tx.type) ? "text-emerald-500" : "text-foreground"
                                            }`}>
                                            {["WITHDRAWAL", "DEBIT"].includes(tx.type) ? "-" : "+"}
                                            {formatCurrency(tx.netAmount, tx.currency)}
                                        </td>
                                        <td className="px-3 py-3 flex justify-center whitespace-nowrap">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono text-xs text-muted-foreground break-all max-w-[100px]">
                                            {tx.utrNumber || "-"}
                                        </td>
                                        <td className="px-3 py-3 max-w-[160px]">
                                            <div className="text-[10px] font-mono text-muted-foreground break-all leading-tight">
                                                <span className="opacity-50 select-none">ID:</span> {tx._id.slice(-8).toUpperCase()}
                                            </div>
                                            {tx.gatewayOrderId && (
                                                <div className="text-[10px] font-mono text-accent-foreground/70 mt-0.5 break-all leading-tight">
                                                    <span className="opacity-50 select-none">GW:</span> {tx.gatewayOrderId}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="px-5 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground flex justify-between items-center shrink-0">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTypeStyles(type: string) {
    switch (type) {
        case "DEPOSIT": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "WITHDRAWAL": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        case "PROFIT": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case "REFERRAL_BONUS": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        default: return "bg-secondary text-muted-foreground border-border";
    }
}

function StatusBadge({ status }: { status: string }) {
    let colorClass = "bg-secondary text-muted-foreground border-border";
    let dotClass = "bg-muted-foreground";

    if (status === "SUCCESS") {
        colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        dotClass = "bg-emerald-500";
    }
    if (status === "PENDING" || status === "INITIATED") {
        colorClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
        dotClass = "bg-amber-500";
    }
    if (status === "FAILED" || status === "REJECTED" || status === "REVERSED") {
        colorClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
        dotClass = "bg-rose-500";
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
            {status}
        </span>
    );
}

function formatCurrency(amount: number, currency: string = "INR") {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount);
}

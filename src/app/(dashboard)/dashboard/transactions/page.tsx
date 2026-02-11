import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertCircle, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import mongoose from "mongoose";
import TransactionControls from "@/components/dashboard/TransactionControls";

export const dynamic = "force-dynamic";

async function getTransactions(userId: string, page: number = 1, limit: number = 10) {
    await connectToDatabase();
    const skip = (page - 1) * limit;

    const totalDocs = await Transaction.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: JSON.parse(JSON.stringify(transactions)),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalDocs / limit),
            totalDocs
        }
    };
}

export default async function TransactionsPage({ searchParams }: { searchParams: { page?: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const page = parseInt(searchParams.page || "1");
    const { data: transactions, pagination } = await getTransactions(session.user.id, page);

    return (
        <div className="h-[calc(100vh-80px)] bg-background text-foreground p-6 lg:p-8 font-sans flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Transaction History</h1>
                    <p className="text-muted-foreground">View and export your complete financial ledger.</p>
                </div>
                <TransactionControls />
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg flex-1 flex flex-col">
                <div className="overflow-auto flex-1 w-full relative">
                    {transactions && transactions.length > 0 ? (
                        <table className="w-full text-left text-sm text-muted-foreground">
                            <thead className="bg-secondary/40 text-foreground uppercase tracking-wider text-xs font-semibold border-b border-border sticky top-0 backdrop-blur-md z-10 whitespace-nowrap">
                                <tr>
                                    <th className="px-3 py-3 w-[150px]">Date & Time</th>
                                    <th className="px-3 py-3">Type</th>
                                    <th className="px-3 py-3 max-w-[200px]">Description</th>
                                    <th className="px-3 py-3 text-right">Amount</th>
                                    <th className="px-3 py-3 text-right">Status</th>
                                    <th className="px-3 py-3 text-center">Ref ID</th>
                                    <th className="px-3 py-3 text-right">UTR No.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions.map((t: any) => (
                                    <tr key={t._id} className="group hover:bg-secondary/20 transition-colors duration-200">
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="font-medium text-foreground text-xs">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(t.createdAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md whitespace-nowrap",
                                                t.type === "DEPOSIT" && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
                                                t.type === "WITHDRAWAL" && "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
                                                t.type === "PROFIT" && "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
                                                t.type === "REFERRAL_BONUS" && "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20"
                                            )}>
                                                {t.type === "DEPOSIT" ? <ArrowDownRight className="w-3 h-3" /> :
                                                    t.type === "WITHDRAWAL" ? <ArrowUpRight className="w-3 h-3" /> :
                                                        t.type === "PROFIT" ? <Clock className="w-3 h-3" /> : null}
                                                {t.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-muted-foreground max-w-[200px] truncate font-mono text-xs" title={t.description}>
                                            {t.description || "System Transaction"}
                                        </td>
                                        <td className={cn(
                                            "px-3 py-3 text-right font-bold font-mono tracking-tight text-xs whitespace-nowrap",
                                            (t.type === "DEPOSIT" || t.type === "PROFIT" || t.type === "REFERRAL_BONUS") ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"
                                        )}>
                                            {(t.type === "DEPOSIT" || t.type === "PROFIT" || t.type === "REFERRAL_BONUS") ? "+" : "-"}
                                            ₹{t.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                                                t.status === 'SUCCESS' ? 'text-emerald-500 dark:text-emerald-400' :
                                                    t.status === 'PENDING' ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500'
                                            )}>
                                                {t.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}{t.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center text-[10px] font-mono text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                                            {t._id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-3 py-3 text-right text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors break-all max-w-[100px]">
                                            {t.utrNumber || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center h-full">
                            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                                <Clock className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium text-foreground mb-2">No transactions recorded</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Your ledger is currently empty. Start by making a deposit or waiting for investment returns.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border bg-secondary/10 flex items-center justify-between shrink-0">
                    <p className="text-xs text-muted-foreground">
                        Page <span className="font-bold text-foreground">{pagination.currentPage}</span> of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Link
                            href={pagination.currentPage > 1 ? `?page=${pagination.currentPage - 1}` : "#"}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors",
                                pagination.currentPage > 1
                                    ? "bg-card hover:bg-muted text-foreground"
                                    : "bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed pointer-events-none"
                            )}
                        >
                            <ChevronLeft className="w-3 h-3" /> Previous
                        </Link>
                        <Link
                            href={pagination.currentPage < pagination.totalPages ? `?page=${pagination.currentPage + 1}` : "#"}
                            className={cn(
                                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border transition-colors",
                                pagination.currentPage < pagination.totalPages
                                    ? "bg-card hover:bg-muted text-foreground"
                                    : "bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed pointer-events-none"
                            )}
                        >
                            Next <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </div >
    );
}

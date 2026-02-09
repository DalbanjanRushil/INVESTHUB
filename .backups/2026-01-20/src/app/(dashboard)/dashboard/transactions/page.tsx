import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertCircle, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

import mongoose from "mongoose";

export const dynamic = "force-dynamic";

async function getTransactions(userId: string) {
    await connectToDatabase();
    const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(transactions));
}

export default async function TransactionsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const transactions = await getTransactions(session.user.id);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 lg:p-8 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Transaction History</h1>
                    <p className="text-slate-400">View and export your complete financial ledger.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-[#2e3e56] hover:text-white transition-all">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-700/50 bg-[#0B1120] shadow-2xl">
                {transactions && transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-[#1E293B] text-slate-200 uppercase tracking-wider text-xs font-semibold border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-5">Date & Time</th>
                                    <th className="px-6 py-5">Type</th>
                                    <th className="px-6 py-5">Description</th>
                                    <th className="px-6 py-5 text-right">Amount</th>
                                    <th className="px-6 py-5 text-right">Status</th>
                                    <th className="px-6 py-5 text-center">Ref ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {transactions.map((t: any) => (
                                    <tr key={t._id} className="group hover:bg-slate-800/30 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {new Date(t.createdAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md",
                                                t.type === "DEPOSIT" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                                t.type === "WITHDRAWAL" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                                t.type === "PROFIT" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                                t.type === "REFERRAL_BONUS" && "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                            )}>
                                                {t.type === "DEPOSIT" ? <ArrowDownRight className="w-3 h-3" /> :
                                                    t.type === "WITHDRAWAL" ? <ArrowUpRight className="w-3 h-3" /> :
                                                        t.type === "PROFIT" ? <Clock className="w-3 h-3" /> : null}
                                                {t.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate font-mono text-xs" title={t.description}>
                                            {t.description || "System Transaction"}
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-right font-bold font-mono tracking-tight",
                                            (t.type === "DEPOSIT" || t.type === "PROFIT" || t.type === "REFERRAL_BONUS") ? "text-emerald-400" : "text-white"
                                        )}>
                                            {(t.type === "DEPOSIT" || t.type === "PROFIT" || t.type === "REFERRAL_BONUS") ? "+" : "-"}
                                            ₹{t.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn(
                                                "inline-flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider",
                                                t.status === 'SUCCESS' ? 'text-emerald-500' :
                                                    t.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500'
                                            )}>
                                                {t.status === 'SUCCESS' && <CheckCircle className="w-3.5 h-3.5" />}
                                                {t.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                                {t.status === 'FAILED' && <AlertCircle className="w-3.5 h-3.5" />}
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-mono text-slate-600 opacity-70 group-hover:opacity-100 transition-opacity">
                                            {t._id.substring(0, 8).toUpperCase()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <Clock className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No transactions recorded</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Your ledger is currently empty. Start by making a deposit or waiting for investment returns.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

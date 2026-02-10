import { ArrowUpRight } from "lucide-react";

export default function AttributionTable({ transactions }: { transactions: any[] }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-10 bg-secondary/50 rounded-lg">
                <p className="text-muted-foreground text-sm">No profit attributions yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/40 text-muted-foreground font-semibold border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Event</th>
                            <th className="px-6 py-4">Your Share</th>
                            <th className="px-6 py-4">Tax (TDS)</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {transactions.map((tx) => (
                            <tr key={tx._id} className="hover:bg-secondary/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 text-foreground font-medium">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">
                                    +₹{tx.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-red-500 dark:text-red-400">
                                    {tx.taxDeducted > 0 ? `-₹${tx.taxDeducted}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <ArrowUpRight className="w-3 h-3" /> Paid
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

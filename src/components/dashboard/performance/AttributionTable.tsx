import { ArrowUpRight } from "lucide-react";

export default function AttributionTable({ transactions }: { transactions: any[] }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-gray-500 text-sm">No profit attributions yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Event</th>
                            <th className="px-6 py-4">Your Share</th>
                            <th className="px-6 py-4">Tax (TDS)</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {transactions.map((tx) => (
                            <tr key={tx._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 text-gray-800 dark:text-gray-200 font-medium">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 text-emerald-600 font-bold">
                                    +₹{tx.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-red-400">
                                    {tx.taxDeducted > 0 ? `-₹${tx.taxDeducted}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
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

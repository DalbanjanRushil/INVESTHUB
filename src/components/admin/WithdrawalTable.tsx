"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WithdrawalRequest {
    _id: string;
    userId: {
        name: string;
        email: string;
    };
    amount: number;
    createdAt: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
}

interface Props {
    data: WithdrawalRequest[];
}

export default function WithdrawalTable({ data }: Props) {
    const router = useRouter();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        setProcessingId(id);

        try {
            const res = await fetch("/api/admin/withdraw/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ withdrawalId: id, action }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Action failed");
            }

            router.refresh(); // Refresh server data
        } catch (error: any) {
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700">
                No pending withdrawals found.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((req) => (
                        <tr
                            key={req._id}
                            className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                        >
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                <div>{req.userId?.name || "Unknown"}</div>
                                <div className="text-xs text-gray-500 font-normal">{req.userId?.email}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-orange-600">
                                ₹{req.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleAction(req._id, "APPROVE")}
                                        disabled={!!processingId}
                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition disabled:opacity-50"
                                        title="Approve"
                                    >
                                        {processingId === req._id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleAction(req._id, "REJECT")}
                                        disabled={!!processingId}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition disabled:opacity-50"
                                        title="Reject"
                                    >
                                        {processingId === req._id ? (
                                            <span className="sr-only">Loading</span>
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

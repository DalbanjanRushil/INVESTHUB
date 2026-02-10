"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import WithdrawalApprovalModal from "./WithdrawalApprovalModal";

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
    const [approvalId, setApprovalId] = useState<string | null>(null);

    const processWithdrawal = async (id: string, action: "APPROVE" | "REJECT", utrNumber?: string) => {
        setProcessingId(id);

        try {
            const res = await fetch("/api/admin/withdraw/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    withdrawalId: id,
                    action,
                    utrNumber
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Action failed");
            }

            toast.success(`Request ${action === "APPROVE" ? "Approved" : "Rejected"} Successfully`);
            router.refresh(); // Refresh server data
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
        if (action === "APPROVE") {
            setApprovalId(id);
            return;
        }

        if (!window.confirm(`Are you sure you want to REJECT this request?`)) return;

        await processWithdrawal(id, "REJECT");
    };

    const handleApproveConfirm = async (utrNumber: string) => {
        if (approvalId) {
            await processWithdrawal(approvalId, "APPROVE", utrNumber);
            setApprovalId(null);
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg border border-border">
                No pending withdrawals found.
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary border-b border-border">
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
                                className="bg-card border-b border-border hover:bg-muted/50 transition"
                            >
                                <td className="px-6 py-4 font-medium text-foreground">
                                    <div>{req.userId?.name || "Unknown"}</div>
                                    <div className="text-xs text-muted-foreground font-normal">{req.userId?.email}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-accent-primary">
                                    ₹{req.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleAction(req._id, "APPROVE")}
                                            disabled={!!processingId}
                                            className="p-2 text-accent-primary hover:bg-accent-primary/10 rounded-full transition disabled:opacity-50"
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
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition disabled:opacity-50"
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

            <WithdrawalApprovalModal
                isOpen={!!approvalId}
                onClose={() => setApprovalId(null)}
                onConfirm={handleApproveConfirm}
                isProcessing={!!processingId && processingId === approvalId}
            />
        </div>
    );
}

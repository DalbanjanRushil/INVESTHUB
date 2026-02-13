"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface AccountClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountClosureModal({ isOpen, onClose }: AccountClosureModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleClosure = async () => {
        if (!confirmed) return;
        setLoading(true);

        try {
            const res = await fetch("/api/user/close-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Closure request submitted.");
                onClose();
                // Optional: Force logout or redirect
                // signOut({ callbackUrl: "/" }); 
                // Actually, let's just close modal. User status is updated, but they can still begin session until next refresh or admin action?
                // Plan said "Closure Requested" status. User can still login probably until Admin approves.
                window.location.reload(); // To reflect status change if we show it
            } else {
                toast.error(data.error || "Failed to submit request.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
            <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Close Account?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        This action allows you to request permanent account closure. Your portfolio and data will be removed after admin approval.
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason (Optional)</label>
                        <textarea
                            className="w-full bg-secondary/30 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none h-28"
                            placeholder="Let us know why you're leaving..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-400 text-destructive focus:ring-destructive accent-destructive cursor-pointer"
                            id="confirm-close"
                        />
                        <label htmlFor="confirm-close" className="text-sm text-foreground/80 leading-snug cursor-pointer select-none">
                            I understand that this action is <span className="font-bold text-destructive">irreversible</span> and subject to verification.
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl border border-border font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleClosure}
                            disabled={!confirmed || loading}
                            className="px-4 py-3 rounded-xl bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90 transition-all duration-200 shadow-lg shadow-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

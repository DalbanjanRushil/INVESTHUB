"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WithdrawalApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (utrNumber: string) => Promise<void>;
    isProcessing: boolean;
}

export default function WithdrawalApprovalModal({ isOpen, onClose, onConfirm, isProcessing }: WithdrawalApprovalModalProps) {
    const [utrNumber, setUtrNumber] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanUtr = utrNumber.trim();

        if (cleanUtr.length !== 16) {
            setError("UTR Number must be exactly 16 digits.");
            return;
        }

        setError(null);
        await onConfirm(cleanUtr);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" /> Approve Withdrawal
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 hover:bg-muted rounded-full transition text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="utr" className="text-sm font-medium text-foreground">
                            Transaction UTR Number
                        </label>
                        <div className="relative">
                            <input
                                id="utr"
                                type="text"
                                value={utrNumber}
                                onChange={(e) => {
                                    setUtrNumber(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="Enter 16-digit UTR"
                                className={`w-full bg-muted border ${error ? "border-destructive focus:ring-destructive" : "border-input focus:ring-primary"} rounded-xl px-4 py-3 text-foreground focus:ring-2 outline-none transition-all`}
                                maxLength={16}
                                disabled={isProcessing}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {utrNumber.length}/16
                            </div>
                        </div>
                        {error && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {error}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Please provide the unique 16-digit Unique Transaction Reference (UTR) number for the bank transfer.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing || utrNumber.length !== 16}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Approving...
                                </>
                            ) : (
                                "Confirm Approval"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

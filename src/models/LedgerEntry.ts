import mongoose, { Schema, Document, Model } from "mongoose";

export enum LedgerAccountType {
    PRINCIPAL = "PRINCIPAL",
    PROFIT = "PROFIT",
    REFERRAL = "REFERRAL",
    LOCKED = "LOCKED",
    SYSTEM_POOL = "SYSTEM_POOL",
    GATEWAY = "GATEWAY", // External Payment Gateway (Razorpay)
    ADMIN_BANK = "ADMIN_BANK", // Where money actually lives
    REFERRAL_POOL = "REFERRAL_POOL",
    PROFIT_POOL = "PROFIT_POOL" // Pool for distributing profits
}

export enum LedgerDirection {
    DEBIT = "DEBIT",   // Money leaving this account
    CREDIT = "CREDIT", // Money entering this account
}

export enum LedgerReferenceType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    PROFIT_DISTRIBUTION = "PROFIT_DISTRIBUTION",
    REFERRAL_BONUS = "REFERRAL_BONUS",
    ADJUSTMENT = "ADJUSTMENT",
    INVESTMENT_LOCK = "INVESTMENT_LOCK", // Moving from Principal to Locked (if valid)
    WITHDRAWAL_LOCK = "WITHDRAWAL_LOCK", // Moving from Balance to Locked for withdrawal
}

export interface ILedgerEntry extends Document {
    userId?: mongoose.Types.ObjectId; // Nullable for system accounts
    accountType: LedgerAccountType;
    direction: LedgerDirection;
    amount: number;
    currency: string;
    transactionId: mongoose.Types.ObjectId;
    referenceType: LedgerReferenceType;
    referenceId?: mongoose.Types.ObjectId; // Link to specific Deposit/Withdrawal/etc.
    balanceAfter?: number; // Snapshot of balance after this entry (for auditing)
    description?: string;
    createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true, // Important for lookups
        },
        accountType: {
            type: String,
            enum: Object.values(LedgerAccountType),
            required: true,
        },
        direction: {
            type: String,
            enum: Object.values(LedgerDirection),
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
            required: true,
            index: true,
        },
        referenceType: {
            type: String,
            enum: Object.values(LedgerReferenceType),
            required: true,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            index: true,
        },
        balanceAfter: {
            type: Number, // Optional, for easier auditing
        },
        description: String,
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Ledger is immutable
    }
);

// Indexes for common queries
// 1. Get user balance for specific account type
LedgerEntrySchema.index({ userId: 1, accountType: 1, createdAt: -1 });

const LedgerEntry: Model<ILedgerEntry> =
    mongoose.models.LedgerEntry || mongoose.model<ILedgerEntry>("LedgerEntry", LedgerEntrySchema);

export default LedgerEntry;

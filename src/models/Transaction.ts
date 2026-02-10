import mongoose, { Schema, Document, Model } from "mongoose";

export enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    PROFIT = "PROFIT",
    REFERRAL_BONUS = "REFERRAL_BONUS",
    ADJUSTMENT = "ADJUSTMENT", // Admin manual correction
    ADMIN_FEE = "ADMIN_FEE", // Revenue collected by System/Admin
}

export enum TransactionStatus {
    INITIATED = "INITIATED",
    PENDING = "PENDING",    // Awaiting approval or async process
    SUCCESS = "SUCCESS",    // Completed
    FAILED = "FAILED",
    REVERSED = "REVERSED",  // Admin reversed
}

export enum RiskFlag {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: TransactionType;
    status: TransactionStatus;

    // Amounts
    amount: number;       // Gross Amount
    fee: number;          // Processing fee / Tax
    netAmount: number;    // Amount actually credited/debited
    currency: string;

    // External References
    gatewayOrderId?: string;
    idempotencyKey?: string;

    // Internal References
    referenceId?: mongoose.Types.ObjectId; // ID of Deposit, Withdrawal, etc.
    description?: string;
    utrNumber?: string;

    // Audit & Meta
    riskFlag: RiskFlag;
    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(TransactionType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(TransactionStatus),
            default: TransactionStatus.INITIATED,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        fee: {
            type: Number,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        gatewayOrderId: {
            type: String, // e.g. Razorpay Order ID
            index: true,
            sparse: true,
        },
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true, // Only some transactions need this
        },
        referenceId: {
            type: Schema.Types.ObjectId, // Generic internal ref
        },
        description: {
            type: String,
        },
        utrNumber: {
            type: String,
            index: true,
        },
        riskFlag: {
            type: String,
            enum: Object.values(RiskFlag),
            default: RiskFlag.LOW,
        },
        metadata: {
            type: Map,
            of: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema, "transactions");

export default Transaction;

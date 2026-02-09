import mongoose, { Schema, Document, Model } from "mongoose";

export enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    PROFIT = "PROFIT",
    REFERRAL_BONUS = "REFERRAL_BONUS",
}

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    type: TransactionType;
    amount: number;
    taxDeducted?: number;
    referenceId?: mongoose.Types.ObjectId; // ID of Deposit, Withdrawal, or ProfitDistribution
    status: "SUCCESS" | "PENDING" | "FAILED"; // Mostly SUCCESS for ledger
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(TransactionType),
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        taxDeducted: {
            type: Number,
            default: 0,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            // Dynamic ref not easy in Mongoose strict mode without discriminators, keeping generic
        },
        status: {
            type: String,
            enum: ["SUCCESS", "PENDING", "FAILED"],
            default: "SUCCESS",
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster lookup by user
TransactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema, "transactions");

export default Transaction;

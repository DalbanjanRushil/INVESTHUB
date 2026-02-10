import mongoose, { Schema, Document, Model } from "mongoose";

export enum WithdrawalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export interface IWithdrawal extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    status: WithdrawalStatus;
    adminRemark?: string;
    utrNumber?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [1, "Minimum withdrawal amount is 1"],
        },
        status: {
            type: String,
            enum: Object.values(WithdrawalStatus),
            default: WithdrawalStatus.PENDING,
        },
        adminRemark: {
            type: String,
            trim: true,
        },
        utrNumber: {
            type: String,
            trim: true,
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Withdrawal: Model<IWithdrawal> =
    mongoose.models.Withdrawal ||
    mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema, "withdrawals");

export default Withdrawal;

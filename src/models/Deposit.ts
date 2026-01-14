import mongoose, { Schema, Document, Model } from "mongoose";

export enum DepositStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
}

export interface IDeposit extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    plan: 'FLEXI' | 'FIXED_3M' | 'FIXED_6M' | 'FIXED_1Y';
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status: DepositStatus;
    createdAt: Date;
    updatedAt: Date;
}

const DepositSchema = new Schema<IDeposit>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [1, "Minimum deposit amount is 1"],
        },
        plan: {
            type: String,
            enum: ['FLEXI', 'FIXED_3M', 'FIXED_6M', 'FIXED_1Y'],
            default: 'FLEXI',
        },
        razorpayOrderId: {
            type: String,
            required: true,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(DepositStatus),
            default: DepositStatus.PENDING,
        },
    },
    {
        timestamps: true,
    }
);

const Deposit: Model<IDeposit> =
    mongoose.models.Deposit || mongoose.model<IDeposit>("Deposit", DepositSchema);

export default Deposit;

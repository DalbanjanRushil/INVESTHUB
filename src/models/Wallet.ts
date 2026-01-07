import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number; // Principal (Compounded)
    payoutWalletBalance: number; // Withdrawable Profits
    totalDeposited: number;
    totalWithdrawn: number;
    totalProfit: number;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // 1:1 relationship
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        payoutWalletBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalDeposited: {
            type: Number,
            default: 0,
        },
        totalWithdrawn: {
            type: Number,
            default: 0,
        },
        totalProfit: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Wallet: Model<IWallet> =
    mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

export default Wallet;

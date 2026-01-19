import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;

    // Multi-Wallet Separation
    principal: number;   // Deposited Capital
    profit: number;      // ROI Earnings (can be withdrawn or compounded)
    referral: number;    // Commissions
    locked: number;      // Pending Withdrawals/Investments

    // Legacy/Virtual
    balance?: number;    // DEPRECATED: Virtual helper for Total Equity

    // Stats
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
            unique: true,
        },
        principal: { type: Number, default: 0, min: 0 },
        profit: { type: Number, default: 0, min: 0 },
        referral: { type: Number, default: 0, min: 0 },
        locked: { type: Number, default: 0, min: 0 },

        totalDeposited: { type: Number, default: 0 },
        totalWithdrawn: { type: Number, default: 0 },
        totalProfit: { type: Number, default: 0 },

        // Legacy Field (Restored for migration)
        balance: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

const Wallet: Model<IWallet> =
    mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema, "wallets");

export default Wallet;

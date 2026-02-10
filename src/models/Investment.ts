import mongoose, { Schema, Document, Model } from "mongoose";

export enum LockPlan {
    FLEXI = "FLEXI", // No lock, standard return
    FIXED_3M = "FIXED_3M", // 3 Months (Quarterly)
    FIXED_6M = "FIXED_6M", // 6 Months
    FIXED_1Y = "FIXED_1Y", // 1 Year
}

// Renaming the "Active Investment" tracker to Investment to avoid conflict with Payment Log "Deposit"
// Actually, let's just make a new model "Investment" for the active holding. 
// Old "Deposit" is just a payment log.

export interface IInvestment extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    plan: LockPlan;
    startDate: Date;
    maturityDate?: Date; // Null for FLEXI
    isActive: boolean;

    // For tracking source payment?
    sourceDepositId?: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0, // Allow 0 for liquidated investments
        },
        plan: {
            type: String,
            enum: Object.values(LockPlan),
            default: LockPlan.FLEXI,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        maturityDate: Date,
        isActive: {
            type: Boolean,
            default: true, // Becomes false on Withdrawal/Liquidation
        },
        sourceDepositId: { type: Schema.Types.ObjectId, ref: "Deposit" },
    },
    {
        timestamps: true,
    }
);

const Investment: Model<IInvestment> = mongoose.models.Investment || mongoose.model<IInvestment>("Investment", InvestmentSchema, "investments");

export default Investment;

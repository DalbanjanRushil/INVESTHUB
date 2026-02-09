import mongoose, { Schema, Document, Model } from "mongoose";

export enum InvestmentAction {
    CREATION = "CREATION", // Initial Investment
    ACCRUAL = "ACCRUAL",   // Interest added (if applicable)
    REDEMPTION = "REDEMPTION", // Withdrawal / Liquidation
    MATURITY = "MATURITY", // Full maturity unlock
}

export interface IInvestmentLedger extends Document {
    investmentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: InvestmentAction;
    amountChange: number; // + for Creation, - for Redemption
    balanceAfter: number; // Remaining active amount in this investment
    description?: string;
    transactionId?: mongoose.Types.ObjectId; // Link to the financial transaction
    createdAt: Date;
}

const InvestmentLedgerSchema = new Schema<IInvestmentLedger>(
    {
        investmentId: {
            type: Schema.Types.ObjectId,
            ref: "Investment",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: Object.values(InvestmentAction),
            required: true,
        },
        amountChange: {
            type: Number,
            required: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        description: String,
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction", // The main financial transaction triggering this
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes
InvestmentLedgerSchema.index({ investmentId: 1, createdAt: -1 });

const InvestmentLedger: Model<IInvestmentLedger> =
    mongoose.models.InvestmentLedger ||
    mongoose.model<IInvestmentLedger>("InvestmentLedger", InvestmentLedgerSchema, "investment_ledger");

export default InvestmentLedger;

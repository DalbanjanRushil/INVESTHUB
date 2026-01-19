import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStrategyAllocation {
    asset: string;
    percentage: number; // 0-100
    color: string; // Hex code
}

export interface IStrategyHistory {
    date: string; // ISO Date or "Jan 2024"
    roi: number; // Percentage
}

export interface IInvestmentStrategy extends Document {
    name: string;
    description: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    minInvestment: number;
    lockInPeriod: number; // in months
    estimatedReturn: string; // e.g., "12-14%"
    allocation: IStrategyAllocation[];
    history: IStrategyHistory[];
    managerMessage?: string; // "CEO's Note"
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InvestmentStrategySchema = new Schema<IInvestmentStrategy>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM",
        },
        minInvestment: { type: Number, default: 5000 },
        lockInPeriod: { type: Number, required: true }, // months
        estimatedReturn: { type: String, required: true },
        allocation: [
            {
                asset: { type: String, required: true },
                percentage: { type: Number, required: true },
                color: { type: String, default: "#000000" },
            },
        ],
        history: [
            {
                date: { type: String, required: true },
                roi: { type: Number, required: true },
            },
        ],
        managerMessage: { type: String },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite in hot-reload
const InvestmentStrategy: Model<IInvestmentStrategy> =
    mongoose.models.InvestmentStrategy ||
    mongoose.model<IInvestmentStrategy>("InvestmentStrategy", InvestmentStrategySchema, "investment_strategies");

export default InvestmentStrategy;

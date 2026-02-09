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
    category: "COMMODITY" | "REAL_ESTATE" | "BUSINESS" | "STARTUP" | "LOCATION_BASED" | "OTHER";
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    minInvestment: number;
    lockInPeriod: number; // in months
    totalCapitalDeployed: number; // Real-world capital in this bucket
    internalROI: number; // Actual internal target ROI (e.g., 24)
    conservativeROI: number; // Displayed ROI (e.g., 12)
    disclosureFactor: number; // default 0.5
    allocation: IStrategyAllocation[];
    history: IStrategyHistory[];
    managerMessage?: string;
    status: "ACTIVE" | "CLOSED" | "EXITED";
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InvestmentStrategySchema = new Schema<IInvestmentStrategy>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["COMMODITY", "REAL_ESTATE", "BUSINESS", "STARTUP", "LOCATION_BASED", "OTHER"],
            default: "OTHER",
        },
        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM",
        },
        minInvestment: { type: Number, default: 5000 },
        lockInPeriod: { type: Number, required: true },
        totalCapitalDeployed: { type: Number, default: 0 },
        internalROI: { type: Number, required: true },
        conservativeROI: { type: Number, required: true },
        disclosureFactor: { type: Number, default: 0.5 },
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
        status: {
            type: String,
            enum: ["ACTIVE", "CLOSED", "EXITED"],
            default: "ACTIVE",
        },
        isActive: { type: Boolean, default: true },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite in hot-reload
if (mongoose.models.InvestmentStrategy) {
    delete mongoose.models.InvestmentStrategy;
}

const InvestmentStrategy: Model<IInvestmentStrategy> =
    mongoose.model<IInvestmentStrategy>("InvestmentStrategy", InvestmentStrategySchema, "investment_strategies");

export default InvestmentStrategy;

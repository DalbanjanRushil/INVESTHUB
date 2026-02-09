import mongoose, { Schema, Document, Model } from "mongoose";

export enum PerformancePeriodType {
    DAILY = "DAILY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY"
}

export interface IPerformancePeriod extends Document {
    periodType: PerformancePeriodType;
    periodLabel: string; // e.g., "Jan 2026", "Q1 2026"

    // Financials
    grossProfit: number;
    grossLoss: number; // Stored as positive number, logic handles subtraction
    netProfit: number; // Derived: Gross Profit - Gross Loss

    capitalDeployed: number;
    roiPercent: number; // Derived: (Net Profit / Capital Deployed) * 100

    // Splits
    adminShare: number; // 50% usually
    investorShare: number; // 50% usually

    // Meta
    notes?: string;
    declaredBy: mongoose.Types.ObjectId; // Admin ID
    distributionLinked: boolean; // True if a profit distribution is linked
    locked: boolean; // Immutable once true
    isHistorical: boolean; // True if this is past data (no distribution needed)
    metrics?: Map<string, any>; // Flexible field for "different fields" (e.g. WinRate, TotalTrades)

    createdAt: Date;
    updatedAt: Date;
}

const PerformancePeriodSchema = new Schema<IPerformancePeriod>(
    {
        periodType: {
            type: String,
            enum: Object.values(PerformancePeriodType),
            required: true,
        },
        periodLabel: {
            type: String,
            required: true,
            unique: true, // Example: "Jan 2026" should only exist once
        },
        grossProfit: {
            type: Number,
            required: true,
            default: 0,
        },
        grossLoss: {
            type: Number,
            required: true,
            default: 0,
        },
        netProfit: {
            type: Number,
            required: true,
            default: 0,
        },
        capitalDeployed: {
            type: Number,
            required: true,
            min: 1,
        },
        roiPercent: {
            type: Number,
            required: true,
            default: 0,
        },
        adminShare: {
            type: Number,
            required: true,
            default: 0,
        },
        investorShare: {
            type: Number,
            required: true,
            default: 0,
        },
        notes: {
            type: String,
            default: "",
        },
        declaredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        distributionLinked: {
            type: Boolean,
            default: false,
        },
        locked: {
            type: Boolean,
            default: false,
        },
        isHistorical: {
            type: Boolean,
            default: false,
        },
        metrics: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

// Calculations handled in API Controller to avoid middleware conflicts

// Force recompilation to remove stale hooks in Dev mode
if (mongoose.models.PerformancePeriod) {
    delete mongoose.models.PerformancePeriod;
}

const PerformancePeriod: Model<IPerformancePeriod> =
    mongoose.model<IPerformancePeriod>(
        "PerformancePeriod",
        PerformancePeriodSchema,
        "performance_periods"
    );

// Force Recompile
export default PerformancePeriod;

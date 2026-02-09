import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfitDistribution extends Document {
    performancePeriodId?: mongoose.Types.ObjectId; // Optional for legacy records, required for new ones
    totalProfit: number;
    adminShare: number;
    userShare: number;
    distributedToUserCount: number;
    distributionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProfitDistributionSchema = new Schema<IProfitDistribution>(
    {
        performancePeriodId: {
            type: Schema.Types.ObjectId,
            ref: "PerformancePeriod",
            required: false, // For migration safety, but logic will enforce it
        },
        totalProfit: {
            type: Number,
            required: true,
        },
        adminShare: {
            type: Number,
            required: true,
        },
        userShare: {
            type: Number,
            required: true,
        },
        distributedToUserCount: {
            type: Number,
            required: true,
            default: 0,
        },
        distributionDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const ProfitDistribution: Model<IProfitDistribution> =
    mongoose.models.ProfitDistribution ||
    mongoose.model<IProfitDistribution>(
        "ProfitDistribution",
        ProfitDistributionSchema,
        "profit_distributions"
    );

export default ProfitDistribution;

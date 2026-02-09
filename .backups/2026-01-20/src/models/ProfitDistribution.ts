import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfitDistribution extends Document {
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

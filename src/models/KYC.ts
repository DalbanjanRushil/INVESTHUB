import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKYC extends Document {
    userId: mongoose.Types.ObjectId;
    panNumber: string;
    aadhaarNumber: string; // Last 4 digits or hashed in real prod

    bankDetails: {
        accountNumber: string;
        ifsc: string;
        bankName: string;
    };

    documents: {
        panImage: string;
        aadhaarFront: string;
        aadhaarBack: string;
        selfie: string;
    };

    status: "PENDING" | "VERIFIED" | "REJECTED";
    rejectionReason?: string;

    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const KYCSchema = new Schema<IKYC>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One KYC per user
        },
        panNumber: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        aadhaarNumber: {
            type: String,
            required: true,
            trim: true,
        },
        bankDetails: {
            accountNumber: { type: String, required: true },
            ifsc: { type: String, required: true, uppercase: true },
            bankName: { type: String, required: true },
        },
        documents: {
            panImage: { type: String, required: true },
            aadhaarFront: { type: String, required: true },
            aadhaarBack: { type: String, required: true },
            selfie: { type: String, required: true }, // URL to stored image
        },
        status: {
            type: String,
            enum: ["PENDING", "VERIFIED", "REJECTED"],
            default: "PENDING",
        },
        rejectionReason: String,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        verifiedAt: Date,
    },
    {
        timestamps: true,
    }
);

const KYC: Model<IKYC> = mongoose.models.KYC || mongoose.model<IKYC>("KYC", KYCSchema, "kyc_requests");

export default KYC;

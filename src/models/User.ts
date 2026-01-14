import mongoose, { Schema, Document, Model } from "mongoose";

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    BLOCKED = "BLOCKED",
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string; // Optional because we might use OAuth later, though mostly password-based here
    role: UserRole;
    status: UserStatus;
    referredBy?: mongoose.Types.ObjectId; // Code or UserID
    referralCode?: string; // e.g. "RUSHIL123"
    payoutPreference: "COMPOUND" | "PAYOUT";
    resetToken?: string;
    resetTokenExpiry?: Date;
    kycStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"], // STRICT: We need passwords for this simulation
            select: false, // Do not return password by default
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
        },
        referredBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        payoutPreference: {
            type: String,
            enum: ["COMPOUND", "PAYOUT"],
            default: "COMPOUND",
        },
        resetToken: {
            type: String,
            select: false, // Security: don't expose token
        },
        kycStatus: {
            type: String,
            enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"],
            default: "NOT_SUBMITTED",
        },
        resetTokenExpiry: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite in hot-reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

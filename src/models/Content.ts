import mongoose, { Schema, Document, Model } from "mongoose";

export enum ContentType {
    VIDEO = "VIDEO",
    CHART = "CHART",
    POST = "POST",
}

export interface IContent extends Document {
    type: ContentType;
    title: string;
    description?: string;
    url: string; // URL to image or video
    uploadedBy: mongoose.Types.ObjectId; // Admin ID
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
    {
        type: {
            type: String,
            enum: Object.values(ContentType),
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        url: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Content: Model<IContent> =
    mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);

export default Content;

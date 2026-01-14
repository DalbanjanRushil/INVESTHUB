import mongoose, { Schema, Document, Model } from "mongoose";

export enum ContentType {
    VIDEO = "VIDEO",
    CHART = "CHART",
    POST = "POST",
}

export interface IComment {
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

export interface IContent extends Document {
    type: ContentType;
    title: string;
    description?: string;
    url: string; // URL to image or video
    uploadedBy: mongoose.Types.ObjectId; // Admin ID
    isPublic: boolean;
    likes: mongoose.Types.ObjectId[]; // Array of User IDs who liked
    comments: IComment[];
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false }); // sub-documents don't strictly need _id but useful for deleting. keeping simple.

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
            required: true, // For posts, this might be optional or a placeholder image? strict for now.
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
        likes: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        comments: [CommentSchema]
    },
    {
        timestamps: true,
    }
);

const Content: Model<IContent> =
    mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);

export default Content;

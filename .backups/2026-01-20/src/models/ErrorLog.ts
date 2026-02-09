
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IErrorLog extends Document {
    path: string;
    error: string;
    stack?: string;
    createdAt: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>(
    {
        path: { type: String, required: true },
        error: { type: String, required: true },
        stack: { type: String },
    },
    { timestamps: true }
);

const ErrorLog: Model<IErrorLog> = mongoose.models.ErrorLog || mongoose.model<IErrorLog>("ErrorLog", ErrorLogSchema, "error_logs");

export default ErrorLog;

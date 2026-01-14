import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import KYC from "@/models/KYC";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { panNumber, aadhaarNumber, bankDetails, documents } = body;

        // Basic Validation
        if (!panNumber || !aadhaarNumber || !bankDetails || !documents) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        // Check if already exists
        const existing = await KYC.findOne({ userId: session.user.id });
        if (existing && existing.status === "VERIFIED") {
            return NextResponse.json({ error: "KYC already verified" }, { status: 400 });
        }

        // If rejected, we allow update. If pending, we allow update (correction).

        // Create or Update
        const kycData = {
            userId: session.user.id,
            panNumber,
            aadhaarNumber,
            bankDetails,
            documents,
            status: "PENDING",
            rejectionReason: "" // Clear any previous rejection
        };

        if (existing) {
            await KYC.findByIdAndUpdate(existing._id, kycData);
        } else {
            await KYC.create(kycData);
        }

        // Update User Status
        await User.findByIdAndUpdate(session.user.id, { kycStatus: "PENDING" });

        return NextResponse.json({ message: "KYC Submitted successfully" });

    } catch (error) {
        console.error("KYC Submit Error:", error);
        return NextResponse.json({ error: "Failed to submit KYC" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectToDatabase();
        const kyc = await KYC.findOne({ userId: session.user.id });

        return NextResponse.json(kyc || { status: "NOT_SUBMITTED" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch KYC" }, { status: 500 });
    }
}

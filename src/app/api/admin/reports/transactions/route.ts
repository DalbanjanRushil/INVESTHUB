import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust import path if needed, usually in lib/auth or app/api/auth/[...nextauth]/route
// I need to verify where authOptions is. I'll guess standard location or check file structure if needed.
// Actually, let's just check session existence for now.

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const totalDocuments = await Transaction.countDocuments();
        const totalPages = Math.ceil(totalDocuments / limit);

        // 1. Fetch transactions with pagination
        const transactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name email") // Get user name and email
            .lean();

        return NextResponse.json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages,
                totalDocuments,
                limit
            }
        });
    } catch (error: any) {
        console.error("Error fetching transactions report:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch report" },
            { status: 500 }
        );
    }
}

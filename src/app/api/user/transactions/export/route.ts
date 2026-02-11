import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Transaction, { ITransaction } from "@/models/Transaction";
import { sendEmail } from "@/lib/email";
import { generateEmailHtml } from "@/lib/email-templates";
import mongoose from "mongoose";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const duration = searchParams.get("duration");

        await connectToDatabase();

        let dateFilter: any = {};
        const now = new Date();

        if (duration === "1m") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            dateFilter = { createdAt: { $gte: oneMonthAgo } };
        } else if (duration === "3m") {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            dateFilter = { createdAt: { $gte: threeMonthsAgo } };
        } else if (duration === "6m") {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            dateFilter = { createdAt: { $gte: sixMonthsAgo } };
        }
        // "all" implies no date filter

        const transactions = await Transaction.find({
            userId: new mongoose.Types.ObjectId(session.user.id),
            ...dateFilter
        }).sort({ createdAt: -1 }).lean();

        if (transactions.length === 0) {
            return NextResponse.json({ message: "No transactions found for the selected period" }, { status: 404 });
        }

        // Generate CSV
        const headers = ["Date", "Time", "Type", "Description", "Amount", "Status", "Reference ID", "UTR Number"];
        const rows = transactions.map((t: any) => {
            const date = new Date(t.createdAt);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                t.type,
                t.description || "System Transaction",
                t.amount.toString(),
                t.status,
                t._id.toString(),
                t.utrNumber || "-"
            ].map(field => `"${field}"`).join(","); // Quote fields to handle commas
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const buffer = Buffer.from(csvContent, "utf-8");

        // Send Email
        const emailHtml = generateEmailHtml(
            session.user.name || "Valued User",
            "Transaction History Export",
            `
            <p>Here is the transaction history you requested for the period: <strong>${duration === 'all' ? 'All Time' : duration === '1m' ? 'Last 1 Month' : duration === '3m' ? 'Last 3 Months' : 'Last 6 Months'}</strong>.</p>
            <p>Please find the CSV file attached.</p>
            `
        );

        const emailResult = await sendEmail({
            to: session.user.email!,
            subject: "Your Transaction History Export - InvestHub",
            html: emailHtml,
            attachments: [
                {
                    filename: `transactions_${duration}_${now.getTime()}.csv`,
                    content: buffer,
                    contentType: "text/csv"
                }
            ]
        });

        if (!emailResult.success) {
            console.error("Failed to send email:", emailResult.error);
            return NextResponse.json({ message: "Failed to send email" }, { status: 500 });
        }

        return NextResponse.json({ message: "Export successful! Check your email." });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

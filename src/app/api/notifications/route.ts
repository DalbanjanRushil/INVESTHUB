import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const notifications = await Notification.find({ userId: session.user.id })
            .sort({ createdAt: -1 }) // Newest first
            .limit(50); // Cap at 50

        return NextResponse.json(notifications, { status: 200 });
    } catch (error) {
        console.error("Fetch Notifications Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Mark all as read for this user
        await Notification.updateMany(
            { userId: session.user.id, isRead: false },
            { isRead: true }
        );

        return NextResponse.json({ message: "Marked all as read" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

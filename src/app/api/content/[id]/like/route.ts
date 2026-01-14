import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Content from "@/models/Content";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const { id } = await params;
        const contentId = id;

        await connectToDatabase();

        const content = await Content.findById(contentId);
        if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

        // Toggle Logic
        const isLiked = content.likes.includes(userId as any);

        if (isLiked) {
            content.likes = content.likes.filter((id) => id.toString() !== userId);
        } else {
            content.likes.push(userId as any);
        }

        await content.save();

        return NextResponse.json({
            message: isLiked ? "Unliked" : "Liked",
            likesCount: content.likes.length,
            isLiked: !isLiked
        });

    } catch (error) {
        console.error("Like Error:", error);
        return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
    }
}

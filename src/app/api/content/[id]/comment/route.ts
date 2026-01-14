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
        const { text } = await req.json();

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "Comment text required" }, { status: 400 });
        }

        await connectToDatabase();

        const content = await Content.findById(contentId);
        if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

        const newComment = {
            userId: userId,
            text: text.trim(),
            createdAt: new Date(),
        };

        content.comments.push(newComment as any);
        await content.save();

        // Populate and return the new comment for frontend display
        // We can't easily populate a single subdoc push return, so we return the object and frontend handles the name (or we do a quick fetch)
        // For simplicity, we just return the simple object + User Name from session
        const returnedComment = {
            ...newComment,
            user: { name: session.user.name, _id: session.user.id }
        };

        return NextResponse.json({
            message: "Comment added",
            comment: returnedComment,
            commentsCount: content.comments.length
        });

    } catch (error) {
        console.error("Comment Error:", error);
        return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }
}

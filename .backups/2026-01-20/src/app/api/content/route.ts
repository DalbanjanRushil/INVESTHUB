import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Content, { ContentType } from "@/models/Content";
import User, { UserRole } from "@/models/User";
import { z } from "zod";

export const dynamic = "force-dynamic";

const contentSchema = z.object({
    title: z.string().min(3),
    type: z.enum([ContentType.VIDEO, ContentType.CHART, ContentType.POST]),
    url: z.string().refine((val) => val.startsWith("http") || val.startsWith("/"), {
        message: "Must be a valid URL or local path",
    }),
    description: z.string().optional(),
});

// GET: Fetch Content (Public/User)
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const _u = User; // Ensure User model loaded

        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        // Use strictPopulate: false to handle schema hot-reload inconsistencies in Dev
        const contentList = await Content.find()
            .populate({ path: "comments.userId", select: "name", strictPopulate: false })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const enhancedContent = contentList
            .filter((item: any) => item.isPublic !== false)
            .map((item: any) => ({
                ...item,
                likesCount: item.likes?.length || 0,
                commentsCount: item.comments?.length || 0,
                isLiked: currentUserId ? item.likes?.map((id: any) => id.toString()).includes(currentUserId) : false,
                comments: item.comments?.map((c: any) => ({
                    _id: c._id,
                    text: c.text,
                    createdAt: c.createdAt,
                    user: c.userId ? { _id: c.userId._id, name: c.userId.name } : { name: "Unknown User" }
                }))
            }));

        return NextResponse.json(enhancedContent, { status: 200 });
    } catch (error: any) {
        console.error("Content Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch content", details: error.message }, { status: 500 });
    }
}

// POST: Upload Content (Admin Only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { title, type, url, description } = contentSchema.parse(body);

        await connectToDatabase();

        const newContent = await Content.create({
            title,
            type,
            url,
            description,
            uploadedBy: session.user.id,
            isPublic: true,
            likes: [],
            comments: []
        });

        return NextResponse.json(
            { message: "Content uploaded successfully", content: newContent },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

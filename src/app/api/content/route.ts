import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Content, { ContentType } from "@/models/Content";
import { UserRole } from "@/models/User";
import { z } from "zod";

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

        // Sort by newest first
        const content = await Content.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json(content, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
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

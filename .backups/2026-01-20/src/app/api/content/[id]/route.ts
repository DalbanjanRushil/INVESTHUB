import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Content from "@/models/Content";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const contentId = id;

        await connectToDatabase();

        const deletedContent = await Content.findByIdAndDelete(contentId);

        if (!deletedContent) {
            return NextResponse.json({ error: "Content not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Content deleted successfully" });
    } catch (error) {
        console.error("Delete Content Error:", error);
        return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
    }
}

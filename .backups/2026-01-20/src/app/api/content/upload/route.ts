import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique name
        const uniqueName = `${uuidv4()}-${file.name.replace(/\s/g, "-")}`;
        const filePath = path.join(uploadDir, uniqueName);

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL
        const publicUrl = `/uploads/${uniqueName}`;

        return NextResponse.json({ url: publicUrl }, { status: 200 });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}

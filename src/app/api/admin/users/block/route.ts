
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole, UserStatus } from "@/models/User";
import { z } from "zod";

const blockSchema = z.object({
    userId: z.string(),
    action: z.enum(["BLOCK", "UNBLOCK"]),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, action } = blockSchema.parse(body);

        await connectToDatabase();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.status = action === "BLOCK" ? UserStatus.BLOCKED : UserStatus.ACTIVE;
        await user.save();

        return NextResponse.json({ success: true, message: `User ${action === "BLOCK" ? "Blocked" : "Activated"}` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

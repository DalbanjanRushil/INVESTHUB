import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";

const preferenceSchema = z.object({
    payoutPreference: z.enum(["COMPOUND", "PAYOUT"]),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { payoutPreference } = preferenceSchema.parse(body);

        await connectToDatabase();

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { payoutPreference },
            { new: true }
        );

        return NextResponse.json(
            { message: "Preference updated", preference: user?.payoutPreference },
            { status: 200 }
        );

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Preference Update Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

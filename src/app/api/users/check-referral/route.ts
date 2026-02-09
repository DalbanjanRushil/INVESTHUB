
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        await connectToDatabase();

        const referrer = await User.findOne({
            referralCode: { $regex: new RegExp(`^${code.trim()}$`, "i") }
        }).select("name");

        if (!referrer) {
            return NextResponse.json({ valid: false }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            name: referrer.name
        });

    } catch (error) {
        console.error("Referral Check Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

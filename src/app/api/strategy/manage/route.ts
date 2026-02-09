import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const strategy = await InvestmentStrategy.create(body);

        return NextResponse.json({ success: true, data: strategy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id, ...body } = await req.json();

        const strategy = await InvestmentStrategy.findByIdAndUpdate(id, body, { new: true });

        if (!strategy) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: strategy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const strategy = await InvestmentStrategy.findByIdAndDelete(id);

        if (!strategy) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Strategy deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

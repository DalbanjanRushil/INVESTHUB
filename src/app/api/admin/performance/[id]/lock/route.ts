import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        const period = await PerformancePeriod.findById(params.id);
        if (!period) {
            return NextResponse.json({ error: "Period not found" }, { status: 404 });
        }

        if (period.locked) {
            return NextResponse.json({ error: "Period is already locked." }, { status: 400 });
        }

        period.locked = true;
        await period.save();

        return NextResponse.json(period);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

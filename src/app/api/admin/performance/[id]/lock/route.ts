import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import PerformancePeriod from "@/models/PerformancePeriod";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // 1️⃣ Admin authorization
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await connectToDatabase();

        // 2️⃣ Next.js 16 params handling
        const { id } = await context.params;

        // 3️⃣ Find performance period
        const period = await PerformancePeriod.findById(id);

        if (!period) {
            return NextResponse.json(
                { error: "Period not found" },
                { status: 404 }
            );
        }

        // 4️⃣ Prevent double lock
        if (period.locked) {
            return NextResponse.json(
                { error: "Period is already locked." },
                { status: 400 }
            );
        }

        // 5️⃣ Lock the period
        period.locked = true;
        await period.save();

        // 6️⃣ Success response
        return NextResponse.json({
            message: "Performance period locked successfully",
            period,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

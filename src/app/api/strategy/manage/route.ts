import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

import Wallet from "@/models/Wallet";

async function getAvailableLiquid() {
    const [strategies, walletStats] = await Promise.all([
        InvestmentStrategy.find({ isActive: true }).lean(),
        Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalPrincipal: { $sum: "$principal" },
                    totalProfit: { $sum: "$profit" },
                    totalReferral: { $sum: "$referral" }
                }
            }
        ])
    ]);

    const totalSystemFunds = (walletStats[0]?.totalPrincipal || 0) +
        (walletStats[0]?.totalProfit || 0) +
        (walletStats[0]?.totalReferral || 0);

    const totalBlocked = strategies.reduce((sum, s) => sum + (s.totalCapitalDeployed || 0), 0);

    return {
        available: totalSystemFunds - totalBlocked,
        totalSystemFunds,
        totalBlocked
    };
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // 1. Validate Tenure Allocation Sum
        const { tenureAllocation, totalCapitalDeployed } = body;
        if (tenureAllocation) {
            const sum = (tenureAllocation.flexi || 0) +
                (tenureAllocation.months3 || 0) +
                (tenureAllocation.months6 || 0) +
                (tenureAllocation.months12 || 0);

            if (sum !== totalCapitalDeployed) {
                return NextResponse.json({
                    error: `Tenure allocation sum (${sum}) must match Total Capital Deployed (${totalCapitalDeployed})`
                }, { status: 400 });
            }
        }

        // 2. Validate Available Liquid Funds
        const { available } = await getAvailableLiquid();

        if (totalCapitalDeployed > available) {
            return NextResponse.json({
                error: `Insufficient Liquid Funds (Available: ₹${available.toLocaleString()}, Requested: ₹${totalCapitalDeployed.toLocaleString()})`
            }, { status: 400 });
        }

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

        const existingStrategy = await InvestmentStrategy.findById(id);
        if (!existingStrategy) {
            return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
        }

        // 1. Validate Tenure Allocation Sum
        const { tenureAllocation, totalCapitalDeployed } = body;
        if (tenureAllocation) {
            const sum = (tenureAllocation.flexi || 0) +
                (tenureAllocation.months3 || 0) +
                (tenureAllocation.months6 || 0) +
                (tenureAllocation.months12 || 0);

            if (sum !== totalCapitalDeployed) {
                return NextResponse.json({
                    error: `Tenure allocation sum (${sum}) must match Total Capital Deployed (${totalCapitalDeployed})`
                }, { status: 400 });
            }
        }

        // 2. Validate Available Liquid Funds
        // We add back the OLD amount to the pool because we are replacing it
        const { available } = await getAvailableLiquid();
        const effectiveAvailable = available + (existingStrategy.totalCapitalDeployed || 0);

        if (totalCapitalDeployed > effectiveAvailable) {
            return NextResponse.json({
                error: `Insufficient Liquid Funds (Available: ₹${effectiveAvailable.toLocaleString()}, Requested: ₹${totalCapitalDeployed.toLocaleString()})`
            }, { status: 400 });
        }

        const strategy = await InvestmentStrategy.findByIdAndUpdate(id, body, { new: true });

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

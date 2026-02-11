import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

import Wallet from "@/models/Wallet";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const [strategies, walletStats] = await Promise.all([
            InvestmentStrategy.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
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

        const totalUserFunds = (walletStats[0]?.totalPrincipal || 0) +
            (walletStats[0]?.totalProfit || 0) +
            (walletStats[0]?.totalReferral || 0);

        // 1. Determine if the user is an admin
        const isAdmin = session.user.role === "ADMIN";

        // 2. Transform strategies based on role (User View Logic)
        const transformedStrategies = strategies.map((strategy: any) => {
            const { internalROI, ...rest } = strategy;

            // If user is admin, they see everything including internalROI
            if (isAdmin) {
                return strategy;
            }

            // If user is NOT admin, hide internalROI and only show conservativeROI
            return {
                ...rest,
                // Ensure conservativeROI is explicitly sent as 'roi' for UI consistency
                roi: strategy.conservativeROI,
            };
        });

        // 3. Calculate Global Metrics for Header
        const totalDeployed = strategies.reduce((sum, s) => sum + s.totalCapitalDeployed, 0);
        const availableLiquid = totalUserFunds - totalDeployed;

        const activeCount = strategies.filter(s => s.status === "ACTIVE").length;
        const avgConservativeROI = strategies.length > 0
            ? strategies.reduce((sum, s) => sum + s.conservativeROI, 0) / strategies.length
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                strategies: transformedStrategies,
                metrics: {
                    totalDeployed,
                    availableLiquid: Number(availableLiquid.toFixed(2)),
                    activeCount,
                    avgConservativeROI: Number(avgConservativeROI.toFixed(2)),
                    riskDistribution: calculateRiskDistribution(strategies),
                }
            }
        });

    } catch (error: any) {
        console.error("[Strategy API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

function calculateRiskDistribution(strategies: any[]) {
    const dist = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    if (strategies.length === 0) return dist;

    strategies.forEach(s => {
        if (s.riskLevel === "LOW") dist.LOW++;
        if (s.riskLevel === "MEDIUM") dist.MEDIUM++;
        if (s.riskLevel === "HIGH") dist.HIGH++;
    });

    return {
        low: Math.round((dist.LOW / strategies.length) * 100),
        medium: Math.round((dist.MEDIUM / strategies.length) * 100),
        high: Math.round((dist.HIGH / strategies.length) * 100),
    };
}

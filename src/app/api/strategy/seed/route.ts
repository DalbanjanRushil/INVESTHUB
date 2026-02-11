import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Helper to generate realistic-looking history
        const generateHistory = (targetRoi: number, risk: string) => {
            const history = [];
            const now = new Date();
            let currentRoi = 0;
            const volatility = risk === "HIGH" ? 2.5 : risk === "MEDIUM" ? 1.5 : 0.8;

            for (let i = 12; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                // Random fluctuation: target monthly return +/- volatility
                const monthlyGrowth = (targetRoi / 12) + (Math.random() * volatility - (volatility / 2));
                currentRoi = Math.max(0, currentRoi + monthlyGrowth); // Cumulative

                history.push({
                    date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), // e.g., "Jan 2025"
                    roi: Number(currentRoi.toFixed(2))
                });
            }
            return history;
        };

        const strategies = [
            {
                name: "Physical Gold Reserves",
                description: "Diversified allocation into physical gold bullion and sovereign gold bonds for ultimate capital protection.",
                category: "COMMODITY",
                riskLevel: "LOW",
                minInvestment: 5000,
                lockInPeriod: 6,
                totalCapitalDeployed: 4500000,
                internalROI: 18,
                conservativeROI: 9,
                disclosureFactor: 0.5,
                allocation: [{ asset: "Gold Bullion", percentage: 100, color: "#f59e0b" }],
                tenureAllocation: { flexi: 450000, months3: 900000, months6: 1350000, months12: 1800000 },
                history: generateHistory(9, "LOW"),
                status: "ACTIVE",
                isActive: true
            },
            {
                name: "Real Estate - Dubai Marina",
                description: "High-yield commercial and residential rentals in prime Dubai locations with strong capital appreciation.",
                category: "REAL_ESTATE",
                riskLevel: "MEDIUM",
                minInvestment: 50000,
                lockInPeriod: 12,
                totalCapitalDeployed: 12000000,
                internalROI: 24,
                conservativeROI: 12,
                disclosureFactor: 0.5,
                allocation: [{ asset: "Commercial", percentage: 60, color: "#3b82f6" }, { asset: "Residential", percentage: 40, color: "#10b981" }],
                tenureAllocation: { flexi: 1200000, months3: 2400000, months6: 3600000, months12: 4800000 },
                history: generateHistory(12, "MEDIUM"),
                status: "ACTIVE",
                isActive: true
            },
            {
                name: "FinTech Startup Venture",
                description: "Equity stake in a high-growth Indian fintech startup focusing on tier-2 city micro-lending.",
                category: "STARTUP",
                riskLevel: "HIGH",
                minInvestment: 25000,
                lockInPeriod: 24,
                totalCapitalDeployed: 3500000,
                internalROI: 45,
                conservativeROI: 20,
                disclosureFactor: 0.44,
                allocation: [{ asset: "Equity", percentage: 100, color: "#ec4899" }],
                tenureAllocation: { flexi: 350000, months3: 700000, months6: 1050000, months12: 1400000 },
                history: generateHistory(20, "HIGH"),
                status: "ACTIVE",
                isActive: true
            },
            {
                name: "Gujarat Industrial Land",
                description: "Strategic acquisition of industrial plots near emerging manufacturing hubs in Gujarat.",
                category: "LOCATION_BASED",
                riskLevel: "MEDIUM",
                minInvestment: 10000,
                lockInPeriod: 18,
                totalCapitalDeployed: 8000000,
                internalROI: 30,
                conservativeROI: 15,
                disclosureFactor: 0.5,
                allocation: [{ asset: "Land", percentage: 100, color: "#8b5cf6" }],
                tenureAllocation: { flexi: 800000, months3: 1600000, months6: 2400000, months12: 3200000 },
                history: generateHistory(15, "MEDIUM"),
                status: "ACTIVE",
                isActive: true
            }
        ];

        await InvestmentStrategy.deleteMany({});
        await InvestmentStrategy.insertMany(strategies);

        return NextResponse.json({ success: true, message: "Strategies seeded successfully" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

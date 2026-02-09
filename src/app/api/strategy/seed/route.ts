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

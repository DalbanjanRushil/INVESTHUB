import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import InvestmentStrategy from "@/models/InvestmentStrategy";

export async function GET() {
    try {
        await connectDB();

        const existing = await InvestmentStrategy.findOne({ name: "Prime Growth Fund" });
        if (existing) {
            return NextResponse.json({ message: "Default strategy already exists", strategy: existing });
        }

        const newStrategy = await InvestmentStrategy.create({
            name: "Prime Growth Fund",
            description: "A meticulously curated portfolio balanced between high-growth innovative equities and stable, income-generating real estate assets. Designed for sustained wealth accumulation.",
            category: "OTHER",
            riskLevel: "MEDIUM",
            minInvestment: 5000,
            lockInPeriod: 12,
            totalCapitalDeployed: 1000000,
            internalROI: 24,
            conservativeROI: 12,
            disclosureFactor: 0.5,
            allocation: [
                { asset: "Technology Growth Stocks", percentage: 35, color: "#6366f1" },
                { asset: "Commercial Real Estate", percentage: 30, color: "#10b981" },
                { asset: "Green Energy Bonds", percentage: 15, color: "#f59e0b" },
                { asset: "Digital Assets (Blue Chip)", percentage: 10, color: "#8b5cf6" },
                { asset: "Liquid Reserves", percentage: 10, color: "#3b82f6" },
            ],
            history: Array.from({ length: 12 }, (_, i) => {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                // Generate varied but generally positive returns for the last 12 months
                const roi = (Math.random() * 4 - 0.5).toFixed(2); // Range -0.5 to 3.5
                return {
                    date: `${months[i]} 2024`,
                    roi: parseFloat(roi),
                };
            }),
            managerMessage: "Our strategic pivot into Green Energy Bonds has provided excellent stability against recent market volatility. We continue to see strong upside in our Tech Growth allocations.",
            isActive: true,
        });

        return NextResponse.json({ message: "Seeded successfully", strategy: newStrategy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

"use client";

import React from "react";
import {
    PieChart,
    Pie,
    Sector,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";
import { motion } from "framer-motion";

interface Strategy {
    _id: string;
    name: string;
    category: string;
    riskLevel: string;
    totalCapitalDeployed: number;
    conservativeROI: number;
}

interface AllocationChartsProps {
    strategies: Strategy[];
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

export default function AllocationCharts({ strategies }: AllocationChartsProps) {
    if (!strategies || strategies.length === 0) return null;

    // 1. Prepare Pie Data (Portfolio Allocation)
    const pieData = strategies.map((s) => ({
        name: s.name,
        value: s.totalCapitalDeployed,
    }));

    // 2. Prepare Bar Data (ROI Distribution)
    const barData = strategies.map((s) => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + "..." : s.name,
        roi: s.conservativeROI,
        category: s.category,
    }));

    // Custom Label for Pie Chart (Always Visible)
    const renderCustomLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name } = props;
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 20;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const textAnchor = x > cx ? 'start' : 'end';

        return (
            <text x={x} y={y} fill="#cbd5e1" textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fontWeight="bold">
                {`${name}: ₹${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
            </text>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
            {/* Portfolio Allocation Pie Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-card border border-border shadow-lg"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">Portfolio Allocation</h3>
                    <p className="text-xs text-muted-foreground">Capital distribution across all active strategies</p>
                </div>
                <div className="h-[350px] w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                                label={renderCustomLabel}
                                labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* ROI Distribution Bar Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-3xl bg-card border border-border shadow-lg"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-1">ROI Distribution</h3>
                    <p className="text-xs text-muted-foreground">Annualized conservative returns by strategy</p>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="name"
                                stroke="#888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: any) => [`${value}% ROI`, 'Conservative Target']}
                            />
                            <Bar
                                dataKey="roi"
                                fill="#10b981"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={60}
                                label={{ position: 'top', fill: '#10b981', fontSize: 14, fontWeight: 'bold', formatter: (v: any) => `${v}%` }}
                            >
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}

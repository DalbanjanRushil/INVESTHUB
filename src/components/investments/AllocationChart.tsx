"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

interface AllocationItem {
    asset: string;
    percentage: number;
    color: string;
    _id?: string;
}

interface AllocationChartProps {
    data: AllocationItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl transform translate-y-[-10px]">
                <p className="font-bold text-popover-foreground mb-1">{payload[0].name}</p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></span>
                    <span className="font-mono text-muted-foreground">{payload[0].value}% Allocation</span>
                </div>
            </div>
        );
    }
    return null;
};

const RenderLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {payload?.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{entry.value}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-foreground">{entry.payload.percentage}%</span>
                </div>
            ))}
        </div>
    );
};

export default function AllocationChart({ data }: AllocationChartProps) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-muted-foreground">No Data</div>;

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="relative h-[220px]">
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Diversified</span>
                    <span className="text-2xl font-bold text-foreground">100%</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data as any}
                            cx="50%"
                            cy="50%"
                            innerRadius={70} // Thinner ring
                            outerRadius={90}
                            paddingAngle={4}
                            cornerRadius={4}
                            dataKey="percentage"
                            nameKey="asset"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none focus:outline-none"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Legend Below */}
            <RenderLegend payload={data.map(d => ({ value: d.asset, type: 'square', id: d.asset, color: d.color, payload: d }))} />
        </div>
    );
}

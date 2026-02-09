"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface HistoryItem {
    date: string;
    roi: number;
}

interface PerformanceGraphProps {
    data: HistoryItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const val = payload[0].value;
        return (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-xl">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                        {val > 0 ? "+" : ""}{val}%
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">ROI</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function PerformanceGraph({ data }: PerformanceGraphProps) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-muted-foreground">No Data</div>;

    return (
        <div className="w-full h-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.1} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        interval="preserveStartEnd"
                        padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        domain={[0, 'auto']}
                    />
                    {/* Benchmark Line (Simulated Nifty 50 Avg) */}
                    <ReferenceLine y={5} stroke="#6B7280" strokeDasharray="3 3" opacity={0.5} label={{ position: 'right', value: 'Market Avg (5%)', fill: '#6B7280', fontSize: 10 }} />

                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="roi"
                        stroke="#10b981" // Green-500
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorRoi)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

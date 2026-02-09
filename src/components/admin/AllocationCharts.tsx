"use client";

import React from "react";
import { 
    PieChart, 
    Pie, 
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
    const pieData = strategies.map(s => ({
        name: s.name,
        value: s.totalCapitalDeployed
    }));

    // 2. Prepare Bar Data (ROI Distribution)
    const barData = strategies.map(s => ({
        name: s.name.length > 10 ? s.name.substring(0, 10) + "..." : s.name,
        roi: s.conservativeROI,
        category: s.category
    }));

    // 3. Prepare Risk Data
    const riskCounts = strategies.reduce((acc: any, s) => {
        acc[s.riskLevel] = (acc[s.riskLevel] || 0) + s.totalCapitalDeployed;
        return acc;
    }, {});
    const riskData = Object.keys(riskCounts).map(k => ({ name: k, value: riskCounts[k] }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
            {/* Portfolio Allocation Pie Chart */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-lg"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">Portfolio Allocation</h3>
                    <p className="text-xs text-slate-500">Capital distribution across all active strategies</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px' }}
                                itemStyle={{ color: '#F8FAFC' }}
                                formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* ROI Distribution Bar Chart */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-lg"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">ROI Distribution</h3>
                    <p className="text-xs text-slate-500">Annualized conservative returns by strategy</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0B1120', border: '1px solid #1E293B', borderRadius: '12px' }}
                                itemStyle={{ color: '#F8FAFC' }}
                                formatter={(value: any) => [`${value}% ROI`, 'Conservative Target']}
                            />
                            <Bar dataKey="roi" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}

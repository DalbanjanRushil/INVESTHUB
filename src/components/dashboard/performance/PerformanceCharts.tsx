"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

export default function PerformanceCharts({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="p-8 text-center text-gray-500">No performance data available yet.</div>;

    // Format data for Recharts
    const chartData = data.map(period => ({
        label: period.periodLabel,
        profit: period.netProfit,
        roi: period.roiPercent,
        capital: period.capitalDeployed
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Trend */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">ROI Consistency (%)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRoi)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Net Profit Growth */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Net Profit Generated (₹)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#374151', opacity: 0.2 }}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

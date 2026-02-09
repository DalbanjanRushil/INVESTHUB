"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, TrendingUp } from "lucide-react";

interface AllocationItem {
    asset: string;
    percentage: number;
    color: string;
    _id?: string;
}

interface StrategyData {
    allocation: AllocationItem[];
    managerMessage: string;
    description: string;
    riskLevel: string;
}

export default function StrategyManager() {
    const [strategy, setStrategy] = useState<StrategyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [roiForm, setRoiForm] = useState({ date: "", roi: 0 });

    // Load initial data
    useEffect(() => {
        fetch("/api/strategy")
            .then((res) => res.json())
            .then((data) => {
                if (data.strategy) setStrategy(data.strategy);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);



    const handleAddHistory = async () => {
        if (!roiForm.date) return toast.error("Date is required");

        const res = await fetch("/api/admin/strategy", {
            method: "PUT",
            body: JSON.stringify({
                action: "ADD_HISTORY",
                data: roiForm
            }),
        });

        if (res.ok) {
            toast.success("History Record Added!");
            // Refresh logic could go here
            setRoiForm({ date: "", roi: 0 });
        } else {
            toast.error("Failed to add record");
        }
    };

    const handleUpdateDetails = async () => {
        if (!strategy) return;
        const res = await fetch("/api/admin/strategy", {
            method: "PUT",
            body: JSON.stringify({
                action: "UPDATE_DETAILS",
                data: {
                    managerMessage: strategy.managerMessage,
                    description: strategy.description,
                    riskLevel: strategy.riskLevel
                }
            })
        });
        if (res.ok) toast.success("Details Updated!");
    };

    if (loading) return <div className="p-4 bg-white rounded-xl">Loading Strategy Manager...</div>;
    if (!strategy) return <div className="p-4 bg-white rounded-xl">No active strategy found to manage.</div>;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Fund Management
            </h2>

            {/* 1. Add Monthly Performance */}
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500">Add Monthly Performance</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Month (e.g. Jan 2026)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium outline-none"
                            placeholder="Jan 2026"
                            value={roiForm.date}
                            onChange={(e) => setRoiForm({ ...roiForm, date: e.target.value })}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">ROI % (e.g. 2.5)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium outline-none"
                            value={roiForm.roi}
                            onChange={(e) => setRoiForm({ ...roiForm, roi: Number(e.target.value) })}
                        />
                    </div>
                    <button
                        onClick={handleAddHistory}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Record
                    </button>
                </div>
            </div>

            {/* 2. Manager Message */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase text-gray-500">Fund Manager's Message</h3>
                <textarea
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white h-24 outline-none"
                    value={strategy.managerMessage}
                    onChange={(e) => setStrategy({ ...strategy, managerMessage: e.target.value })}
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleUpdateDetails}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Message
                    </button>
                </div>
            </div>

            {/* Future: Allocation Editor can go here */}
        </div>
    );
}

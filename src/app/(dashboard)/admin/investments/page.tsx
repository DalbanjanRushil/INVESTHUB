"use client";

import { useEffect, useState } from "react";
import StrategyManager from "@/components/admin/StrategyManager";
import AllocationCharts from "@/components/admin/AllocationCharts";
import StrategyEntryForm from "@/components/forms/StrategyEntryForm";
import { Activity, Loader2, Plus, RefreshCw } from "lucide-react";

export default function AdminInvestmentsPage() {
    const [strategyData, setStrategyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<any>(null);

    useEffect(() => {
        fetchStrategyData();
    }, []);

    const openCreateForm = () => {
        setEditingStrategy(null);
        setIsFormOpen(true);
    };

    const openEditForm = (strategy: any) => {
        setEditingStrategy(strategy);
        setIsFormOpen(true);
    };

    async function fetchStrategyData() {
        setLoading(true);
        try {
            const res = await fetch("/api/strategy");
            const json = await res.json();
            if (json.success) {
                setStrategyData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch strategy data:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategy Manager</h1>
                        <p className="text-muted-foreground">Update ROI performance, asset allocation, and lock-in periods.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStrategyData}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Strategy
                    </button>
                </div>
            </div>

            {strategyData ? (
                <div className="space-y-12">
                    <StrategyManager
                        strategies={strategyData.strategies}
                        metrics={strategyData.metrics}
                        isAdmin={true}
                        onEdit={openEditForm}
                    />
                    <AllocationCharts strategies={strategyData.strategies} />
                </div>
            ) : (
                <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-slate-500">No strategies found. Click "Add Strategy" to create your first fund bucket.</p>
                </div>
            )}

            <StrategyEntryForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchStrategyData}
                initialData={editingStrategy}
            />
        </div>
    );
}


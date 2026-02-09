"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, TrendingUp, Calendar, DollarSign, Plus, Trash2, Save, BarChart3, PieChart, Activity } from "lucide-react";

type PerformanceType = 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface HistoryRecord {
    _id: string;
    periodLabel: string;
    periodType: PerformanceType;
    grossProfit: number;
    grossLoss: number;
    netProfit: number;
    capitalDeployed: number;
    roiPercent: number;
    metrics?: Record<string, any>;
    createdAt: string;
}

export default function HistoryPage() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        periodLabel: "",
        periodType: "MONTHLY" as PerformanceType,
        grossProfit: "",
        grossLoss: "0",
        capitalDeployed: "",
        notes: "",
    });

    const [customMetrics, setCustomMetrics] = useState<{ key: string, value: string }[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/admin/history");
            const data = await res.json();
            if (Array.isArray(data)) {
                setRecords(data);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMetric = () => {
        setCustomMetrics([...customMetrics, { key: "", value: "" }]);
    };

    const handleMetricChange = (index: number, field: 'key' | 'value', val: string) => {
        const newMetrics = [...customMetrics];
        newMetrics[index][field] = val;
        setCustomMetrics(newMetrics);
    };

    const handleRemoveMetric = (index: number) => {
        const newMetrics = [...customMetrics];
        newMetrics.splice(index, 1);
        setCustomMetrics(newMetrics);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Convert metrics array to object
        const metricsObj: Record<string, any> = {};
        customMetrics.forEach(m => {
            if (m.key && m.value) metricsObj[m.key] = m.value;
        });

        const payload = {
            ...form,
            grossProfit: Number(form.grossProfit),
            grossLoss: Number(form.grossLoss),
            capitalDeployed: Number(form.capitalDeployed),
            metrics: metricsObj
        };

        try {
            const res = await fetch("/api/admin/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Reset
                setForm({
                    periodLabel: "",
                    periodType: "MONTHLY",
                    grossProfit: "",
                    grossLoss: "0",
                    capitalDeployed: "",
                    notes: "",
                });
                setCustomMetrics([]);
                fetchHistory(); // Refresh list
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (error) {
            console.error("Submit failed", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await fetch(`/api/admin/history?id=${id}`, { method: "DELETE" });
            fetchHistory();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Track Record Manager</h1>
                    <p className="text-muted-foreground mt-1">Input historical data to build trust and showcase performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Add Past Performance
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Period Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. January 2024"
                                    className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm"
                                    required
                                    value={form.periodLabel}
                                    onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
                                    <select
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm"
                                        value={form.periodType}
                                        onChange={(e) => setForm({ ...form, periodType: e.target.value as PerformanceType })}
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Capital (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="100000"
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm"
                                        required
                                        min="1"
                                        value={form.capitalDeployed}
                                        onChange={(e) => setForm({ ...form, capitalDeployed: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground text-emerald-500">Gross Profit (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm"
                                        required
                                        min="0"
                                        value={form.grossProfit}
                                        onChange={(e) => setForm({ ...form, grossProfit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground text-rose-500">Gross Loss (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full mt-1 p-2 bg-background border border-border rounded-md text-sm"
                                        required
                                        min="0"
                                        value={form.grossLoss}
                                        onChange={(e) => setForm({ ...form, grossLoss: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Dynamic Metrics */}
                            <div className="pt-2 border-t border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Custom Metrics</label>
                                    <button
                                        type="button"
                                        onClick={handleAddMetric}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Field
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {customMetrics.map((m, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                placeholder="Key (e.g. Win Rate)"
                                                className="w-1/2 p-2 bg-background border border-border rounded-md text-xs"
                                                value={m.key}
                                                onChange={(e) => handleMetricChange(idx, 'key', e.target.value)}
                                            />
                                            <input
                                                placeholder="Value (e.g. 75%)"
                                                className="w-1/2 p-2 bg-background border border-border rounded-md text-xs"
                                                value={m.value}
                                                onChange={(e) => handleMetricChange(idx, 'value', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMetric(idx)}
                                                className="text-rose-500 hover:bg-rose-500/10 p-1 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {customMetrics.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">No custom metrics added.</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                SAVE RECORD
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Total Records</p>
                            <p className="text-2xl font-mono font-bold">{records.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg shadow-sm">
                            <p className="text-xs text-emerald-600 uppercase font-bold">Best Month ROI</p>
                            <p className="text-2xl font-mono font-bold text-emerald-500">
                                {records.length > 0 ? Math.max(...records.map(r => r.roiPercent)).toFixed(2) : 0}%
                            </p>
                        </div>
                        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg shadow-sm">
                            <p className="text-xs text-blue-600 uppercase font-bold">Total Profit Logged</p>
                            <p className="text-2xl font-mono font-bold text-blue-500">
                                ₹{records.reduce((acc, r) => acc + r.netProfit, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border">
                                <tr>
                                    <th className="px-5 py-3">Label</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3 text-right">ROI</th>
                                    <th className="px-5 py-3 text-right">Profit</th>
                                    <th className="px-5 py-3">Metrics</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                                ) : records.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No historical data found.</td></tr>
                                ) : (
                                    records.map((r) => (
                                        <tr key={r._id} className="group hover:bg-muted/30">
                                            <td className="px-5 py-3 font-medium">{r.periodLabel}</td>
                                            <td className="px-5 py-3 text-xs">
                                                <span className="bg-secondary px-2 py-1 rounded border border-border">{r.periodType}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-bold text-emerald-500">
                                                {r.roiPercent.toFixed(2)}%
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono">
                                                ₹{r.netProfit.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-muted-foreground">
                                                {r.metrics && Object.keys(r.metrics).length > 0 ? (
                                                    <span className="truncate max-w-[150px] inline-block">
                                                        {Object.entries(r.metrics).map(([k, v]) => `${k}:${v}`).join(", ")}
                                                    </span>
                                                ) : "-"}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(r._id)}
                                                    className="text-muted-foreground hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

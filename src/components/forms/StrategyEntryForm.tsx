"use client";

import React, { useState } from "react";
import { X, Shield, TrendingUp, Briefcase, Lock, Info, Save, Loader2, Plus, Trash2, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StrategyEntryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function StrategyEntryForm({ isOpen, onClose, onSuccess, initialData }: StrategyEntryFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        category: initialData?.category || "OTHER",
        riskLevel: initialData?.riskLevel || "MEDIUM",
        minInvestment: initialData?.minInvestment || 5000,
        lockInPeriod: initialData?.lockInPeriod || 6,
        totalCapitalDeployed: initialData?.totalCapitalDeployed || 0,
        internalROI: initialData?.internalROI || 0,
        conservativeROI: initialData?.conservativeROI || 0,
        disclosureFactor: initialData?.disclosureFactor || 0.5,
        status: initialData?.status || "ACTIVE",
        allocation: initialData?.allocation || [{ asset: "", percentage: 100, color: "#10b981" }],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = initialData ? "PUT" : "POST";
            const url = "/api/strategy/manage";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(initialData ? { ...formData, id: initialData._id } : formData),
            });

            const json = await res.json();
            if (json.success) {
                onSuccess();
                onClose();
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error("Failed to save strategy:", error);
            alert("Failed to save strategy");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?._id) return;
        if (!confirm("Are you sure you want to delete this strategy? This action cannot be undone.")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/strategy/manage?id=${initialData._id}`, {
                method: "DELETE",
            });

            const json = await res.json();
            if (json.success) {
                onSuccess();
                onClose();
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error("Failed to delete strategy:", error);
            alert("Failed to delete strategy");
        } finally {
            setLoading(false);
        }
    };

    const handleAllocationChange = (index: number, field: string, value: any) => {
        const newAllocation = [...formData.allocation];
        newAllocation[index] = { ...newAllocation[index], [field]: value };
        setFormData({ ...formData, allocation: newAllocation });
    };

    const addAllocation = () => {
        setFormData({
            ...formData,
            allocation: [...formData.allocation, { asset: "", percentage: 0, color: "#3b82f6" }]
        });
    };

    const removeAllocation = (index: number) => {
        if (formData.allocation.length === 1) return;
        setFormData({
            ...formData,
            allocation: formData.allocation.filter((_: any, i: number) => i !== index)
        });
    };

    const autoCalculateConservative = (internal: number) => {
        const conservative = Math.floor(internal * formData.disclosureFactor);
        setFormData(prev => ({ ...prev, internalROI: internal, conservativeROI: conservative }));
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-4xl bg-background border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{initialData ? "Edit Strategy" : "Create New Strategy"}</h2>
                                <p className="text-xs text-muted-foreground">Define fund allocation and disclosure parameters</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Strategy Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Physical Gold Reserves"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="COMMODITY" className="bg-background text-foreground">Commodity</option>
                                    <option value="REAL_ESTATE" className="bg-background text-foreground">Real Estate</option>
                                    <option value="BUSINESS" className="bg-background text-foreground">Private Business</option>
                                    <option value="STARTUP" className="bg-background text-foreground">Startup Venture</option>
                                    <option value="LOCATION_BASED" className="bg-background text-foreground">Location Based</option>
                                    <option value="OTHER" className="bg-background text-foreground">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                                    placeholder="Describe the strategy logic and asset safety..."
                                />
                            </div>
                        </div>

                        {/* Financials & Logic */}
                        <div className="p-6 rounded-2xl bg-muted/20 border border-border space-y-6">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Financial Parameters & Disclosure Logic
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Internal Target ROI (%)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.internalROI}
                                        onChange={e => autoCalculateConservative(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Actual real-world target profit</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Disclosure Factor (0-1)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        value={formData.disclosureFactor}
                                        onChange={e => {
                                            const factor = Number(e.target.value);
                                            setFormData(prev => ({ ...prev, disclosureFactor: factor, conservativeROI: Math.floor(prev.internalROI * factor) }));
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Multiplier for user-visible ROI</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider">Displayed ROI (%)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.conservativeROI}
                                        onChange={e => setFormData({ ...formData, conservativeROI: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold focus:border-emerald-500/50 outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-emerald-600/50 dark:text-emerald-400/50 italic">Conservative ROI visible to users</p>
                                </div>
                            </div>
                        </div>

                        {/* Deployment Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Capital Deployed (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.totalCapitalDeployed}
                                    onChange={e => setFormData({ ...formData, totalCapitalDeployed: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lock-in (Months)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.lockInPeriod}
                                    onChange={e => setFormData({ ...formData, lockInPeriod: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Risk Level</label>
                                <select
                                    value={formData.riskLevel}
                                    onChange={e => setFormData({ ...formData, riskLevel: e.target.value as any })}
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="LOW" className="bg-background text-foreground">Low Risk</option>
                                    <option value="MEDIUM" className="bg-background text-foreground">Medium Risk</option>
                                    <option value="HIGH" className="bg-background text-foreground">High Risk</option>
                                </select>
                            </div>
                        </div>

                        {/* Allocation Breakdown */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Asset Allocation Breakdown
                                </h3>
                                <button
                                    type="button"
                                    onClick={addAllocation}
                                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 uppercase"
                                >
                                    <Plus className="w-3 h-3" /> Add Asset
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.allocation.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Asset Name (e.g. Residential)"
                                            value={item.asset}
                                            onChange={e => handleAllocationChange(idx, "asset", e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg bg-muted/30 border border-border text-sm text-foreground outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="%"
                                            value={item.percentage}
                                            onChange={e => handleAllocationChange(idx, "percentage", Number(e.target.value))}
                                            className="w-20 px-4 py-2 rounded-lg bg-muted/30 border border-border text-sm text-foreground outline-none"
                                        />
                                        <input
                                            type="color"
                                            value={item.color}
                                            onChange={e => handleAllocationChange(idx, "color", e.target.value)}
                                            className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeAllocation(idx)}
                                            className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="w-4 h-4" /> All changes will be reflected in user dashboard immediately.
                        </div>
                        <div className="flex items-center gap-4">
                            {initialData && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold transition-colors"
                                >
                                    Delete Strategy
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-muted-foreground hover:text-foreground font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> {initialData ? "Update Strategy" : "Create Strategy"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

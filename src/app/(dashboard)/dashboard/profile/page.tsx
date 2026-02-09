"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { User, Shield, CreditCard, Users, Download, Save, Loader2 } from "lucide-react";

import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [referralData, setReferralData] = useState<any>({ count: 0, referrals: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, refRes] = await Promise.all([
                    fetch("/api/user/profile"),
                    fetch("/api/user/referrals")
                ]);
                const profile = await profileRes.json();
                const referrals = await refRes.json();

                setUser(profile);
                setName(profile.name);
                setReferralData(referrals);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) toast.success("Profile Updated Successfully");
        } catch (error) {
            toast.error("Failed to update");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0B1120]">
            <Navbar />
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B1120] text-white">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-white">Account Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Navigation / Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/5 text-center shadow-xl">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-blue-500/20">
                                {user?.name?.[0]}
                            </div>
                            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
                            <div className="mt-4 inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase border border-emerald-500/20">
                                <Shield className="w-3 h-3 mr-1" />
                                {user?.kycStatus || "Verified"}
                            </div>
                        </div>

                        <div className="bg-[#1E293B] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                                <User className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                <span className="font-medium">Personal Details</span>
                            </div>
                            <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                                <Users className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                <span className="font-medium">Referral Network</span>
                            </div>
                            <div className="p-4 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                                <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                <span className="font-medium">Billing & Tax</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Details Form */}
                        <div className="bg-[#1E293B] p-8 rounded-2xl border border-white/5 shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <User className="w-5 h-5 text-blue-500" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-[#0B1120] text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                                    <input
                                        type="text"
                                        value={user?.email}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-[#0B1120]/50 text-slate-500 cursor-not-allowed"
                                        title="Email cannot be changed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={user?.phone || "+91"}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-[#0B1120]/50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Referral Network */}
                        <div className="bg-[#1E293B] p-8 rounded-2xl border border-white/5 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Users className="w-5 h-5 text-orange-500" />
                                    Referral Network
                                </h3>
                                <button className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors">
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg font-semibold">User</th>
                                            <th className="px-4 py-3 font-semibold">Joined</th>
                                            <th className="px-4 py-3 rounded-r-lg font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {referralData.referrals.map((ref: any) => (
                                            <tr key={ref._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{ref.name}</td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    {new Date(ref.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                                        {ref.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {referralData.referrals.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500 italic">
                                                    No referrals yet. Share your code!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { User, Shield, CreditCard, Users, Download, Save, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import AccountClosureModal from "@/components/profile/AccountClosureModal";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [referralData, setReferralData] = useState<any>({ count: 0, referrals: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [processingClosure, setProcessingClosure] = useState(false);

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

    const handleCancelClosure = async () => {
        if (!confirm("Are you sure you want to cancel your account closure request?")) return;
        setProcessingClosure(true);
        try {
            const res = await fetch("/api/user/cancel-closure", {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Closure request cancelled.");
                setUser({ ...user, closureStatus: "NONE" });
            } else {
                toast.error("Failed to cancel request.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setProcessingClosure(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-foreground">Account Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Navigation / Overview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-xl">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-blue-500/20">
                                {user?.name?.[0]}
                            </div>
                            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                            <p className="text-muted-foreground text-sm">{user?.email}</p>
                            <div className="mt-4 inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full text-xs font-bold uppercase border border-emerald-500/20">
                                <Shield className="w-3 h-3 mr-1" />
                                {user?.kycStatus || "Verified"}
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-border hover:bg-secondary/50 cursor-pointer flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                <User className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                <span className="font-medium">Personal Details</span>
                            </div>
                            <div className="p-4 border-b border-border hover:bg-secondary/50 cursor-pointer flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                <Users className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                <span className="font-medium">Referral Network</span>
                            </div>
                            <div className="p-4 hover:bg-secondary/50 cursor-pointer flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                <CreditCard className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                <span className="font-medium">Billing & Tax</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Details Form */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                                <User className="w-5 h-5 text-blue-500" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Email Address</label>
                                    <input
                                        type="text"
                                        value={user?.email}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                                        title="Email cannot be changed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={user?.phone || "+91"}
                                        disabled
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Referral Network */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <Users className="w-5 h-5 text-orange-500" />
                                    Referral Network
                                </h3>
                                <button className="text-sm text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer">
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg font-semibold">User</th>
                                            <th className="px-4 py-3 font-semibold">Joined</th>
                                            <th className="px-4 py-3 rounded-r-lg font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {referralData.referrals.map((ref: any) => (
                                            <tr key={ref._id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{ref.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {new Date(ref.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                                        {ref.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {referralData.referrals.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                                    No referrals yet. Share your code!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                                <Shield className="w-5 h-5 text-destructive" />
                                Account Control
                            </h3>

                            <div className={cn(
                                "flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-xl border transition-all",
                                user?.closureStatus === "REQUESTED"
                                    ? "bg-orange-500/10 border-orange-500/20"
                                    : "bg-destructive/5 border-destructive/20"
                            )}>
                                <div className="space-y-1">
                                    <h4 className={cn("text-base font-bold", user?.closureStatus === "REQUESTED" ? "text-orange-500" : "text-foreground")}>
                                        {user?.closureStatus === "REQUESTED" ? "Closure Request Pending" : "Close Account"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground max-w-lg">
                                        {user?.closureStatus === "REQUESTED"
                                            ? "Your request to close this account is currently under review. You can cancel this request at any time before approval."
                                            : "Permanently delete your account and remove access to your portfolio. This action is irreversible and requires admin approval."
                                        }
                                    </p>
                                </div>

                                {user?.closureStatus === "REQUESTED" ? (
                                    <button
                                        onClick={handleCancelClosure}
                                        disabled={processingClosure}
                                        className="whitespace-nowrap px-5 py-2.5 bg-background border border-border hover:bg-secondary text-foreground text-sm font-bold rounded-lg transition-all flex items-center gap-2"
                                    >
                                        {processingClosure && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Cancel Request
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsClosureModalOpen(true)}
                                        className="whitespace-nowrap px-5 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-bold rounded-lg transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
                                    >
                                        Close Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AccountClosureModal
                    isOpen={isClosureModalOpen}
                    onClose={() => setIsClosureModalOpen(false)}
                />
            </main>
        </div>
    );
}

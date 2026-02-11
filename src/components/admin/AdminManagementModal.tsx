
"use client";

import { useEffect, useState } from "react";
import { X, Search, ShieldCheck, UserPlus, Loader2, Key, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: "ADMIN";
    createdAt: string;
}

interface AdminManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminManagementModal({ isOpen, onClose }: AdminManagementModalProps) {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAdmins();
        }
    }, [isOpen]);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/admins");
            const data = await res.json();
            if (res.ok) {
                setAdmins(data.admins);
            }
        } catch (error) {
            console.error("Failed to load admins", error);
            toast.error("Failed to load admin list");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail || !newPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    password: newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Admin access granted successfully");
                setNewName("");
                setNewEmail("");
                setNewPassword("");
                setIsCreating(false);
                fetchAdmins(); // Refresh list
            } else {
                toast.error(data.error || "Failed to add admin");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveAdmin = async (adminId: string) => {
        if (!confirm("Are you sure you want to revoke admin access for this user? They will be downgraded to a regular user.")) return;

        try {
            const res = await fetch("/api/admin/admins", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Admin access revoked");
                fetchAdmins();
            } else {
                toast.error(data.error || "Failed to remove admin");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" /> Admin Access Control
                        </h2>
                        <p className="text-sm text-muted-foreground">Manage platform administrators and permissions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">

                    {/* Create New Admin Button / Form */}
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
                        >
                            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Grant New Admin Access</span>
                        </button>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-foreground">New Administrator Details</h3>
                                <button onClick={() => setIsCreating(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                            </div>

                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="e.g. Sarah Connor"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="admin@investhub.com"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase">Temporary Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="password"
                                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Grant Access
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Admin List */}
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Current Administrators</h3>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                                No administrators found (Wait, you are one?)
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {admins.map(admin => (
                                    <div key={admin._id} className="group p-4 bg-secondary/30 border border-border hover:border-primary/30 rounded-xl flex items-center justify-between transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">{admin.name}</h4>
                                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                    <ShieldCheck className="w-3 h-3" /> SUPER ADMIN
                                                </span>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Since {new Date(admin.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveAdmin(admin._id)}
                                                className="p-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                title="Revoke Admin Access"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}


"use client";

import { useEffect, useState } from "react";
import { X, Search, ShieldAlert, CheckCircle, Ban, Loader2, IndianRupee, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
    _id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "BLOCKED";
    joinedAt: string;
    investedAmount: number;
    walletBalance: number;
}

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // New User Creation State
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER"
    });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setIsAddingUser(false);
            setFormData({ name: "", email: "", password: "", role: "USER" });
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users/stats");
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);

        try {
            const res = await fetch("/api/admin/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("User created successfully!");
                setIsAddingUser(false);
                setFormData({ name: "", email: "", password: "", role: "USER" });
                fetchUsers(); // Refresh list
            } else {
                toast.error(data.message || "Failed to create user");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setCreatingUser(false);
        }
    };

    const handleBlockToggle = async (userId: string, currentStatus: string) => {
        const action = currentStatus === "ACTIVE" ? "BLOCK" : "UNBLOCK";
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        setProcessingId(userId);
        try {
            const res = await fetch("/api/admin/users/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action }),
            });

            if (res.ok) {
                toast.success(`User ${action === "BLOCK" ? "Blocked" : "Activated"}`);
                // Optimistic Update
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: action === "BLOCK" ? "BLOCKED" : "ACTIVE" } : u));
            } else {
                toast.error("Action failed");
            }
        } catch (error) {
            toast.error("Error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    const periodFilteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background border border-border w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-primary" /> User Command Center
                        </h2>
                        <p className="text-sm text-muted-foreground">View registered investors and manage access.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddingUser(!isAddingUser)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                                isAddingUser
                                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {isAddingUser ? <><X className="w-4 h-4" /> Cancel</> : <><UserPlus className="w-4 h-4" /> Add Partner</>}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-background">

                    {isAddingUser ? (
                        <div className="p-8 max-w-md mx-auto">
                            <h3 className="text-lg font-bold mb-6 text-foreground text-center">Create New Account</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">Role</label>
                                    <select
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="USER">User (Investor)</option>
                                        <option value="ADMIN">Admin (Partner)</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Admins have full access to this command center.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creatingUser}
                                    className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {creatingUser ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                                        </span>
                                    ) : "Create Account"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Filter Controls (Only show when list is visible) */}
                            <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="p-4 space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : periodFilteredUsers.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500">
                                        No users found.
                                    </div>
                                ) : (
                                    periodFilteredUsers.map(user => (
                                        <div key={user._id} className={cn(
                                            "p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all",
                                            user.status === 'BLOCKED' ? "bg-red-900/10 border-red-500/20 opacity-75" : "bg-[#1E293B] border-slate-700 hover:border-blue-500/30"
                                        )}>
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                                                    user.status === 'BLOCKED' ? "bg-destructive text-destructive-foreground" : "bg-primary/20 text-primary"
                                                )}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                                        {user.name}
                                                        {user.status === 'BLOCKED' && <span className="px-2 py-0.5 rounded text-[10px] bg-destructive text-destructive-foreground">BLOCKED</span>}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Invested</p>
                                                    <p className="text-sm font-mono font-bold text-accent-primary flex items-center justify-end gap-1">
                                                        <IndianRupee className="w-3 h-3" /> {user.investedAmount.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Joined</p>
                                                    <p className="text-xs text-foreground">
                                                        {new Date(user.joinedAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => handleBlockToggle(user._id, user.status)}
                                                    disabled={processingId === user._id}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors border",
                                                        user.status === 'ACTIVE'
                                                            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                                                            : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                                                    )}
                                                    title={user.status === 'ACTIVE' ? "Block User" : "Unblock User"}
                                                >
                                                    {processingId === user._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : user.status === 'ACTIVE' ? (
                                                        <Ban className="w-4 h-4" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

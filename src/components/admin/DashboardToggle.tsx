"use client";

import { useState } from "react";
import AdminDashboardView from "./AdminDashboardView";
import UserDashboardView from "@/components/dashboard/UserDashboardView";
import Navbar from "@/components/layout/Navbar";

interface DashboardToggleProps {
    adminStats: any;
    userData: any;
}

export default function DashboardToggle({ adminStats, userData }: DashboardToggleProps) {
    // Default to 'admin' view since we are on the admin page
    const [view, setView] = useState<"admin" | "user">("admin");

    return (
        <div className="min-h-screen bg-[#0B1120] text-white">
            <Navbar />

            {/* Toggle Switch */}
            <div className="container mx-auto px-4 py-8 flex justify-end">
                <div className="bg-[#1E293B] rounded-xl p-1 border border-white/10 flex items-center shadow-lg backdrop-blur-sm">
                    <button
                        onClick={() => setView("user")}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${view === "user"
                            ? "bg-[#06b6d4] text-white shadow-lg shadow-cyan-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        User View
                    </button>
                    <button
                        onClick={() => setView("admin")}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${view === "admin"
                            ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        Admin View
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {view === "admin" ? (
                <AdminDashboardView stats={adminStats} />
            ) : (
                <UserDashboardView data={userData} />
            )}
        </div>
    );
}

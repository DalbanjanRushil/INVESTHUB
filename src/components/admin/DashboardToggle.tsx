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
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />

            {/* Toggle Switch */}
            <div className="container mx-auto px-4 py-4 flex justify-end">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 border border-gray-200 dark:border-zinc-800 flex items-center shadow-sm">
                    <button
                        onClick={() => setView("user")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === "user"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        User View
                    </button>
                    <button
                        onClick={() => setView("admin")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === "admin"
                                ? "bg-red-600 text-white shadow-md"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

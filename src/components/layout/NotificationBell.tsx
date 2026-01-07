"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: NotificationItem) => !n.isRead).length);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Mark as read immediately on open
            try {
                await fetch("/api/notifications", { method: "PATCH" });
                setUnreadCount(0); // Optimistic update
                // Refetch to ensure sync
                setTimeout(fetchNotifications, 1000);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
                    <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        <h4 className="text-sm font-bold">Notifications</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n._id} className={`p-4 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white flex justify-between">
                                        {n.title}
                                        <span className="text-[10px] text-gray-400 font-normal">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {n.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

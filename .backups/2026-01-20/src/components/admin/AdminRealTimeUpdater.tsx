"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";

export default function AdminRealTimeUpdater() {
    const { socket, isConnected } = useSocket();
    const router = useRouter();

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Listener: Admin Withdrawal Updates
        const channel = "admin:withdrawals:update";

        socket.on(channel, (data: any) => {
            console.log("Admin Real-time update received:", data);
            // Trigger Server Component Refresh
            router.refresh();
        });

        return () => {
            socket.off(channel);
        };
    }, [socket, isConnected, router]);

    // This component renders nothing; it just listens
    return null;
}

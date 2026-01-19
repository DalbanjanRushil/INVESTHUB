"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function RealTimeUpdater() {
    const { socket, isConnected } = useSocket();
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Listener 1: Balance Updates
        // Specific to the logged-in user
        if (session?.user?.id) {
            const channel = `user:${session.user.id}:update`;

            socket.on(channel, (data: any) => {
                console.log("Real-time update received:", data);
                // Trigger Server Component Refresh
                const toastId = toast.loading("Updating live data...");
                router.refresh();

                // Dismiss after a short delay to simulate completion/ensure UI reflects
                setTimeout(() => toast.dismiss(toastId), 1500);
            });

            return () => {
                socket.off(channel);
            };
        }
    }, [socket, isConnected, session, router]);

    // This component renders nothing; it just listens
    return null;
}

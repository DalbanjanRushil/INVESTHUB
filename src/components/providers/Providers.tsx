"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function ThemeSync() {
    const pathname = usePathname();

    useEffect(() => {
        const root = document.documentElement;
        // Always enforce dark mode class for Tailwind dark: variants
        root.classList.add("dark");

        if (pathname?.startsWith("/admin")) {
            root.setAttribute("data-theme", "admin");
        } else {
            root.setAttribute("data-theme", "user");
        }
    }, [pathname]);

    return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeSync />
            <SocketProvider>
                {children}
            </SocketProvider>
        </SessionProvider>
    );
}

"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SocketProvider>
                    {children}
                </SocketProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}

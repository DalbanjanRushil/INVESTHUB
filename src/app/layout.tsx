import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import SessionGuard from "@/components/auth/SessionGuard";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "InvestHub | Academic Fintech Simulation",
  description: "A secure, academic simulation of a profit-sharing investment platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.variable,
        jetbrainsMono.variable,
        "antialiased min-h-screen bg-background text-foreground font-sans"
      )}>
        <Providers>
          <SessionGuard />
          {children}
          <Toaster position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}

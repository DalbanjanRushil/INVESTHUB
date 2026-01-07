import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContext from "@/components/providers/SessionProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={cn(inter.className, "antialiased min-h-screen bg-background text-foreground")}>
        <AuthContext>{children}</AuthContext>
      </body>
    </html>
  );
}

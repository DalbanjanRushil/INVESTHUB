"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle({
    isCollapsed = false,
    className
}: {
    isCollapsed?: boolean;
    className?: string;
}) {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className={cn("w-9 h-9", className)} /> // Placeholder size
        )
    }

    const isDark = resolvedTheme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative flex items-center justify-center rounded-xl transition-all duration-300 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isCollapsed ? "w-9 h-9" : "w-full px-3 py-2.5 gap-3 bg-secondary/30 border border-border/50",
                className
            )}
            title={isCollapsed ? (isDark ? "Switch to Light Mode" : "Switch to Dark Mode") : ""}
            aria-label="Toggle theme"
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-blue-400" />
            </div>

            {!isCollapsed && (
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    {isDark ? "Switch to Light" : "Switch to Dark"}
                </span>
            )}
        </button>
    )
}

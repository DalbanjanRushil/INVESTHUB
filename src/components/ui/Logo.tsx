import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    textClassName?: string;
}

export function Logo({ className, size = "md", showText = false, textClassName }: LogoProps) {
    const sizeClasses = {
        sm: "size-8 text-sm rounded-lg",
        md: "size-10 text-lg rounded-xl",
        lg: "size-12 text-xl rounded-xl",
        xl: "size-16 text-2xl rounded-2xl",
    };

    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            <div
                className={cn(
                    "bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20",
                    sizeClasses[size]
                )}
            >
                <span>IH</span>
            </div>
            {showText && (
                <div className="flex flex-col">
                    <span className={cn("font-bold leading-tight", textClassName || "text-foreground", size === 'sm' ? "text-sm" : "text-lg")}>InvestHub</span>
                    {size !== 'sm' && <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Wealth Management</span>}
                </div>
            )}
        </div>
    );
}

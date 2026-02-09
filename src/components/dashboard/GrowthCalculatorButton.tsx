"use client";

import { Calculator } from "lucide-react";
import { motion } from "framer-motion";

interface GrowthCalculatorButtonProps {
    onClick: () => void;
}

export default function GrowthCalculatorButton({ onClick }: GrowthCalculatorButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 hover:border-accent-primary/40 transition-all duration-300 shadow-lg hover:shadow-accent-primary/20 overflow-hidden"
        >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/10 to-accent-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"></div>

            <div className="relative z-10 flex items-center gap-2">
                <div className="p-1.5 bg-accent-primary/20 rounded-lg group-hover:bg-accent-primary/30 transition-colors">
                    <Calculator className="w-4 h-4 text-accent-primary group-hover:text-accent-primary/80 transition-colors" />
                </div>
                <span className="text-sm font-semibold text-accent-primary group-hover:text-accent-primary/80 transition-colors">
                    Projected Growth
                </span>
            </div>
        </motion.button>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import PublicGrowthCalculator from "./PublicGrowthCalculator";

export default function HeroActions() {
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <Link href="/register" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/40 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                    Start Simulation <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                    onClick={() => setIsCalculatorOpen(true)}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2"
                >
                    <Calculator className="w-5 h-5 text-emerald-400" />
                    Calculate Returns
                </button>
            </div>

            <PublicGrowthCalculator
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />
        </>
    );
}

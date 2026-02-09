"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Clock, ArrowRight } from "lucide-react";

interface LockInTimelineProps {
    months: number;
}

export default function LockInTimeline({ months }: LockInTimelineProps) {
    return (
        <div className="mt-8 border-t border-gray-100 dark:border-zinc-800 pt-8">
            <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                Capital Lock-in Period
            </h3>

            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full" />

                {/* Steps */}
                <div className="relative flex justify-between items-center z-10">
                    {/* Step 1: Investment */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border-2 border-blue-500 shadow-sm">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-gray-600 dark:text-gray-400">Day 1</p>
                        <p className="text-xs text-gray-400">Invested</p>
                    </div>

                    {/* Step 2: Growth Phase (Middle) */}
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center border border-gray-300 dark:border-zinc-600">
                            <span className="text-xs font-bold text-gray-500">...</span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-gray-500">Compounding</p>
                    </div>

                    {/* Step 3: Maturity */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center border-2 border-orange-500 shadow-sm">
                            <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-gray-600 dark:text-gray-400">{months} Months</p>
                        <p className="text-xs text-gray-400">Locked</p>
                    </div>

                    {/* Arrow Simulator */}
                    <div className="hidden md:flex text-gray-300">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    {/* Step 4: Release */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center border-2 border-green-500 shadow-lg">
                            <Unlock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-gray-600 dark:text-gray-400">Release</p>
                        <p className="text-xs text-gray-400">Withdraw / Re-invest</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                <div className="shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p>
                    Your capital is locked for a duration of <strong>{months} months</strong> to ensure funds are deployed into high-yield assets. Profits are distributed quarterly, but principal release occurs only after maturity.
                </p>
            </div>
        </div>
    );
}

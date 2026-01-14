"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

interface ReferralCardProps {
    referralCode: string;
    totalReferrals: number;
}

export default function ReferralCard({ referralCode, totalReferrals }: ReferralCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24" />
            </div>

            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">Refer & Earn</h3>
                    <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                        {totalReferrals} Friends Joined
                    </div>
                </div>
                <p className="text-sm text-purple-100 mb-4 pr-12">
                    Share your code and earn 1% instantly on every deposit.
                </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex items-center justify-between border border-white/20">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-purple-200">Your Code</span>
                    <span className="font-mono text-xl font-bold tracking-widest">{referralCode || "LOADING..."}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                    title="Copy Code"
                >
                    {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-white" />}
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Filter, Search, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import FeedCard from "./FeedCard";

export default function ContentFeed() {
    const [content, setContent] = useState<any[]>([]);
    const [filteredContent, setFilteredContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"ALL" | "VIDEO" | "CHART">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Add a way to manually trigger refresh

    useEffect(() => {
        // Add timestamp to prevent caching
        fetch(`/api/content?t=${Date.now()}`, { cache: "no-store", headers: { 'Pragma': 'no-cache' } })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setContent(data);
                    setFilteredContent(data);
                }
            })
            .catch((err) => console.error("Feed Load Error:", err))
            .finally(() => setLoading(false));
    }, [refreshTrigger]);

    // Filter Logic
    useEffect(() => {
        let result = content;
        if (activeTab !== "ALL") {
            result = result.filter(item => item.type === activeTab);
        }
        if (searchQuery) {
            result = result.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredContent(result);
    }, [activeTab, searchQuery, content]);

    // Listen for global refresh events (e.g. after upload)
    useEffect(() => {
        const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('content-uploaded', handleRefresh);
        return () => window.removeEventListener('content-uploaded', handleRefresh);
    }, []);

    const manualRefresh = () => {
        setLoading(true);
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="text-sm font-medium">Loading Market Intelligence...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2">
                    {["ALL", "VIDEO", "CHART"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === tab
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-blue-500/25"
                                    : "bg-white dark:bg-[#1F2937] text-muted-foreground border border-border hover:bg-muted"
                            )}
                        >
                            {tab === "ALL" ? "All Updates" : tab === "VIDEO" ? "Video Analysis" : "Charts"}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search updates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={manualRefresh}
                        className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition"
                        title="Refresh Feed"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {filteredContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContent.map((item) => (
                        <FeedCard key={item._id} item={item} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No updates found matching your criteria.</p>
                    <button onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }} className="mt-2 text-primary text-xs underline">
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}

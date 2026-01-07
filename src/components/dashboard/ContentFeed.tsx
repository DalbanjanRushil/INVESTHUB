"use client";

import { useEffect, useState } from "react";
import { PlayCircle, ImageIcon, FileText, Loader2 } from "lucide-react";

interface ContentItem {
    _id: string;
    title: string;
    type: "VIDEO" | "CHART" | "POST";
    url: string;
    description?: string;
    createdAt: string;
}

export default function ContentFeed() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/content")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setContent(data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    if (content.length === 0) return <div className="py-10 text-center text-gray-400 text-sm">No recent updates from Admin.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
                <div key={item._id} className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-lg transition">
                    {/* Media Preview */}
                    <div className="aspect-video bg-gray-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                        {item.type === "VIDEO" ? (
                            (item.url.includes("youtube") || item.url.includes("youtu.be")) ? (
                                <iframe
                                    src={(function () {
                                        try {
                                            const videoId = item.url.includes("youtu.be")
                                                ? item.url.split("youtu.be/")[1]?.split("?")[0]
                                                : item.url.split("v=")[1]?.split("&")[0];
                                            return `https://www.youtube.com/embed/${videoId || ""}`;
                                        } catch (e) { return item.url; }
                                    })()}
                                    className="w-full h-full pointer-events-none group-hover:pointer-events-auto"
                                    title={item.title}
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-cover"
                                    controls
                                />
                            )
                        ) : item.type === "CHART" || item.type === "POST" ? (
                            <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x225?text=Content+Unavailable")}
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <FileText className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-xs">Post Content</span>
                            </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase flex items-center gap-1">
                            {item.type === "VIDEO" && <PlayCircle className="w-3 h-3" />}
                            {item.type === "CHART" && <ImageIcon className="w-3 h-3" />}
                            {item.type}
                        </div>
                    </div>

                    <div className="p-4">
                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1" title={item.title}>{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

"use client";

import { useState } from "react";
import { Play, Image as ImageIcon, Heart, MessageCircle, Share2, Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Comment {
    _id?: string;
    text: string;
    createdAt: string;
    user: {
        _id?: string;
        name: string;
    } | string; // string fallback for old data
}

interface FeedItem {
    _id: string;
    title: string;
    type: "VIDEO" | "CHART" | "POST";
    url: string;
    description?: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    comments: Comment[];
}

export default function FeedCard({ item }: { item: FeedItem }) {
    const { data: session } = useSession();
    const [likes, setLikes] = useState(item.likesCount);
    const [isLiked, setIsLiked] = useState(item.isLiked);
    const [comments, setComments] = useState<Comment[]>(item.comments || []);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false); // For video overlay

    // --- Like Handler ---
    const handleLike = async () => {
        // Optimistic UI
        const previousLiked = isLiked;
        const previousCount = likes;
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);

        try {
            await fetch(`/api/content/${item._id}/like`, { method: "POST" });
        } catch (error) {
            // Revert on failure
            setIsLiked(previousLiked);
            setLikes(previousCount);
        }
    };

    // --- Delete Handler ---
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this content?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/content/${item._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Content deleted");
            // Trigger refresh in parent
            window.dispatchEvent(new Event('content-uploaded'));
        } catch (error) {
            toast.error("Failed to delete content");
            setIsDeleting(false);
        }
    };

    // --- Comment Handler ---
    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/content/${item._id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newComment }),
            });
            const data = await res.json();
            if (res.ok) {
                // Ensure the new comment has the correct structure for display
                const addedComment = {
                    ...data.comment,
                    user: data.comment.user || { name: "Me" }
                };
                setComments(prev => [...prev, addedComment]);
                setNewComment("");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingComment(false);
        }
    };

    // --- Video Logic ---
    const getVideoId = (url: string) => {
        try {
            if (url.includes("youtu.be")) return url.split("youtu.be/")[1]?.split("?")[0];
            if (url.includes("v=")) return url.split("v=")[1]?.split("&")[0];
            if (url.includes("embed/")) return url.split("embed/")[1]?.split("?")[0];
            return null;
        } catch { return null; }
    };

    const isVideo = item.type === "VIDEO";
    const videoId = isVideo ? getVideoId(item.url) : null;
    const thumbnailUrl = isVideo && videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` // better quality
        : item.url;

    return (
        <div className={cn(
            "bg-card dark:bg-[#1F2937] border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full",
            isDeleting && "opacity-50 pointer-events-none grayscale"
        )}>
            {/* Media Area */}
            <div className="relative aspect-video bg-black/5 dark:bg-black/40 group overflow-hidden">
                {isVideo && isPlaying && videoId ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                ) : (
                    <>
                        <img
                            src={thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                                // Fallback to chart/post placeholder if generic image fails
                                e.currentTarget.src = "https://placehold.co/600x400/1e293b/FFFFFF?text=Media+Preview";
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                        {/* Play Button Overlay */}
                        {isVideo && (
                            <button
                                onClick={() => setIsPlaying(true)}
                                className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                            >
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-xl">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-inner">
                                        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                                    </div>
                                </div>
                            </button>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded border border-white/10 flex items-center gap-1.5 text-white/90">
                            {isVideo ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.type}</span>
                        </div>

                        {/* Admin Delete Button (Top Right Overlay) */}
                        {session?.user?.role === "ADMIN" && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-all shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                title="Delete Content"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Content Body */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg leading-tight mb-2 line-clamp-2" title={item.title}>
                        {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 md:line-clamp-3 mb-4">
                        {item.description || "No description provided."}
                    </p>
                </div>

                {/* Interactions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-red-500",
                                isLiked ? "text-red-500" : "text-muted-foreground"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                            {likes}
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-blue-500 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {comments.length}
                        </button>
                    </div>

                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Comments Section (Collapsible) */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                        {/* Comment List */}
                        <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-3 mb-3 pr-1">
                            {comments.length > 0 ? (
                                comments.map((c, i) => (
                                    <div key={i} className="flex gap-2 text-sm group">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                            {typeof c.user === 'object' ? c.user?.name?.[0] : "?"}
                                        </div>
                                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-r-lg rounded-bl-lg">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-xs">
                                                    {typeof c.user === 'object' ? c.user?.name : "User"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-900 dark:text-slate-100 leading-snug">{c.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">No comments yet. Be the first!</p>
                            )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleComment} className="relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full pl-3 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !newComment.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-primary/10 rounded-md transition disabled:opacity-50"
                            >
                                {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Loader2, UploadCloud, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

export default function ContentUploadForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadMode, setUploadMode] = useState<"FILE" | "URL">("URL");
    const [file, setFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        title: "",
        type: "VIDEO", // Default
        url: "",
        description: "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadAndSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalUrl = form.url;

            // 1. If File Mode, Upload File First
            if (uploadMode === "FILE" && file) {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch("/api/content/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("File upload failed");
                const uploadData = await uploadRes.json();
                finalUrl = uploadData.url;
            }

            // 2. Save Content Record
            const res = await fetch("/api/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, url: finalUrl }),
            });

            if (!res.ok) {
                throw new Error("Failed to save content");
            }

            // Success Actions
            toast.success("Content uploaded successfully!");
            setForm({ title: "", type: "VIDEO", url: "", description: "" });
            setFile(null);

            // Dispatch event to update feeds on the same page
            window.dispatchEvent(new Event('content-uploaded'));

            // Refresh Server Components if needed (though Feed is client-side now)
            router.refresh();

        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 max-h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                Upload Content
            </h3>

            <form onSubmit={handleUploadAndSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Title</label>
                    <input
                        required
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Market Analysis 2024"
                        value={form.title || ""}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Type</label>
                    <div className="flex gap-2">
                        {["VIDEO", "CHART", "POST"].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setForm({ ...form, type: t });
                                    // Auto-switch mode based on type
                                    if (t === "VIDEO") setUploadMode("URL");
                                    else setUploadMode("FILE");
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${form.type === t
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold uppercase text-gray-500 block">Source</label>
                        <div className="flex gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => setUploadMode("URL")}
                                className={`font-medium ${uploadMode === "URL" ? "text-blue-600 underline" : "text-gray-400"}`}
                            >
                                URL
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={() => setUploadMode("FILE")}
                                className={`font-medium ${uploadMode === "FILE" ? "text-blue-600 underline" : "text-gray-400"}`}
                            >
                                File Upload
                            </button>
                        </div>
                    </div>

                    {uploadMode === "URL" ? (
                        <div className="relative" key="url-mode">
                            <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                required={uploadMode === "URL"}
                                type="url"
                                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={form.type === "VIDEO" ? "https://youtube.com/..." : "https://image.url/..."}
                                value={form.url || ""}
                                onChange={(e) => setForm({ ...form, url: e.target.value })}
                            />
                        </div>
                    ) : (
                        <div className="relative" key="file-mode">
                            <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                required={uploadMode === "FILE"}
                                type="file"
                                accept="image/*,video/*"
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex justify-center shadow-lg shadow-blue-600/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Content"}
                </button>
            </form>
        </div>
    );
}

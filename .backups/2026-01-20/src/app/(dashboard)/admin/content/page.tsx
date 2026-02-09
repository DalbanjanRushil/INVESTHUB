import ContentUploadForm from "@/components/forms/ContentUploadForm";
import ContentFeed from "@/components/dashboard/ContentFeed"; // Reusing feed to show preview? Or maybe just list
// Actually simpler to just have upload form and maybe a list of uploads if we improved it.
// For now, focusing on the Upload Form as the primary "Studio" tool.
import { FileText } from "lucide-react";

export default function AdminContentPage() {
    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-pink-500/10 rounded-xl text-pink-600 dark:text-pink-400">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Studio</h1>
                    <p className="text-muted-foreground">Publish market updates, charts, and videos to the user feed.</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <ContentUploadForm />
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Live Feed Preview</h2>
                <div className="opacity-75 pointer-events-none scale-95 origin-top-left">
                    <ContentFeed />
                </div>
            </div>
        </div>
    );
}

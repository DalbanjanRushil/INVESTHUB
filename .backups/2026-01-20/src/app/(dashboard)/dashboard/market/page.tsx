import ContentFeed from "@/components/dashboard/ContentFeed";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MarketFeedPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Intelligence</h1>
                    <p className="text-muted-foreground">Latest updates, technical analysis, and CEO broadcasts.</p>
                </div>
            </div>
            <ContentFeed />
        </div>
    );
}

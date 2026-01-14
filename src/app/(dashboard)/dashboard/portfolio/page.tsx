import InvestmentModule from "@/components/investments/InvestmentModule";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PortfolioPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Portfolio</h1>
            <p className="text-muted-foreground">Detailed breakdown of your asset allocation and performance.</p>
            <InvestmentModule />
        </div>
    );
}

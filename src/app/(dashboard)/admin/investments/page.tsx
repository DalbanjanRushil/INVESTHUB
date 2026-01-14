import StrategyManager from "@/components/admin/StrategyManager";
import { Activity } from "lucide-react";

export default function AdminInvestmentsPage() {
    return (
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Strategy Manager</h1>
                    <p className="text-muted-foreground">Update ROI performance, asset allocation, and lock-in periods.</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <StrategyManager />
            </div>
        </div>
    );
}

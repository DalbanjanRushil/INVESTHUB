import AdminDashboardView from "./AdminDashboardView";

interface DashboardToggleProps {
    adminStats: any;
}

export default function DashboardToggle({ adminStats }: DashboardToggleProps) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Content Area */}
            <AdminDashboardView stats={adminStats} />
        </div>
    );
}

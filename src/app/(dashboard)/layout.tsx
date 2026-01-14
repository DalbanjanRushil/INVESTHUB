import SidebarLayout from "@/components/layout/SidebarLayout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarLayout>
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                {children}
            </div>
        </SidebarLayout>
    );
}

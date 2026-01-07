import Navbar from "@/components/layout/Navbar";
import ProfitDistributionForm from "@/components/forms/ProfitDistributionForm";
import SettlementForm from "@/components/forms/SettlementForm";
import WithdrawalTable from "@/components/admin/WithdrawalTable";
import ContentUploadForm from "@/components/forms/ContentUploadForm";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getAdminStats() {
    await connectToDatabase();

    const [userCount, poolData, pendingWithdrawals, pendingWithdrawalsList] = await Promise.all([
        User.countDocuments({ role: UserRole.USER }),
        Wallet.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
        Withdrawal.countDocuments({ status: WithdrawalStatus.PENDING }),
        // Fetch actual data for the table, populated with user details
        Withdrawal.find({ status: WithdrawalStatus.PENDING })
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    return {
        userCount,
        poolCapital: poolData[0]?.total || 0,
        pendingWithdrawals,
        pendingWithdrawalsList: JSON.parse(JSON.stringify(pendingWithdrawalsList)), // Serialize for client
    };
}

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const stats = await getAdminStats();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        Admin Area
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-2">Total Investors</h3>
                        <p className="text-3xl font-bold tracking-tight">{stats.userCount}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-2">Pool Capital</h3>
                        <p className="text-3xl font-bold tracking-tight text-blue-600">
                            ₹{stats.poolCapital.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-2">Pending Withdrawals</h3>
                        <p className="text-3xl font-bold tracking-tight text-orange-500">{stats.pendingWithdrawals}</p>
                    </div>

                    <div className="hidden md:block"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Management Tools */}
                    <div className="md:col-span-1 space-y-6">
                        <ProfitDistributionForm />
                        <SettlementForm />
                        <ContentUploadForm />
                    </div>

                    {/* Right Column: Tables (Pending Withdrawals) */}
                    <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6">
                        <h3 className="text-xl font-bold mb-4">Pending Withdrawals</h3>
                        <WithdrawalTable data={stats.pendingWithdrawalsList} />
                    </div>
                </div>
            </main>
        </div>
    );
}

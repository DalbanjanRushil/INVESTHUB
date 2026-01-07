import Navbar from "@/components/layout/Navbar";
import DepositForm from "@/components/forms/DepositForm";
import WithdrawForm from "@/components/forms/WithdrawForm";
import ContentFeed from "@/components/dashboard/ContentFeed";
import connectToDatabase from "@/lib/db";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getData() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await connectToDatabase();
    const [wallet, transactions] = await Promise.all([
        Wallet.findOne({ userId: session.user.id }),
        Transaction.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return { wallet, transactions };
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const data = await getData();
    const wallet = data?.wallet;
    const transactions = data?.transactions;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Balance Card */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="text-gray-500 font-medium mb-2">Total Balance</h3>
                        <p className="text-4xl font-bold tracking-tight text-blue-600">
                            ₹{(wallet?.balance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Available for withdrawal</p>
                    </div>

                    {/* Profit Card */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-2">Total Profit Earned</h3>
                        <p className="text-4xl font-bold tracking-tight text-green-500">
                            +₹{(wallet?.totalProfit || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Lifetime earnings</p>
                    </div>

                    {/* Deposit Form */}
                    <DepositForm />

                    {/* Withdraw Form */}
                    <WithdrawForm />
                </div>

                {/* Content Feed Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Market Insights & Updates</h2>
                    <ContentFeed />
                </div>

                {/* Recent Transactions Placeholder */}
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                    {transactions && transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b dark:border-zinc-800 text-gray-500">
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Type</th>
                                        <th className="pb-3 font-medium">Description</th>
                                        <th className="pb-3 font-medium text-right">Amount</th>
                                        <th className="pb-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-zinc-800">
                                    {transactions.map((t: any) => (
                                        <tr key={t._id} className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                                            <td className="py-3 text-gray-500">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 font-medium">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${t.type === "DEPOSIT"
                                                        ? "bg-green-100 text-green-700"
                                                        : t.type === "PROFIT"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-orange-100 text-orange-700"
                                                        }`}
                                                >
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate" title={t.description}>
                                                {t.description || "-"}
                                            </td>
                                            <td
                                                className={`py-3 text-right font-bold ${t.type === "DEPOSIT" || t.type === "PROFIT"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                {t.type === "DEPOSIT" || t.type === "PROFIT" ? "+" : "-"}₹
                                                {t.amount.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className={`text-xs uppercase font-bold ${t.status === 'SUCCESS' ? 'text-green-500' : 'text-orange-500'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            No transactions found. Start by adding funds!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

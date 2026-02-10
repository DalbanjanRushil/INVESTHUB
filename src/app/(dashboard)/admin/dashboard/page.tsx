import DashboardToggle from "@/components/admin/DashboardToggle";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Investment from "@/models/Investment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

async function getAdminStats() {
    await connectToDatabase();

    const [userCount, walletLiquidData, pendingWithdrawals, pendingWithdrawalsList, poolBreakdown] = await Promise.all([
        User.countDocuments({ role: UserRole.USER }),
        Wallet.aggregate([{
            $project: {
                liquidBalance: {
                    $add: [
                        { $ifNull: ["$profit", 0] },
                        { $ifNull: ["$referral", 0] }
                    ]
                }
            }
        }, {
            $group: {
                _id: null,
                total: { $sum: "$liquidBalance" }
            }
        }]),
        Withdrawal.countDocuments({ status: WithdrawalStatus.PENDING }),
        Withdrawal.find({ status: WithdrawalStatus.PENDING })
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean(),
        Investment.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$plan", total: { $sum: "$amount" } } }
        ]),
    ]);

    const pools = {
        FLEXI: 0,
        FIXED_3M: 0,
        FIXED_6M: 0,
        FIXED_1Y: 0
    };

    let totalInvested = 0;

    // Map aggregation results to pools object, handling dynamic keys
    const poolDataArray = poolBreakdown as any[];
    poolDataArray.forEach(p => {
        if (pools.hasOwnProperty(p._id)) {
            (pools as any)[p._id] = p.total;
        }
        totalInvested += p.total;
    });

    // Total Pool = Liquid (Wallet) + Invested (Investments)
    // We trust Investment collection for 'Locked' value, not Wallet.locked
    const totalLiquid = walletLiquidData[0]?.total || 0;
    const poolCapital = totalLiquid + totalInvested;

    return {
        userCount,
        poolCapital,
        pendingWithdrawals,
        pendingWithdrawalsList: JSON.parse(JSON.stringify(pendingWithdrawalsList)),
        pools,
    };
}



export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const adminStats = await getAdminStats();

    return (
        <DashboardToggle adminStats={adminStats} />
    );
}

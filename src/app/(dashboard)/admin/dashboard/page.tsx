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

    const [userCount, poolData, pendingWithdrawals, pendingWithdrawalsList] = await Promise.all([
        User.countDocuments({ role: UserRole.USER }),
        Wallet.aggregate([{
            $project: {
                docBalance: {
                    $add: [
                        { $ifNull: ["$principal", 0] },
                        { $ifNull: ["$profit", 0] },
                        { $ifNull: ["$referral", 0] },
                        { $ifNull: ["$locked", 0] }
                    ]
                }
            }
        }, {
            $group: {
                _id: null,
                total: { $sum: "$docBalance" }
            }
        }]),
        Withdrawal.countDocuments({ status: WithdrawalStatus.PENDING }),
        Withdrawal.find({ status: WithdrawalStatus.PENDING })
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    return {
        userCount,
        poolCapital: poolData[0]?.total || 0,
        pendingWithdrawals,
        pendingWithdrawalsList: JSON.parse(JSON.stringify(pendingWithdrawalsList)),
    };
}

async function getUserData(userIdStr: string) {
    await connectToDatabase();
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const [wallet, transactions, user, totalReferrals, activeInvestments] = await Promise.all([
        Wallet.findOne({ userId }),
        Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
        User.findById(userId),
        User.countDocuments({ referredBy: userId }),
        Investment.find({ userId, isActive: true }).lean(),
    ]);

    // Self-Healing & Migration for Admin View
    if (wallet) {
        let isModified = false;
        if ((!wallet.principal || wallet.principal === 0) && (wallet.balance && wallet.balance > 0)) {
            wallet.principal = wallet.balance;
            wallet.balance = 0;
            isModified = true;
        }
        if (wallet.principal === undefined) { wallet.principal = 0; isModified = true; }
        if (wallet.profit === undefined) { wallet.profit = 0; isModified = true; }
        if (wallet.referral === undefined) { wallet.referral = 0; isModified = true; }
        if (wallet.locked === undefined) { wallet.locked = 0; isModified = true; }

        if (activeInvestments && activeInvestments.length > 0) {
            const realLocked = activeInvestments
                .filter((inv: any) => inv.plan !== 'FLEXI')
                .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
            if ((wallet.locked || 0) < realLocked) {
                wallet.locked = realLocked;
                isModified = true;
            }
            const realFlexi = activeInvestments
                .filter((inv: any) => inv.plan === 'FLEXI')
                .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
            if ((wallet.principal || 0) < realFlexi) {
                wallet.principal = realFlexi;
                isModified = true;
            }
        }
        if (isModified) await wallet.save();
    }

    if (user && !user.referralCode) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        user.referralCode = `INVEST-HUB-${randomSuffix}`;
        await user.save();
    }

    return {
        wallet: wallet ? JSON.parse(JSON.stringify(wallet)) : null,
        transactions: JSON.parse(JSON.stringify(transactions)),
        user: user ? JSON.parse(JSON.stringify(user)) : null,
        totalReferrals
    };
}

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const [adminStats, userData] = await Promise.all([
        getAdminStats(),
        getUserData(session.user.id)
    ]);

    return (
        <DashboardToggle adminStats={adminStats} userData={userData} />
    );
}

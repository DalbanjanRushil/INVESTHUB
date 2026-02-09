import UserDashboardView from "@/components/dashboard/UserDashboardView";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Wallet from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import Investment from "@/models/Investment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

async function getData() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    await connectToDatabase();

    // Convert session ID to ObjectId for robust querying
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Fetch All Related Data
    const [wallet, transactions, user, totalReferrals, allInvestments] = await Promise.all([
        Wallet.findOne({ userId }),
        Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
        User.findById(userId),
        User.countDocuments({ referredBy: userId }),
        Investment.find({ userId }).lean(), // Find ALL investments to be sure
    ]);

    console.log(`[DashboardPage] Fetched ${transactions.length} transactions for User ${userId}`);
    if (transactions.length > 0) {
        console.log(`[DashboardPage] Most recent: ${transactions[0]._id} @ ${transactions[0].createdAt}`);
    }

    console.log(`\n--- FINANCIAL AUDIT FOR ${user?.email} ---`);
    console.log(`1. User ID in session: ${session.user.id}`);
    console.log(`2. Wallet Found: ${wallet ? "YES" : "NO"}`);
    if (wallet) {
        console.log(`   - Principal: ${wallet.principal}, Locked: ${wallet.locked}, Legacy Bal: ${wallet.balance}`);
    }
    console.log(`3. Total Investments in DB: ${allInvestments.length}`);

    // 2. SELF-HEALING: If ledger says X but wallet says Y, fix it now.
    if (wallet) {
        let needsUpdate = false;

        // Sum from Ledger
        const ledgerPrincipal = allInvestments.filter(i => i.plan === 'FLEXI' && i.isActive).reduce((s, i) => s + i.amount, 0);
        const ledgerLocked = allInvestments.filter(i => i.plan !== 'FLEXI' && i.isActive).reduce((s, i) => s + i.amount, 0);

        if (wallet.principal < ledgerPrincipal) {
            console.log(`[FIX] Principal desync: ${wallet.principal} -> ${ledgerPrincipal}`);
            wallet.principal = ledgerPrincipal;
            needsUpdate = true;
        }
        if (wallet.locked < ledgerLocked) {
            console.log(`[FIX] Locked desync: ${wallet.locked} -> ${ledgerLocked}`);
            wallet.locked = ledgerLocked;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await wallet.save();
            console.log(`[FIX] Wallet successfully synchronized with Investment Ledger.`);
        }
    }

    return {
        wallet: wallet ? JSON.parse(JSON.stringify(wallet.toObject())) : null,
        transactions: JSON.parse(JSON.stringify(transactions)),
        user: user ? JSON.parse(JSON.stringify(user.toObject())) : null,
        totalReferrals
    };
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const data = await getData();
    if (!data) return <div className="p-8 text-center text-red-500 font-bold bg-[#0F172A] min-h-screen">Data Integrity Error: User has no wallet session.</div>;

    return <UserDashboardView data={data} />;
}

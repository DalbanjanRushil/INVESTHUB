
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import { LedgerService } from "@/lib/services/LedgerService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settlementSchema = z.object({
    minBalance: z.number().min(0),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { minBalance } = settlementSchema.parse(body);

        await connectToDatabase();

        // 1. Fetch ALL wallets
        // We use cursor or simple find. For large datasets, cursor is better, but here we keep it simple as per legacy.
        const wallets = await Wallet.find({}).populate("userId", "name email");

        if (wallets.length === 0) {
            return NextResponse.json({
                message: "No wallets found.",
                stats: { count: 0, totalAmount: 0 }
            });
        }

        let totalSettledAmount = 0;
        let settledCount = 0;

        console.log(`[Settlement] STARTING (Ledger Mode). Min Balance to Keep: ${minBalance}`);

        for (const wallet of wallets) {
            const user = wallet.userId as any;
            if (!user || !user._id) continue;

            const userId = user._id.toString();

            try {
                // 1. Calculate Current Liquid Balance
                // We let LedgerService checks handle the exact balance, but we need to estimate 'Excess' to know how much to request.
                // Note: LedgerService 'requestWithdrawal' uses internal logic to find balance.
                // But we need to know how much to ASK for.

                const currentPrincipal = wallet.principal || 0;
                const currentProfit = wallet.profit || 0;
                const currentReferral = wallet.referral || 0;

                const totalLiquidAssets = currentPrincipal + currentProfit + currentReferral;
                const excessFunds = totalLiquidAssets - minBalance;

                if (excessFunds < 1) continue;

                // 2. Perform Withdrawal Request via Ledger
                // This atomic operation:
                // - Checks real balance again
                // - Deducts logic (Waterfall)
                // - Locks funds
                // - Creates Transaction

                // NO TAX/PENALTY applied here. exact excessFunds amount.

                const txn = await LedgerService.requestWithdrawal(userId, excessFunds);

                // 3. Update Description to indicate Settlement
                // We update the underlying transaction description for clarity
                txn.description = "Quarterly Settlement Sweep";
                await txn.save();

                // 4. Create Withdrawal Request Record (linked to txn)
                // LedgerService.requestWithdrawal returns the Transaction.
                // We need to create the Withdrawal Request document that Admin sees in Dashboard.
                // Actually, requestWithdrawal in 'withdraw/route.ts' CREATED the withdrawal doc.
                // But LedgerService.requestWithdrawal DOES NOT create the 'Withdrawal' Mongoose Document.
                // It only does Ledger Entries and Transaction Record.
                // So we must create the Withdrawal Document here.

                const withdrawal = await Withdrawal.create({
                    userId: userId,
                    amount: excessFunds,
                    status: WithdrawalStatus.PENDING,
                    adminRemark: `Quarterly Settlement Sweep`,
                });

                // Link Transaction to Withdrawal
                txn.referenceId = withdrawal._id;
                txn.referenceType = "WITHDRAWAL";
                await txn.save();

                totalSettledAmount += excessFunds;
                settledCount++;

                console.log(`[Settlement] User ${user.email} | Swept: ${excessFunds}`);

            } catch (err: any) {
                console.error(`[Settlement] Failed for user ${user.email}:`, err.message);
                // Continue to next user
            }
        }

        return NextResponse.json({
            message: "Settlement processing complete",
            stats: {
                count: settledCount,
                totalAmount: Number(totalSettledAmount.toFixed(2))
            }
        });

    } catch (error: any) {
        console.error("Settlement Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Investment, { LockPlan } from "@/models/Investment";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import { LedgerService } from "@/lib/services/LedgerService";
import { TransactionType } from "@/models/Transaction";
import { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const now = new Date();
        console.log(`[Maturity Cron] Running check at ${now.toISOString()}`);

        const matureInvestments = await Investment.find({
            plan: { $ne: LockPlan.FLEXI },
            isActive: true,
            maturityDate: { $lte: now }
        }).populate("userId");

        console.log(`[Maturity Cron] Found ${matureInvestments.length} matured investments.`);

        if (matureInvestments.length === 0) {
            return NextResponse.json({ message: "No investments to mature." }, { status: 200 });
        }

        const stats = { processed: 0, errors: 0 };

        for (const inv of matureInvestments) {
            try {
                const user = inv.userId as any;
                const userId = user._id.toString();
                const amount = inv.amount;

                console.log(`[Maturity Cron] Processing User ${userId} - Amount: ${amount}`);

                // 1. Ledger Move: LOCKED -> PRINCIPAL
                const transaction = await LedgerService.recordTransaction({
                    userId: userId,
                    type: TransactionType.ADJUSTMENT, // Or specific type if added
                    amount: amount,
                    netAmount: amount,
                    referenceType: LedgerReferenceType.INVESTMENT_LOCK, // Or new MATURITY Type
                    // Actually, we are UNLOCKING. So Reference: INVESTMENT_LOCK works contextually as "Releasing Lock"
                    // Or ideally add MATURITY to enum. Using ADJUSTMENT or DEPOSIT-like flow.
                    description: `Investment Matured (${inv.plan}) - Rolled to Flexi`,
                    movements: [
                        {
                            accountType: LedgerAccountType.LOCKED,
                            direction: LedgerDirection.DEBIT, // Debit Locked (reduce liability there)
                            amount: amount,
                            userId: userId
                        },
                        {
                            accountType: LedgerAccountType.PRINCIPAL,
                            direction: LedgerDirection.CREDIT, // Credit Principal (increase liability there)
                            amount: amount,
                            userId: userId
                        }
                    ]
                });

                // 2. Close Old Investment
                inv.isActive = false;
                await inv.save();

                await InvestmentLedger.create({
                    investmentId: inv._id,
                    userId: userId,
                    action: InvestmentAction.MATURITY,
                    amountChange: -amount, // Balance goes to 0
                    balanceAfter: 0,
                    description: "Matured and Rolled Over",
                    transactionId: transaction._id
                });

                // 3. Create New FLEXI Investment (Rollover)
                const newInv = await Investment.create({
                    userId: userId,
                    amount: amount,
                    plan: LockPlan.FLEXI,
                    startDate: now,
                    isActive: true,
                    sourceDepositId: inv.sourceDepositId
                });

                await InvestmentLedger.create({
                    investmentId: newInv._id,
                    userId: userId,
                    action: InvestmentAction.CREATION, // Created via Rollover
                    amountChange: amount,
                    balanceAfter: amount,
                    description: "Rollover from Matured Investment",
                    transactionId: transaction._id
                });

                // 4. Notify User
                await Notification.create({
                    userId: userId,
                    title: "Investment Matured",
                    message: `Your ${inv.plan} investment of ₹${amount} has matured and moved to Flexi plan.`,
                    isRead: false
                });

                stats.processed++;

            } catch (err) {
                console.error(`[Maturity Cron] Error processing inv ${inv._id}:`, err);
                stats.errors++;
            }
        }

        return NextResponse.json({ message: "Maturity check complete", stats }, { status: 200 });

    } catch (error: any) {
        console.error("Maturity Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

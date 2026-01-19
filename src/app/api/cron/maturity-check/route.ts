
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Investment, { LockPlan } from "@/models/Investment";
import Wallet from "@/models/Wallet";
import Transaction, { TransactionType } from "@/models/Transaction";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Basic Security: Allow only if a specific header or secret is present (Optional for now)
    // const authHeader = req.headers.get("x-cron-auth");
    // if (authHeader !== process.env.CRON_SECRET) return NextResponse.json({error: "Unauthorized"}, {status: 401});

    try {
        await connectToDatabase();
        const now = new Date();
        console.log(`[Maturity Cron] Running check at ${now.toISOString()}`);

        // 1. Find Mature Investments
        // Criteria: Plan is NOT Flexi, Is Active, and MaturityDate < Now
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
                // A. Calculate ROI (Simple 5% Flat Bonus for completing tenure? Or just unlock principal?)
                // For now: Just UNLOCK the principal. Profit is distributed monthly anyway.
                // Assuming "Profit" was already paid out monthly via the distribute-profit route.
                // So "Maturity" just means moving Principal from "Locked" back to "Principal" (Flexi) or "Balance".
                // Let's move it to "Principal" (Flexi) so it keeps earning standard rate, unless user wants payout.
                // Design Decision: Convert to FLEXI.

                const user = inv.userId as any;
                console.log(`[Maturity Cron] Processing User ${user._id} - Amount: ${inv.amount}`);

                // B. Update Investment Status
                inv.isActive = false; // Mark this fixed plan as done
                await inv.save();

                // C. Create New FLEXI Investment (Rollover)
                await Investment.create({
                    userId: user._id,
                    amount: inv.amount,
                    plan: LockPlan.FLEXI,
                    startDate: now,
                    isActive: true, // It's now active as Flexi
                    sourceDepositId: inv.sourceDepositId
                });

                // D. Update Wallet (Move from Locked -> Principal)
                await Wallet.findOneAndUpdate(
                    { userId: user._id },
                    {
                        $inc: {
                            locked: -inv.amount,
                            principal: inv.amount
                        }
                    }
                );

                // E. Log Transaction
                await Transaction.create({
                    userId: user._id,
                    type: TransactionType.PROFIT, // Or a new type "MATURITY"? Let's stick to informational or just skip tx if it's internal move.
                    // Actually, users need to know.
                    amount: inv.amount,
                    status: "SUCCESS",
                    description: `Investment Matured (${inv.plan}) - Rolled over to Flexi`,
                    createdAt: now
                });

                // F. Notify User
                await Notification.create({
                    userId: user._id,
                    title: "Investment Matured",
                    message: `Your ${inv.plan} investment of ₹${inv.amount} has matured and moved to Flexi plan.`,
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

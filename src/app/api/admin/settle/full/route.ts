
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Withdrawal, { WithdrawalStatus } from "@/models/Withdrawal";
import Transaction, { TransactionType } from "@/models/Transaction";
import Investment from "@/models/Investment";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import { LedgerService } from "@/lib/services/LedgerService";
import { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import { z } from "zod";
import mongoose from "mongoose";

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

        // 1. Fetch ALL wallets & Investments
        const wallets = await Wallet.find({}).populate("userId", "name email");

        if (wallets.length === 0) {
            return NextResponse.json({
                message: "No wallets found.",
                stats: { count: 0, totalAmount: 0 }
            });
        }

        const now = new Date();
        const { sendEmail } = await import("@/lib/email");

        let totalSettledAmount = 0;
        let settledCount = 0;

        console.log(`[Full Settlement] STARTING (Ledger Mode). Min Balance to Keep: ${minBalance}`);

        for (const wallet of wallets) {
            const user = wallet.userId as any;
            if (!user || !user._id) continue;

            const userId = user._id.toString();

            // 1. Calculate Active Investment Value
            const activeInvestments = await Investment.find({
                userId: userId,
                isActive: true
            });

            // 2. Determine Total Liquidable Assets (Wallet + Investments)
            const currentPrincipal = wallet.principal || 0;
            const currentProfit = wallet.profit || 0;
            const currentReferral = wallet.referral || 0;
            // Locked is tricky: it represents Pending Withdrawals or Fixed Investments.
            // If it's Pending Withdrawal, we might want to cancel it? 
            // Or assume 'Full Settlement' includes sweeping everything.
            // Let's sweep available liquid funds + liquidating investments.

            let investmentValue = 0;
            activeInvestments.forEach(inv => investmentValue += inv.amount);

            const totalAssets = currentPrincipal + currentProfit + currentReferral + investmentValue;

            // Note: We don't touch 'locked' balance here normally, unless we want to convert it.
            // But if we liquidate Investments, they turn into Principal/Profit, then we withdraw.

            const withdrawableAmount = totalAssets - minBalance;

            if (withdrawableAmount < 1) continue;

            // 3. START LEDGER OPERATIONS
            // We use a comprehensive Transaction

            const breakdown = {
                principal: currentPrincipal,
                profit: currentProfit,
                referral: currentReferral,
                investments: investmentValue
            };

            const movements = [];

            // A. Liquidate Investments (Debit Investment Source, Credit Intermediate/Principal)
            // Actually, we can skip the intermediate step and just Debit the Investment Concept and Credit the Payout?
            // No, strictly: Investment -> Principal -> Locked.

            // However, LedgerService.requestWithdrawal expects funds in Principal/Profit.
            // Since we are bypassing standard flow, we construct movements manually.

            // Step 1: Drain Investments
            if (activeInvestments.length > 0) {
                // We need to record these as REDEMPTIONS in InvestmentLedger
                for (const inv of activeInvestments) {
                    // Update Investment Ledger
                    await InvestmentLedger.create({
                        investmentId: inv._id,
                        userId: userId,
                        action: InvestmentAction.REDEMPTION,
                        amountChange: -inv.amount,
                        balanceAfter: 0,
                        description: "Full Settlement Liquidation"
                    });

                    // Close Investment
                    inv.isActive = false;
                    inv.maturityDate = now;
                    await inv.save();
                }
                // In Ledger, investments aren't a balance account (yet), they are assets. 
                // We assume the money "returns" to Principal.
                movements.push({
                    accountType: LedgerAccountType.PRINCIPAL,
                    direction: LedgerDirection.CREDIT,
                    amount: investmentValue,
                    userId: userId
                });
                // And we account for where it came from? 
                // Usually Investment is outside Ledger Balance. 
                // So we just Credit Principal (Asset Increase from External Source/Investment).
            }

            // Step 2: Sweep All Balances to LOCKED (Pending Withdrawal)
            // We take everything we just credited + existing.

            // Debit existing balances
            if (currentPrincipal > 0) movements.push({ accountType: LedgerAccountType.PRINCIPAL, direction: LedgerDirection.DEBIT, amount: currentPrincipal, userId: userId });
            if (currentProfit > 0) movements.push({ accountType: LedgerAccountType.PROFIT, direction: LedgerDirection.DEBIT, amount: currentProfit, userId: userId });
            if (currentReferral > 0) movements.push({ accountType: LedgerAccountType.REFERRAL, direction: LedgerDirection.DEBIT, amount: currentReferral, userId: userId });

            // Debit the 'Investment Return' we just hypothetically added?
            if (investmentValue > 0) movements.push({ accountType: LedgerAccountType.PRINCIPAL, direction: LedgerDirection.DEBIT, amount: investmentValue, userId: userId });

            // Net Effect: All money moves to LOCKED
            const totalToLock = currentPrincipal + currentProfit + currentReferral + investmentValue;

            // ADJUSTMENT: If minBalance > 0, we leave some behind.
            // We simplify: We just want to Withdraw 'withdrawableAmount'.
            // The logic above sweeps everything. 
            // Correct approach: RequestWithdrawal logic but forcing specific amounts.

            // Let's use the movements to just target the final state.
            // We want [Principal=0, Profit=0, Referral=0] -> [Locked=Total]

            const finalMovements = [];

            // 1. Profit & Referral (Fully Swept)
            if (currentProfit > 0) {
                finalMovements.push({
                    accountType: LedgerAccountType.PROFIT,
                    direction: LedgerDirection.DEBIT,
                    amount: currentProfit,
                    userId
                });
            }
            if (currentReferral > 0) {
                finalMovements.push({
                    accountType: LedgerAccountType.REFERRAL,
                    direction: LedgerDirection.DEBIT,
                    amount: currentReferral,
                    userId
                });
            }

            // 2. Investment Liquidation Source (Admin Bank / Pool)
            if (investmentValue > 0) {
                finalMovements.push({
                    accountType: LedgerAccountType.ADMIN_BANK,
                    direction: LedgerDirection.DEBIT,
                    amount: investmentValue,
                    userId: null
                });
            }

            // 3. Principal (Adjusted for MinBalance)
            let principalDebit = currentPrincipal;
            if (minBalance > 0) {
                if (principalDebit >= minBalance) {
                    principalDebit -= minBalance;
                } else {
                    principalDebit = 0;
                }
            }

            if (principalDebit > 0) {
                finalMovements.push({
                    accountType: LedgerAccountType.PRINCIPAL,
                    direction: LedgerDirection.DEBIT,
                    amount: principalDebit,
                    userId
                });
            }

            // 4. Calculate Total Source Amount (Check)
            const totalSources = principalDebit + currentProfit + currentReferral + investmentValue;

            // 5. Destination (Locked)
            finalMovements.push({
                accountType: LedgerAccountType.LOCKED,
                direction: LedgerDirection.CREDIT,
                amount: totalSources,
                userId
            });

            // 4. Record Ledger Transaction
            // Create Withdrawal Record first for ID
            const withdrawal = await Withdrawal.create({
                userId: userId,
                amount: totalSources,
                status: WithdrawalStatus.PENDING,
                adminRemark: `Full Settlement [Assets: ₹${totalAssets}]`, // Removed [Liquidation Included] redundant text
                createdAt: now,
                updatedAt: now,
            });

            await LedgerService.recordTransaction({
                userId: userId,
                type: TransactionType.WITHDRAWAL,
                amount: totalSources,
                netAmount: totalSources, // NO SURCHARGE
                referenceType: LedgerReferenceType.WITHDRAWAL_LOCK, // Locking funds
                referenceId: withdrawal._id.toString(),
                description: "Full Settlement (Portfolio Liquidation)",
                metadata: { breakdown },
                movements: finalMovements
            });

            // 5. Notify
            sendEmail({
                to: user.email,
                subject: "🏦 Full Portfolio Settlement",
                html: `<p>Your full portfolio has been liquidated and settled. Withdrawal Request Created: ₹${totalSources}</p>`
            }).catch(e => console.error("Email failed", e));

            totalSettledAmount += totalSources;
            settledCount++;
        }

        return NextResponse.json({
            message: "Full settlement processing complete",
            stats: {
                count: settledCount,
                totalAmount: Number(totalSettledAmount.toFixed(2))
            }
        });

    } catch (error: any) {
        console.error("Full Settlement Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

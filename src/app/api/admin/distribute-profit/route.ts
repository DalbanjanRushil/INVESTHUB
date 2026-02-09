
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Transaction, { TransactionType } from "@/models/Transaction";
import LedgerEntry, { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import ProfitDistribution from "@/models/ProfitDistribution";
import PerformancePeriod from "@/models/PerformancePeriod";
import Notification from "@/models/Notification";
import Investment, { LockPlan } from "@/models/Investment";
import InvestmentLedger, { InvestmentAction } from "@/models/InvestmentLedger";
import { z } from "zod";
import mongoose from "mongoose";

const profitSchema = z.object({
    amount: z.number().optional(),
    performancePeriodId: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { amount: manualAmount, performancePeriodId } = profitSchema.parse(body);

        await connectToDatabase();

        let declaredProfit = 0;
        let linkedPeriod: any = null;

        // Validating Source of Truth
        if (performancePeriodId) {
            linkedPeriod = await PerformancePeriod.findById(performancePeriodId);
            if (!linkedPeriod) {
                return NextResponse.json({ error: "Invalid Performance Period ID" }, { status: 400 });
            }
            if (!linkedPeriod.locked) {
                return NextResponse.json({ error: "Performance Period must be LOCKED before distribution." }, { status: 400 });
            }
            if (linkedPeriod.distributionLinked) {
                return NextResponse.json({ error: "This period has already been distributed." }, { status: 400 });
            }
            declaredProfit = linkedPeriod.netProfit;
        } else {
            if (!manualAmount || manualAmount <= 0) {
                return NextResponse.json({ error: "Profit amount is required if not linked to a period." }, { status: 400 });
            }
            declaredProfit = manualAmount;
        }

        if (declaredProfit <= 0) {
            return NextResponse.json({ error: "Cannot distribute zero or negative profit." }, { status: 400 });
        }

        // 2. Calculate Shares
        const ADMIN_SHARE_PERCENTAGE = 0.5; // 50%
        const adminShare = declaredProfit * ADMIN_SHARE_PERCENTAGE;
        const userSharePool = declaredProfit * (1 - ADMIN_SHARE_PERCENTAGE);

        // 3. Get Total Invested Capital
        const eligibleWallets = await Wallet.find({
            $or: [
                { principal: { $gt: 0 } },
                { balance: { $gt: 0 } }
            ]
        }).populate("userId", "name email payoutPreference");

        if (eligibleWallets.length === 0) {
            return NextResponse.json(
                { message: "No eligible investors found. Profit logged but not distributed." },
                { status: 200 }
            );
        }

        const totalInvestedCapital = eligibleWallets.reduce(
            (sum, w) => sum + (w.principal || 0),
            0
        );

        // 4. Distribute to Users using Bulk Ledger Ops
        const bulkWalletOps = [];
        const bulkTransactionOps = [];
        const bulkLedgerOps = [];
        const bulkNotificationOps = [];
        const bulkInvestmentLedgerOps = [];
        const bulkInvestmentOps = [];

        const now = new Date();

        const { sendEmail } = await import("@/lib/email");

        for (const wallet of eligibleWallets) {
            const shareRatio = wallet.principal / totalInvestedCapital;
            let userProfit = Number((shareRatio * userSharePool).toFixed(2));

            const TDS_THRESHOLD = 5000;
            const TDS_RATE = 0.10;
            let taxDeducted = 0;

            if (userProfit > TDS_THRESHOLD) {
                taxDeducted = Number((userProfit * TDS_RATE).toFixed(2));
                userProfit = Number((userProfit - taxDeducted).toFixed(2));
            }

            if (userProfit > 0) {
                const user = wallet.userId as any;
                if (!user) continue;

                const preference = user.payoutPreference || "COMPOUND";
                const targetAccount = preference === "COMPOUND" ? LedgerAccountType.PRINCIPAL : LedgerAccountType.PROFIT;

                // A. Prepare Transaction ID (needed for Ledger)
                const transactionId = new mongoose.Types.ObjectId();

                // B. Transaction Record
                bulkTransactionOps.push({
                    insertOne: {
                        document: {
                            _id: transactionId,
                            userId: user._id,
                            type: TransactionType.PROFIT,
                            amount: userProfit + taxDeducted, // Gross
                            netAmount: userProfit,
                            fee: taxDeducted,
                            status: "SUCCESS",
                            description: `Profit Share: ${linkedPeriod ? linkedPeriod.periodLabel : 'Ad-hoc'}`,
                            metadata: {
                                taxDeducted,
                                preference,
                                periodId: linkedPeriod?._id
                            },
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                });

                // C. Ledger Entries (Double Entry)
                // 1. Credit User
                bulkLedgerOps.push({
                    insertOne: {
                        document: {
                            userId: user._id,
                            accountType: targetAccount,
                            direction: LedgerDirection.CREDIT,
                            amount: userProfit,
                            transactionId: transactionId,
                            referenceType: LedgerReferenceType.PROFIT_DISTRIBUTION,
                            referenceId: linkedPeriod ? linkedPeriod._id : undefined,
                            description: "Profit Share Credited",
                            createdAt: now
                        }
                    }
                });
                // 2. Debit System Profit Pool
                bulkLedgerOps.push({
                    insertOne: {
                        document: {
                            // System account has no userId
                            userId: undefined,
                            accountType: LedgerAccountType.PROFIT_POOL,
                            direction: LedgerDirection.DEBIT,
                            amount: userProfit,
                            transactionId: transactionId,
                            referenceType: LedgerReferenceType.PROFIT_DISTRIBUTION,
                            createdAt: now
                        }
                    }
                });

                // D. Wallet Update (Materialized View)
                const updateQuery: any = {
                    $inc: { totalProfit: userProfit }
                };
                if (preference === "COMPOUND") {
                    updateQuery.$inc.principal = userProfit;

                    // --- INVESTMENT SYNC LOGIC (COMPOUNDING) ---
                    // We must find active Flexi investment and add to it, or create one.
                    const existingFlexi = await Investment.findOne({ userId: user._id, plan: LockPlan.FLEXI, isActive: true }).sort({ amount: -1 });

                    if (existingFlexi) {
                        bulkInvestmentOps.push({
                            updateOne: {
                                filter: { _id: existingFlexi._id },
                                update: { $inc: { amount: userProfit } }
                            }
                        });
                        // Investment Ledger: ACCRUAL
                        bulkInvestmentLedgerOps.push({
                            insertOne: {
                                document: {
                                    investmentId: existingFlexi._id,
                                    userId: user._id,
                                    action: InvestmentAction.ACCRUAL,
                                    amountChange: userProfit,
                                    balanceAfter: existingFlexi.amount + userProfit, // Approx (race cond? handled by singular thread usually)
                                    description: "Profit Compounding",
                                    transactionId: transactionId,
                                    createdAt: now
                                }
                            }
                        });
                    } else {
                        // Create New
                        const newInvId = new mongoose.Types.ObjectId();
                        bulkInvestmentOps.push({
                            insertOne: {
                                document: {
                                    _id: newInvId,
                                    userId: user._id,
                                    amount: userProfit,
                                    plan: LockPlan.FLEXI,
                                    isActive: true,
                                    startDate: now,
                                    createdAt: now,
                                    updatedAt: now
                                }
                            }
                        });
                        // Investment Ledger: CREATION
                        bulkInvestmentLedgerOps.push({
                            insertOne: {
                                document: {
                                    investmentId: newInvId,
                                    userId: user._id,
                                    action: InvestmentAction.CREATION,
                                    amountChange: userProfit,
                                    balanceAfter: userProfit,
                                    description: "Profit Compounding (New Investment)",
                                    transactionId: transactionId,
                                    createdAt: now
                                }
                            }
                        });
                    }

                } else {
                    updateQuery.$inc.profit = userProfit;
                }

                bulkWalletOps.push({
                    updateOne: {
                        filter: { _id: wallet._id },
                        update: updateQuery,
                    },
                });

                // E. Notification
                bulkNotificationOps.push({
                    insertOne: {
                        document: {
                            userId: user._id,
                            title: "Profit Credited",
                            message: `You received ₹${userProfit} as your share of the ${linkedPeriod ? linkedPeriod.periodLabel : 'monthly'} profit distribution.`,
                            isRead: false,
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                });

                // Email
                sendEmail({
                    to: user.email,
                    subject: `💰 Profit Received${linkedPeriod ? `: ${linkedPeriod.periodLabel}` : ''}!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Profit Distribution Update</h2>
                            <p>Hi ${user.name},</p>
                            <p>Great news! You have received a profit share. Net: ₹${userProfit}</p>
                            <p>Preference: ${preference}</p>
                        </div>
                    `
                }).catch(err => console.error(`Failed to send email to ${user.email}`, err));
            }
        }

        if (bulkWalletOps.length > 0) {
            await Transaction.bulkWrite(bulkTransactionOps);
            await LedgerEntry.bulkWrite(bulkLedgerOps);
            await Wallet.bulkWrite(bulkWalletOps);
            await Notification.bulkWrite(bulkNotificationOps);
            if (bulkInvestmentOps.length > 0) await Investment.bulkWrite(bulkInvestmentOps);
            if (bulkInvestmentLedgerOps.length > 0) await InvestmentLedger.bulkWrite(bulkInvestmentLedgerOps);
        }

        // 5. Log the Distribution Event
        await ProfitDistribution.create({
            performancePeriodId: linkedPeriod ? linkedPeriod._id : undefined,
            totalProfit: declaredProfit,
            adminShare,
            userShare: userSharePool,
            distributedToUserCount: bulkWalletOps.length,
            distributionDate: now,
        });

        // 6. Update Performance Period Status
        if (linkedPeriod) {
            linkedPeriod.distributionLinked = true;
            await linkedPeriod.save();
        }

        return NextResponse.json(
            {
                message: "Profit distributed successfully",
                stats: {
                    totalProfit: declaredProfit,
                    userShare: userSharePool,
                    recipients: bulkWalletOps.length,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Distribution Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

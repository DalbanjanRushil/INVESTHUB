import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User, { UserRole } from "@/models/User";
import Wallet from "@/models/Wallet";
import Transaction, { TransactionType } from "@/models/Transaction";
import ProfitDistribution from "@/models/ProfitDistribution";
import Notification from "@/models/Notification";
import { z } from "zod";

const profitSchema = z.object({
    amount: z.number().min(1, "Profit amount must be positive"),
});

export async function POST(req: Request) {
    try {
        // 1. Security Check: Admin Only
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { amount: declaredProfit } = profitSchema.parse(body);

        await connectToDatabase();

        // 2. Calculate Shares
        const ADMIN_SHARE_PERCENTAGE = 0.5; // 50%
        const adminShare = declaredProfit * ADMIN_SHARE_PERCENTAGE;
        const userSharePool = declaredProfit * (1 - ADMIN_SHARE_PERCENTAGE);

        // 3. Get Total Invested Capital (from all active users with principal > 0 OR legacy balance > 0)
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
            (sum, w) => sum + (w.principal || 0) + (w.balance || 0),
            0
        );

        // 4. Distribute to Users
        const bulkWalletOps = [];
        const bulkTransactionOps = [];
        const bulkNotificationOps = [];

        // Global timestamp for this batch
        const now = new Date();

        // Import locally to avoid top-level await issues if any
        const { sendEmail } = await import("@/lib/email");

        for (const wallet of eligibleWallets) {
            // Logic: (UserBalance / TotalCapital) * UserSharePool
            const shareRatio = wallet.principal / totalInvestedCapital;
            let userProfit = Number((shareRatio * userSharePool).toFixed(2)); // Round to 2 decimals

            // --- FEATURE 1: SMART TAXATION (TDS) ---
            // Rule: If Profit > 5000, deduct 10% TDS
            const TDS_THRESHOLD = 5000;
            const TDS_RATE = 0.10; // 10%
            let taxDeducted = 0;

            if (userProfit > TDS_THRESHOLD) {
                taxDeducted = Number((userProfit * TDS_RATE).toFixed(2));
                userProfit = Number((userProfit - taxDeducted).toFixed(2));
            }

            if (userProfit > 0) {
                const user = wallet.userId as any; // Populated user
                if (!user) continue;

                const preference = user.payoutPreference || "COMPOUND";

                const updateQuery: any = {
                    $inc: { totalProfit: userProfit }
                };

                if (preference === "COMPOUND") {
                    // Add to Principal (Compounding)
                    updateQuery.$inc.principal = userProfit;
                } else {
                    // Add to Profit Wallet (No Compounding)
                    updateQuery.$inc.profit = userProfit;
                }

                bulkWalletOps.push({
                    updateOne: {
                        filter: { _id: wallet._id },
                        update: updateQuery,
                    },
                });

                // Log Transaction Op (Net Profit)
                bulkTransactionOps.push({
                    insertOne: {
                        document: {
                            userId: user._id,
                            type: TransactionType.PROFIT,
                            amount: userProfit,
                            taxDeducted: taxDeducted, // Store tax info
                            status: "SUCCESS",
                            description: `Monthly Profit Share (${preference === 'COMPOUND' ? 'Reinvested' : 'Payout Wallet'}) ${taxDeducted > 0 ? `[TDS: -₹${taxDeducted}]` : ""}`,
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                });

                // Log Notification Op
                bulkNotificationOps.push({
                    insertOne: {
                        document: {
                            userId: user._id,
                            title: "Profit Credited",
                            message: `You received ₹${userProfit} as your share of the monthly profit distribution.`,
                            isRead: false,
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                });

                // --- SEND EMAIL NOTIFICATION ---
                // We don't await this to avoid blocking the loop too much, or we catch errors
                sendEmail({
                    to: user.email,
                    subject: "💰 Monthly Profit Received!",
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Monthly Profit Distribution</h2>
                            <p>Hi ${user.name},</p>
                            <p>Great news! You have received a profit share.</p>
                            <ul>
                                <li><strong>Amount:</strong> ₹${userProfit}</li>
                                <li><strong>Preference:</strong> ${preference === 'COMPOUND' ? 'Reinvested (Compounding)' : 'Added to Wallet (Ready via specific request)'}</li>
                                ${taxDeducted > 0 ? `<li><strong>Tax Deducted (TDS):</strong> ₹${taxDeducted}</li>` : ''}
                            </ul>
                            <p>Check your dashboard for more details.</p>
                            <p>Best,<br>InvestHub Team</p>
                        </div>
                    `
                }).catch(err => console.error(`Failed to send email to ${user.email}`, err));
            }
        }

        if (bulkWalletOps.length > 0) {
            await Wallet.bulkWrite(bulkWalletOps);
            await Transaction.bulkWrite(bulkTransactionOps);
            await Notification.bulkWrite(bulkNotificationOps);
        }

        // 5. Log the Distribution Event
        const distributionRecord = await ProfitDistribution.create({
            totalProfit: declaredProfit,
            adminShare,
            userShare: userSharePool,
            distributedToUserCount: bulkWalletOps.length,
            distributionDate: now,
        });

        return NextResponse.json(
            {
                message: "Profit distributed successfully",
                stats: {
                    totalProfit: declaredProfit,
                    adminShare,
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

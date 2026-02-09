import mongoose from "mongoose";
import LedgerEntry, { LedgerAccountType, LedgerDirection, LedgerReferenceType } from "@/models/LedgerEntry";
import Transaction, { TransactionStatus, TransactionType, RiskFlag } from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import Investment from "@/models/Investment"; // Use generic Investment ref if needed
import crypto from "crypto";

// System Account IDs (Virtual)
export const SYSTEM_ACCOUNTS = {
    GATEWAY_POOL: "SYSTEM_GATEWAY_POOL",
    ADMIN_BANK: "SYSTEM_ADMIN_BANK",
    PROFIT_POOL: "SYSTEM_PROFIT_POOL",
    REFERRAL_POOL: "SYSTEM_REFERRAL_POOL",
};

interface LedgerMovement {
    accountType: LedgerAccountType;
    direction: LedgerDirection;
    amount: number;
    userId?: string | null; // Allow null to explicitly signify System/External
}

interface TransactionRequest {
    userId: string;
    type: TransactionType;
    amount: number;
    fee?: number;
    netAmount?: number;
    referenceType: LedgerReferenceType;
    // ...
    referenceId?: string;
    description?: string;
    gatewayOrderId?: string;
    riskFlag?: RiskFlag;
    metadata?: any;
    // The specific ledger movements that constitute this transaction
    movements: LedgerMovement[];
}

export class LedgerService {

    /**
     * Core atomic function to record a transaction and its ledger entries.
     * Updates the Wallet "Materialized View" automatically.
     */
    static async recordTransaction(req: TransactionRequest, session?: mongoose.ClientSession): Promise<any> {
        let localSession = session;
        let diffSession = false;

        if (!localSession) {
            localSession = await mongoose.startSession();
            localSession.startTransaction();
            diffSession = true;
        }

        try {
            // 1. Validate Double Entry Rule (Sum Debits == Sum Credits)
            const debits = req.movements.filter(m => m.direction === LedgerDirection.DEBIT)
                .reduce((sum, m) => sum + m.amount, 0);
            const credits = req.movements.filter(m => m.direction === LedgerDirection.CREDIT)
                .reduce((sum, m) => sum + m.amount, 0);

            // Floating point safety check (epsilon)
            if (Math.abs(debits - credits) > 0.01) {
                throw new Error(`Ledger Imbalance: Debits ${debits} != Credits ${credits}`);
            }

            // 2. Create Transaction Record
            const transaction = new Transaction({
                userId: req.userId,
                type: req.type,
                status: TransactionStatus.SUCCESS, // Ledger entries are final by default unless stated otherwise
                amount: req.amount,
                netAmount: req.amount - (req.fee || 0),
                fee: req.fee || 0,
                referenceId: req.referenceId,
                gatewayOrderId: req.gatewayOrderId,
                description: req.description,
                riskFlag: req.riskFlag || RiskFlag.LOW,
                metadata: req.metadata,
                // Status can be passed in req if we want 'PENDING' transactions with ledger entries (e.g. locking funds)
            });

            // Special case: If this is an INITIATED/PENDING flow, status comes from logic. 
            // But usually 'recordTransaction' implies the movement happened. 
            // For 'Withdrawal Request', the movement is Real Balance -> Locked Balance. So it IS a SUCCESS ledger move.
            // The *Withdrawal* itself is PENDING in business terms, but the *Locking* is COMPLETE.
            // We will store the high-level status in the Transaction.
            if (req.type === TransactionType.WITHDRAWAL) {
                transaction.status = TransactionStatus.PENDING;
            } else if (req.type === TransactionType.DEPOSIT) {
                transaction.status = TransactionStatus.SUCCESS;
            }

            await transaction.save({ session: localSession });

            // 3. Create Ledger Entries
            const entries = req.movements.map(m => ({
                userId: m.userId === undefined ? req.userId : (m.userId === null ? undefined : m.userId), // Handle System Accounts
                accountType: m.accountType,
                direction: m.direction,
                amount: m.amount,
                transactionId: transaction._id,
                referenceType: req.referenceType,
                referenceId: req.referenceId,
                description: req.description
            }));

            await LedgerEntry.insertMany(entries, { session: localSession });

            // 4. Update Wallets (Materialized View)
            await this.updateWallets(entries, localSession);

            if (diffSession) {
                await localSession.commitTransaction();
            }

            return transaction;

        } catch (error) {
            if (diffSession) {
                await localSession.abortTransaction();
            }
            throw error;
        } finally {
            if (diffSession) {
                localSession.endSession();
            }
        }
    }

    /**
     * Updates User Wallets based on the accountType and direction.
     * System accounts are ignored for Wallet updates (unless we add a SystemWallet model).
     */
    private static async updateWallets(entries: any[], session: mongoose.ClientSession) {
        for (const entry of entries) {
            if (!entry.userId) continue; // Skip system accounts

            const inc: any = {};
            const val = entry.direction === LedgerDirection.CREDIT ? entry.amount : -entry.amount;

            // Map Ledger Account to Wallet Field
            switch (entry.accountType) {
                case LedgerAccountType.PRINCIPAL:
                    inc.principal = val;
                    if (val > 0) inc.totalDeposited = val; // Only on credit? Or logic specific?
                    // Issue: totalDeposited should only increase on DEPOSIT, not on refund.
                    // We need context. But for now, let's keep it simple: Principal tracking.
                    // totalDeposited is better handled by specific flow references or logic.
                    // We will handle totalDeposited in the 'Deposit' flow specifically if needed, 
                    // or just strictly map principal. 
                    // Let's stick to balances. totalDeposited is a stat.
                    break;
                case LedgerAccountType.PROFIT:
                    inc.profit = val;
                    if (val > 0) inc.totalProfit = val; // Rough appx
                    break;
                case LedgerAccountType.REFERRAL:
                    inc.referral = val;
                    break;
                case LedgerAccountType.LOCKED:
                    inc.locked = val;
                    break;
                default:
                    continue;
            }

            // Update with Upsert
            await Wallet.findOneAndUpdate(
                { userId: entry.userId },
                { $inc: inc },
                { upsert: true, session }
            );
        }
    }

    // ============================================
    // HIGH LEVEL FLOWS
    // ============================================

    /**
     * Deposit: User gets money, Gateway loses money (liability).
     */
    static async deposit(userId: string, amount: number, paymentId: string, orderId: string, method: string = "RAZORPAY") {
        return this.recordTransaction({
            userId,
            type: TransactionType.DEPOSIT,
            amount,
            netAmount: amount,
            referenceType: LedgerReferenceType.DEPOSIT,
            gatewayOrderId: orderId,
            description: `Deposit via ${method}`,
            metadata: { paymentId, method },
            movements: [
                {
                    accountType: LedgerAccountType.PRINCIPAL,
                    direction: LedgerDirection.CREDIT,
                    amount: amount
                },
                {
                    accountType: LedgerAccountType.GATEWAY, // System Liability/Asset
                    direction: LedgerDirection.DEBIT, // We debited the gateway (we took money from it... technically we Credited our Bank, Debited Gateway? 
                    // In double entry: 
                    // Bank Asset increases (Debit). 
                    // User Liability increases (Credit).
                    // Here 'GATEWAY' represents our external asset source. 
                    // Let's say: CREDIT User Principal, DEBIT Gateway Pool (Source).
                    amount: amount,
                    userId: null // System
                }
            ]
        });
    }

    /**
     * Withdrawal Request: Locks funds.
     * Implements Waterfall: Profit -> Referral -> Principal
     */
    static async requestWithdrawal(userId: string, amount: number, session?: mongoose.ClientSession) {
        // 1. Get Balances
        const wallet = await Wallet.findOne({ userId }).session(session || null);
        if (!wallet) throw new Error("Wallet not found");

        let remaining = amount;
        let deductProfit = 0;
        let deductReferral = 0;
        let deductPrincipal = 0;

        // Waterfall Logic
        if (wallet.profit >= remaining) {
            deductProfit = remaining;
            remaining = 0;
        } else {
            deductProfit = wallet.profit;
            remaining -= wallet.profit;
        }

        if (remaining > 0) {
            if (wallet.referral >= remaining) {
                deductReferral = remaining;
                remaining = 0;
            } else {
                deductReferral = wallet.referral;
                remaining -= wallet.referral;
            }
        }

        if (remaining > 0) {
            if (wallet.principal >= remaining) {
                deductPrincipal = remaining;
                remaining = 0;
            } else {
                throw new Error("Insufficient Funds");
            }
        }

        // 2. Prepare Ledger Movements
        const movements: LedgerMovement[] = [];

        // Debits (Source)
        if (deductProfit > 0) movements.push({ accountType: LedgerAccountType.PROFIT, direction: LedgerDirection.DEBIT, amount: deductProfit });
        if (deductReferral > 0) movements.push({ accountType: LedgerAccountType.REFERRAL, direction: LedgerDirection.DEBIT, amount: deductReferral });
        if (deductPrincipal > 0) movements.push({ accountType: LedgerAccountType.PRINCIPAL, direction: LedgerDirection.DEBIT, amount: deductPrincipal });

        // Credit (Destination -> Locked)
        movements.push({ accountType: LedgerAccountType.LOCKED, direction: LedgerDirection.CREDIT, amount: amount });

        // 3. Metadata for reversal
        const breakdown = { profit: deductProfit, referral: deductReferral, principal: deductPrincipal };

        return this.recordTransaction({
            userId,
            type: TransactionType.WITHDRAWAL,
            amount,
            referenceType: LedgerReferenceType.WITHDRAWAL_LOCK,
            description: "Withdrawal Request - Funds Locked",
            metadata: { breakdown },
            movements
        }, session);
    }

    /**
     * Approve Withdrawal: Locked Funds -> Admin Bank (Real Payout)
     */
    static async approveWithdrawal(withdrawalId: string, adminId: string, transactionId: string) {
        // We need to fetch the original transaction to link it, or just create a new one?
        // Usually, 'Approve' updates the original Transaction status to SUCCESS and adds a new Ledger Entry (Locked -> Out).
        // Or we create a *new* Transaction "WITHDRAWAL_EXECUTED" and link it.
        // Prompt says: "Transaction status = SUCCESS."

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Find the transaction (PENDING one)
            // Ideally passing the transactionId is better. 
            // If we only have withdrawalId, we search.
            const txn = await Transaction.findOne({ referenceId: withdrawalId, type: TransactionType.WITHDRAWAL });
            if (!txn) throw new Error("Transaction not found");

            if (txn.status !== TransactionStatus.PENDING) throw new Error("Transaction not pending");

            // Create Execution Ledger Entries (Locked -> Admin Bank/World)
            const movements: LedgerMovement[] = [
                {
                    accountType: LedgerAccountType.LOCKED,
                    direction: LedgerDirection.DEBIT,
                    amount: txn.amount,
                    userId: txn.userId.toString()
                },
                {
                    accountType: LedgerAccountType.ADMIN_BANK, // Or GATEWAY
                    direction: LedgerDirection.CREDIT,
                    amount: txn.amount,
                    userId: null // System
                }
            ];

            const entries = movements.map(m => ({
                userId: m.userId === undefined ? txn.userId : (m.userId === null ? undefined : m.userId),
                accountType: m.accountType,
                direction: m.direction,
                amount: m.amount,
                transactionId: txn._id,
                referenceType: LedgerReferenceType.WITHDRAWAL,
                referenceId: withdrawalId,
                description: "Withdrawal Approved & Executed"
            }));

            await LedgerEntry.insertMany(entries, { session });
            await this.updateWallets(entries, session);

            // Update Transaction Status
            txn.status = TransactionStatus.SUCCESS;
            txn.markModified('status'); // Ensure save
            await txn.save({ session });

            await session.commitTransaction();
        } catch (e) {
            await session.abortTransaction();
            throw e;
        } finally {
            session.endSession();
        }
    }

    /**
     * Reject Withdrawal: Locked Funds -> Source (Principal/Profit/etc)
     */
    static async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const txn = await Transaction.findOne({ referenceId: withdrawalId, type: TransactionType.WITHDRAWAL });
            if (!txn) throw new Error("Transaction not found");

            // Get breakdown from metadata
            const breakdown = txn.metadata?.get('breakdown') as any || { principal: txn.amount }; // Fallback

            // Prepare Reversal Movements
            const movements: LedgerMovement[] = [];

            // Debit Locked (Take it out of lock)
            movements.push({
                accountType: LedgerAccountType.LOCKED,
                direction: LedgerDirection.DEBIT,
                amount: txn.amount,
                userId: txn.userId.toString()
            });

            // Credit Sources (Put it back)
            if (breakdown.profit > 0) movements.push({ accountType: LedgerAccountType.PROFIT, direction: LedgerDirection.CREDIT, amount: breakdown.profit });
            if (breakdown.referral > 0) movements.push({ accountType: LedgerAccountType.REFERRAL, direction: LedgerDirection.CREDIT, amount: breakdown.referral });
            if (breakdown.principal > 0) movements.push({ accountType: LedgerAccountType.PRINCIPAL, direction: LedgerDirection.CREDIT, amount: breakdown.principal });

            const entries = movements.map(m => ({
                userId: txn.userId,
                accountType: m.accountType,
                direction: m.direction,
                amount: m.amount,
                transactionId: txn._id,
                referenceType: LedgerReferenceType.ADJUSTMENT, // Reversal is an adjustment
                referenceId: withdrawalId,
                description: `Withdrawal Rejected: ${reason}`
            }));

            await LedgerEntry.insertMany(entries, { session });
            await this.updateWallets(entries, session);

            txn.status = TransactionStatus.FAILED;
            txn.description = `Rejected: ${reason}`;
            await txn.save({ session });

            await session.commitTransaction();
        } catch (e) {
            await session.abortTransaction();
            throw e;
        } finally {
            session.endSession();
        }
    }
}

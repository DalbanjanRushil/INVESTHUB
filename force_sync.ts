import connectToDatabase from "./src/lib/db";
import Wallet from "./src/models/Wallet";
import Investment from "./src/models/Investment";
import Deposit from "./src/models/Deposit";
import mongoose from "mongoose";

// HARDCODED URI FOR EMERGENCY SYNC (Read from .env.local)
const MONGODB_URI = "mongodb+srv://dalbanjanrushil0_db_user:mwLRvesthubjUwwtU@investhub.gi0uan2.mongodb.net/?appName=investhub";

async function forceSync() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB for Force Sync...");

        // 1. Find all users with successful deposits
        const deposits = await Deposit.find({ status: "SUCCESS" }).lean();

        for (const dep of deposits) {
            console.log(`Processing Deposit for User: ${dep.userId}`);

            // 2. Ensure an Investment record exists for this deposit
            const existingInv = await Investment.findOne({ sourceDepositId: dep._id });
            if (!existingInv) {
                console.log(`- Creating missing Investment for deposit ${dep._id}`);
                await Investment.create({
                    userId: dep.userId,
                    amount: dep.amount,
                    plan: dep.plan || "FLEXI",
                    sourceDepositId: dep._id,
                    isActive: true
                });
            }

            // 3. Recalculate Wallet based on ALL investments
            const userInvs = await Investment.find({ userId: dep.userId, isActive: true });
            const totalPrincipal = userInvs
                .filter(i => i.plan === "FLEXI")
                .reduce((s, i) => s + i.amount, 0);

            const totalLocked = userInvs
                .filter(i => i.plan !== "FLEXI")
                .reduce((s, i) => s + i.amount, 0);

            console.log(`- Final Sum: Principal=${totalPrincipal}, Locked=${totalLocked}`);

            // 4. Force Update Wallet
            await Wallet.findOneAndUpdate(
                { userId: dep.userId },
                {
                    $set: {
                        principal: totalPrincipal,
                        locked: totalLocked,
                        // Clean up legacy balance if it exists
                        balance: 0
                    }
                },
                { upsert: true }
            );
        }

        console.log("\nSync Complete. Refresh your dashboard.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

forceSync();

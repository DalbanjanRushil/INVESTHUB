import connectToDatabase from "./src/lib/db";
import User from "./src/models/User";
import Wallet from "./src/models/Wallet";
import Investment from "./src/models/Investment";
import Deposit from "./src/models/Deposit";
import mongoose from "mongoose";

async function investigate() {
    await connectToDatabase();
    console.log("=== STARTING DEEP DATABASE INVESTIGATION ===\n");

    // 1. Find all successful deposits
    const successfulDeposits = await Deposit.find({ status: "SUCCESS" }).lean();
    console.log(`Found ${successfulDeposits.length} successful deposits.`);

    for (const dep of successfulDeposits) {
        const uid = dep.userId;
        console.log(`\nAnalyzing User ID linked to Deposit: ${uid} (Type: ${typeof uid})`);

        // Check if User exists
        const user = await User.findById(uid);
        console.log(`- User Record Found: ${user ? "YES (" + user.email + ")" : "NO"}`);

        // Check Wallet
        const wallet = await Wallet.findOne({ userId: uid });
        if (wallet) {
            console.log(`- Wallet Found: Principal=${wallet.principal}, Locked=${wallet.locked}, Profit=${wallet.profit}`);
        } else {
            console.log("- Wallet Found: NO (MISSING WALLET!)");
            // Check if there's a wallet with the string version of the ID
            const stringWallet = await Wallet.collection.findOne({ userId: uid.toString() });
            if (stringWallet) {
                console.log("  !!! CRITICAL: Found wallet with STRING ID instead of ObjectId. This is a GHOST WALLET.");
            }
        }

        // Check Investments
        const invs = await Investment.find({ userId: uid });
        console.log(`- Active Investments count: ${invs.length}`);
        invs.forEach(i => console.log(`  > ${i.amount} INR in ${i.plan}`));
    }

    console.log("\n=== INVESTIGATION COMPLETE ===");
    process.exit(0);
}

investigate();

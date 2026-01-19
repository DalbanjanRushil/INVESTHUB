
process.env.MONGODB_URI = "mongodb+srv://dalbanjanrushil0_db_user:mwLRLXhe3UjUwwtU@investhub.gi0uan2.mongodb.net/?appName=investhub";

import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ErrorLog from "@/models/ErrorLog";

async function readErrors() {
    await connectToDatabase();

    console.log("Checking Error Logs in DB...");
    const errors = await ErrorLog.find({}).sort({ createdAt: -1 }).limit(5).lean();

    if (errors.length === 0) {
        console.log("No compiled error logs found.");
    } else {
        errors.forEach((e: any) => {
            console.log(`[${e.createdAt}] ${e.error}`);
            console.log(`Stack: ${e.stack ? e.stack.split('\n')[0] : 'No Stack'}`);
            console.log("---------------------------------------------------");
        });
    }

    process.exit(0);
}

readErrors();

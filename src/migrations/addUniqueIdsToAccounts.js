/**
 * Migration Script: Add Unique IDs to All Existing Accounts
 *
 * This script:
 * 1. Finds all accounts without a uniqueId
 * 2. Generates a unique ID for each
 * 3. Updates the database
 *
 * Run this once after deploying the uniqueId field to Account model
 *
 * Usage: node backend/src/migrations/addUniqueIdsToAccounts.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Account from "../models/Account.js";
import { generateAccountUniqueId } from "../utils/generateUniqueId.js";

dotenv.config();

const migrateAccountUniqueIds = async () => {
  try {
    console.log("🚀 Starting unique ID migration...\n");

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to database\n");

    // Find accounts without uniqueId
    const accounts = await Account.find({
      $or: [{ uniqueId: { $exists: false } }, { uniqueId: null }],
    });

    console.log(`📊 Found ${accounts.length} accounts to migrate\n`);

    if (accounts.length === 0) {
      console.log("✨ All accounts already have unique IDs!");
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        const uniqueId = await generateAccountUniqueId();
        account.uniqueId = uniqueId;
        await account.save();

        console.log(
          `✅ ${account.accountName} (${account.accountType}) -> ${uniqueId}`,
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to migrate ${account.accountName}: ${error.message}`,
        );
        errorCount++;
      }
    }

    console.log(`\n📈 Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run migration
migrateAccountUniqueIds();

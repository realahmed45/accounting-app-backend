import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

const dropDatabase = async () => {
  try {
    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║                                                       ║");
    console.log("║        🗑️  DATABASE RESET TOOL 🗑️                     ║");
    console.log("║                                                       ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("\n");

    console.log("🔌 Connecting to MongoDB...");

    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://chatbiz50_db_user:dtorU38nkLmTNdy8@cluster0.ehikyfh.mongodb.net/accounting-app?retryWrites=true&w=majority&appName=Cluster0",
    );

    console.log(`✅ Connected to: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}\n`);

    // Show what will be deleted
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`);
    collections.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.name}`);
    });

    console.log("\n⚠️  WARNING: This will delete ALL data including:");
    console.log("   • All user accounts");
    console.log("   • All expenses and transactions");
    console.log("   • All bank accounts");
    console.log("   • All schedules and shifts");
    console.log("   • All notifications");
    console.log("   • Everything else in the database");

    console.log("\n⏳ Dropping database in 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Drop the entire database
    console.log("\n🗑️  Dropping database...");
    await conn.connection.dropDatabase();

    console.log("\n");
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║                                                       ║");
    console.log("║        ✅ DATABASE RESET COMPLETE ✅                   ║");
    console.log("║                                                       ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("\n");
    console.log("🆕 Fresh start ready!");
    console.log("💡 All users can now register and take a fresh start");
    console.log("🔐 All accounts will get unique IDs automatically\n");

    await mongoose.connection.close();
    console.log("✅ Connection closed\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("   1. MongoDB connection string is correct");
    console.error("   2. You have internet connection");
    console.error("   3. MongoDB Atlas is accessible\n");
    process.exit(1);
  }
};

dropDatabase();

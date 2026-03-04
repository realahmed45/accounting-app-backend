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
    console.log("🔌 Connecting to MongoDB...");

    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://chatbiz50_db_user:dtorU38nkLmTNdy8@cluster0.ehikyfh.mongodb.net/accounting-app?retryWrites=true&w=majority&appName=Cluster0",
    );

    console.log(`✅ Connected to: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Drop the entire database
    console.log("\n⚠️  WARNING: Dropping entire database...");
    await conn.connection.dropDatabase();

    console.log("✅ Database dropped successfully!");
    console.log(
      "🆕 Fresh start ready - all accounts will get unique IDs automatically",
    );

    await mongoose.connection.close();
    console.log("\n✅ Connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

dropDatabase();

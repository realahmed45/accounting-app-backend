import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://chatbiz50_db_user:dtorU38nkLmTNdy8@cluster0.ehikyfh.mongodb.net/accounting-app?retryWrites=true&w=majority&appName=Cluster0",
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Drop stale phone_1 index if it still exists from an old schema version
    try {
      const usersCollection = conn.connection.db.collection("users");
      const indexes = await usersCollection.indexes();
      if (indexes.some((i) => i.name === "phone_1")) {
        await usersCollection.dropIndex("phone_1");
        console.log("🗑️  Dropped stale phone_1 index from users collection");
      }
    } catch (indexErr) {
      // Non-fatal — log and continue
      console.warn("⚠️  Could not clean up phone_1 index:", indexErr.message);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

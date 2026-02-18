import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 
      "mongodb+srv://chatbiz50_db_user:dtorU38nkLmTNdy8@cluster0.ehikyfh.mongodb.net/accounting-app?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/accounts.js";
import weekRoutes from "./routes/weeks.js";
import expenseRoutes from "./routes/expenses.js";
import photoRoutes from "./routes/photos.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS - Accept all origins
app.use(cors());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/weeks", weekRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/photos", photoRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

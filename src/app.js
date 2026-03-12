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
import invitationRoutes from "./routes/invitations.js";
import scheduleRoutes from "./routes/schedule.js";
import dailyActivityRoutes from "./routes/dailyActivity.js";
import notificationRoutes from "./routes/notifications.js";
import sampleDataRoutes from "./routes/sampleData.js";
import subscriptionRoutes from "./routes/subscription.js";
import tagRoutes from "./routes/tags.js";
import budgetRoutes from "./routes/budgets.js";
import recurringExpenseRoutes from "./routes/recurringExpenses.js";
import advancedSearchRoutes from "./routes/advancedSearch.js";
import bulkOperationsRoutes from "./routes/bulkOperations.js";
import dataExportRoutes from "./routes/dataExport.js";

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
app.use("/api/invitations", invitationRoutes);
app.use("/api/accounts", scheduleRoutes);
app.use("/api/accounts", dailyActivityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/accounts/:id/sample-data", sampleDataRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/accounts/:id/tags", tagRoutes);
app.use("/api/accounts/:id/budgets", budgetRoutes);
app.use("/api/accounts/:id/recurring-expenses", recurringExpenseRoutes);
app.use("/api/accounts/:id/search", advancedSearchRoutes);
app.use("/api/accounts/:id/bulk", bulkOperationsRoutes);
app.use("/api/accounts/:id/export", dataExportRoutes);

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

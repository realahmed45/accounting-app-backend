import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    weekId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Week",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    paymentSource: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // New fields for SaaS features
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurringExpense",
      default: null,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
expenseSchema.index({ accountId: 1, date: -1 });
expenseSchema.index({ weekId: 1 });
expenseSchema.index({ tags: 1 });
expenseSchema.index({ isRecurring: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;

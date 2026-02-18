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
    person: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    fromBank: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
expenseSchema.index({ accountId: 1, date: -1 });
expenseSchema.index({ weekId: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;

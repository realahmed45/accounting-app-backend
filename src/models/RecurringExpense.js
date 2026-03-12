import mongoose from "mongoose";

const recurringExpenseSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    // Template information
    templateName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    isVariable: {
      type: Boolean,
      default: false, // true = amount can vary
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
    },
    // Recurrence settings
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
      required: true,
    },
    interval: {
      type: Number,
      default: 1, // e.g., every 2 weeks = weekly + interval 2
    },
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
    },
    dayOfMonth: {
      type: Number, // 1-31
    },
    monthOfYear: {
      type: Number, // 1-12 (for yearly)
    },
    // Schedule dates
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date, // null = forever
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastCreated: {
      type: Date,
    },
    nextScheduled: {
      type: Date,
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalCreated: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate next scheduled date
recurringExpenseSchema.methods.calculateNextDate = function () {
  let nextDate = new Date(this.lastCreated || this.startDate);

  switch (this.frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + this.interval);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7 * this.interval);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + this.interval);
      if (this.dayOfMonth) {
        nextDate.setDate(this.dayOfMonth);
      }
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + this.interval);
      if (this.monthOfYear) {
        nextDate.setMonth(this.monthOfYear - 1);
      }
      if (this.dayOfMonth) {
        nextDate.setDate(this.dayOfMonth);
      }
      break;
  }

  return nextDate;
};

// Check if expense should be created today
recurringExpenseSchema.methods.shouldCreateToday = function () {
  if (!this.isActive) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const nextScheduled = new Date(this.nextScheduled || this.startDate);
  nextScheduled.setHours(0, 0, 0, 0);

  // Check if end date passed
  if (this.endDate && now > new Date(this.endDate)) {
    return false;
  }

  return now >= nextScheduled;
};

const RecurringExpense = mongoose.model(
  "RecurringExpense",
  recurringExpenseSchema,
);

export default RecurringExpense;

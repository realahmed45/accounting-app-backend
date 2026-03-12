import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Budget type
    type: {
      type: String,
      enum: ["category", "total", "person", "custom"],
      default: "total",
    },
    // Reference based on type
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
    },
    // Budget amount and period
    amount: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
      default: "monthly",
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    // Current period tracking
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    spent: {
      type: Number,
      default: 0,
    },
    // Alert thresholds (percentage)
    alertAt50: {
      type: Boolean,
      default: true,
    },
    alertAt75: {
      type: Boolean,
      default: true,
    },
    alertAt90: {
      type: Boolean,
      default: true,
    },
    alertAt100: {
      type: Boolean,
      default: true,
    },
    alerted50: {
      type: Boolean,
      default: false,
    },
    alerted75: {
      type: Boolean,
      default: false,
    },
    alerted90: {
      type: Boolean,
      default: false,
    },
    alerted100: {
      type: Boolean,
      default: false,
    },
    // Settings
    rollover: {
      type: Boolean,
      default: false, // Carry unused budget to next period
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate percentage spent
budgetSchema.methods.getPercentageSpent = function () {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100);
};

// Check if budget exceeded
budgetSchema.methods.isExceeded = function () {
  return this.spent > this.amount;
};

// Get remaining amount
budgetSchema.methods.getRemaining = function () {
  return Math.max(0, this.amount - this.spent);
};

// Check if alert should be sent
budgetSchema.methods.shouldAlert = function (percentage) {
  const currentPercentage = this.getPercentageSpent();

  if (
    percentage === 50 &&
    currentPercentage >= 50 &&
    !this.alerted50 &&
    this.alertAt50
  ) {
    return true;
  }
  if (
    percentage === 75 &&
    currentPercentage >= 75 &&
    !this.alerted75 &&
    this.alertAt75
  ) {
    return true;
  }
  if (
    percentage === 90 &&
    currentPercentage >= 90 &&
    !this.alerted90 &&
    this.alertAt90
  ) {
    return true;
  }
  if (
    percentage === 100 &&
    currentPercentage >= 100 &&
    !this.alerted100 &&
    this.alertAt100
  ) {
    return true;
  }

  return false;
};

// Reset for new period
budgetSchema.methods.resetPeriod = function () {
  if (this.rollover) {
    const remaining = this.getRemaining();
    this.amount += remaining;
  }

  this.spent = 0;
  this.alerted50 = false;
  this.alerted75 = false;
  this.alerted90 = false;
  this.alerted100 = false;

  // Update period dates
  const now = new Date();
  this.currentPeriodStart = now;

  switch (this.period) {
    case "daily":
      this.currentPeriodEnd = new Date(now.setDate(now.getDate() + 1));
      break;
    case "weekly":
      this.currentPeriodEnd = new Date(now.setDate(now.getDate() + 7));
      break;
    case "monthly":
      this.currentPeriodEnd = new Date(now.setMonth(now.getMonth() + 1));
      break;
    case "yearly":
      this.currentPeriodEnd = new Date(now.setFullYear(now.getFullYear() + 1));
      break;
  }
};

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;

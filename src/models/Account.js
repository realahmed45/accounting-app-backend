import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    customDescription: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ownerId tracks who currently owns the account (can change via ownership transfer)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // parentAccountId is null for top-level accounts
    parentAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    currency: {
      type: String,
      default: "USD",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    overtimeToExtraDayRatio: {
      type: Number,
      default: 8,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
accountSchema.index({ userId: 1 });

const Account = mongoose.model("Account", accountSchema);

export default Account;

import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    timezone: {
      type: String,
      default: "UTC",
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

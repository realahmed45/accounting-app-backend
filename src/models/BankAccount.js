import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Bank account name is required"],
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["checking", "savings", "credit", "cash", "other"],
      default: "checking",
    },
    lastFourDigits: {
      type: String,
      maxlength: 4,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

bankAccountSchema.index({ accountId: 1 });

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

export default BankAccount;

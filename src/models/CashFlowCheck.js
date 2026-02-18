import mongoose from "mongoose";

const cashFlowCheckSchema = new mongoose.Schema(
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
    expectedAmount: {
      type: Number,
      required: true,
    },
    actualAmount: {
      type: Number,
      required: true,
    },
    difference: {
      type: Number,
      required: true,
    },
    person: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvalTimestamp: {
      type: Date,
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
cashFlowCheckSchema.index({ accountId: 1, date: -1 });
cashFlowCheckSchema.index({ weekId: 1 });

const CashFlowCheck = mongoose.model("CashFlowCheck", cashFlowCheckSchema);

export default CashFlowCheck;

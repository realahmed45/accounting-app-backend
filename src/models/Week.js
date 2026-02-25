import mongoose from "mongoose";

const weekSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    cashBoxBalance: {
      type: Number,
      default: 0,
    },
    cashTransactions: [
      {
        amount: { type: Number, required: true },
        note: { type: String, default: "" },
        date: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
weekSchema.index({ accountId: 1, startDate: -1 });

const Week = mongoose.model("Week", weekSchema);

export default Week;

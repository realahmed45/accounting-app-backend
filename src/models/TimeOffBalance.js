import mongoose from "mongoose";

const timeOffBalanceSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMember",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    annualAllowanceDays: {
      type: Number,
      default: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
    },
    extraEarnedDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

timeOffBalanceSchema.virtual("remainingDays").get(function () {
  return this.annualAllowanceDays + this.extraEarnedDays - this.usedDays;
});

timeOffBalanceSchema.set("toJSON", { virtuals: true });
timeOffBalanceSchema.set("toObject", { virtuals: true });

timeOffBalanceSchema.index({ accountId: 1, memberId: 1, year: 1 }, { unique: true });

const TimeOffBalance = mongoose.model("TimeOffBalance", timeOffBalanceSchema);

export default TimeOffBalance;

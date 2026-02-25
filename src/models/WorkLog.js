import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

workLogSchema.index({ accountId: 1, memberId: 1, date: 1 });

const WorkLog = mongoose.model("WorkLog", workLogSchema);

export default WorkLog;

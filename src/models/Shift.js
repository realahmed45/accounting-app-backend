import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    shiftTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShiftType",
      default: null, // null for ad-hoc shifts
    },
    date: {
      type: Date,
      required: true,
    },
    assignedMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMember",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "assigned", "cancelled"],
      default: "open",
    },
    notes: {
      type: String,
      default: "",
    },
    // Ad-hoc fields (used if shiftTypeId is null)
    adHocStart: String, // HH:mm
    adHocEnd: String,   // HH:mm
    adHocLabel: String,
    
    // Replacement Tracking
    replacedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMember",
      default: null,
    },
    replacedAt: {
      type: Date,
      default: null,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

shiftSchema.index({ accountId: 1, date: 1 });
shiftSchema.index({ assignedMemberId: 1, date: 1 });

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;

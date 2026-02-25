import mongoose from "mongoose";

const extraHourSchema = new mongoose.Schema(
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
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: Date,
    rejectionNote: String,
    
    // Proof fields
    imageData: String, // base64 data URL
    proofLatitude: Number,
    proofLongitude: Number,
    proofCapturedAt: Date,
  },
  { timestamps: true },
);

extraHourSchema.index({ accountId: 1, memberId: 1, date: 1 });
extraHourSchema.index({ accountId: 1, status: 1 });

const ExtraHour = mongoose.model("ExtraHour", extraHourSchema);

export default ExtraHour;

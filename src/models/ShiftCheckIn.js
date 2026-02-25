import mongoose from "mongoose";

const shiftCheckInSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      unique: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountMember",
      required: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    imageData: {
      type: String,
      required: true,
    },
    latitude: Number,
    longitude: Number,
    locationLabel: String,
  },
  { timestamps: true },
);

shiftCheckInSchema.index({ accountId: 1, memberId: 1 });

const ShiftCheckIn = mongoose.model("ShiftCheckIn", shiftCheckInSchema);

export default ShiftCheckIn;

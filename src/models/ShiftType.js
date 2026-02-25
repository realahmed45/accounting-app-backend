import mongoose from "mongoose";

const shiftTypeSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Shift name is required"],
      trim: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    breakMinutes: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#4F46E5", // Indigo-600
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

shiftTypeSchema.index({ accountId: 1, name: 1 });

const ShiftType = mongoose.model("ShiftType", shiftTypeSchema);

export default ShiftType;

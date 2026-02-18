import mongoose from "mongoose";

const personSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isCashFlowManager: {
      type: Boolean,
      default: false,
    },
    pinCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index
personSchema.index({ accountId: 1, name: 1 }, { unique: true });

const Person = mongoose.model("Person", personSchema);

export default Person;

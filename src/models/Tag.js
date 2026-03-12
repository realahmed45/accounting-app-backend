import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#3B82F6", // Blue
    },
    description: {
      type: String,
      trim: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for unique tags per account
tagSchema.index({ accountId: 1, name: 1 }, { unique: true });

// Method to increment usage count
tagSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  await this.save();
};

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;

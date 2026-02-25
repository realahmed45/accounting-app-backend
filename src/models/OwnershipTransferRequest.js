import mongoose from "mongoose";

const ownershipTransferRequestSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    toWhatsApp: {
      type: String,
      trim: true,
      default: "",
    },
    toTelegram: {
      type: String,
      trim: true,
      default: "",
    },
    inviteToken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled", "correctionRequested"],
      default: "pending",
    },
    correctionTargetEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    correctionRequestedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

ownershipTransferRequestSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);
ownershipTransferRequestSchema.index({ accountId: 1, status: 1 });

const OwnershipTransferRequest = mongoose.model(
  "OwnershipTransferRequest",
  ownershipTransferRequestSchema,
);

export default OwnershipTransferRequest;

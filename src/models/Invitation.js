import mongoose from "mongoose";
import crypto from "crypto";

const invitationSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    permissions: {
      calculateCash: { type: Boolean, default: false },
      accessSettings: { type: Boolean, default: false },
      addUser: { type: Boolean, default: false },
      addCategories: { type: Boolean, default: false },
      addBankAccount: { type: Boolean, default: false },
      makeExpense: { type: Boolean, default: true },
      createAccountDownward: { type: Boolean, default: false },
      createAccountUpward: { type: Boolean, default: false },
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["invitation", "ownershipTransfer"],
      default: "invitation",
    },
    viewOnly: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Auto-expire invitations
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a secure random token
invitationSchema.statics.generateToken = () =>
  crypto.randomBytes(32).toString("hex");

const Invitation = mongoose.model("Invitation", invitationSchema);
export default Invitation;

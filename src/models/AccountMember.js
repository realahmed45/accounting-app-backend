import mongoose from "mongoose";

const permissionsSchema = new mongoose.Schema(
  {
    calculateCash: { type: Boolean, default: false },
    accessSettings: { type: Boolean, default: false },
    addUser: { type: Boolean, default: false },
    addCategories: { type: Boolean, default: false },
    addBankAccount: { type: Boolean, default: false },
    makeExpense: { type: Boolean, default: true },
    createAccountDownward: { type: Boolean, default: false },
    createAccountUpward: { type: Boolean, default: false },
    manageSchedule: { type: Boolean, default: false },
  },
  { _id: false },
);

const accountMemberSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    viewOnly: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// A user can only be a member of an account once
accountMemberSchema.index({ accountId: 1, userId: 1 }, { unique: true });

const AccountMember = mongoose.model("AccountMember", accountMemberSchema);

export default AccountMember;

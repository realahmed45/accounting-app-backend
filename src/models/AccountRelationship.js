import mongoose from "mongoose";

const accountRelationshipSchema = new mongoose.Schema(
  {
    parentAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    childAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    // downward = parent created a child; upward = child linked itself to a parent; sideways = sibling link
    relationshipType: {
      type: String,
      enum: ["downward", "upward", "sideways"],
      required: true,
    },
    // Only relevant for sideways links
    accessLevel: {
      type: String,
      enum: ["view", "full"],
      default: "view",
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

accountRelationshipSchema.index(
  { parentAccountId: 1, childAccountId: 1 },
  { unique: true },
);

const AccountRelationship = mongoose.model(
  "AccountRelationship",
  accountRelationshipSchema,
);

export default AccountRelationship;

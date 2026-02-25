import mongoose from "mongoose";

const billPhotoSchema = new mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    imageData: {
      type: String, // base64 data URL (data:image/jpeg;base64,...)
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
billPhotoSchema.index({ expenseId: 1 });
billPhotoSchema.index({ accountId: 1 });

const BillPhoto = mongoose.model("BillPhoto", billPhotoSchema);

export default BillPhoto;

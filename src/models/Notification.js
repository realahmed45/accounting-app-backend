import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
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
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorDisplayName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: true,
      enum: [
        "expense_created",
        "expense_updated",
        "expense_deleted",
        "photo_uploaded",
        "photo_deleted",
        "shift_created",
        "shift_updated",
        "shift_cancelled",
        "shift_assigned",
        "shift_replaced",
        "shift_checkin_submitted",
        "shift_checkout_submitted",
        "shift_type_created",
        "shift_type_updated",
        "work_log_added",
        "work_log_deleted",
        "extra_hours_submitted",
        "extra_hours_approved",
        "extra_hours_rejected",
        "member_invited",
        "member_removed",
        "permission_granted",
        "permission_revoked",
        "ownership_transferred",
        "ownership_transfer_initiated",
        "ownership_correction_requested",
        "bank_account_added",
        "bank_account_removed",
        "bank_account_updated",
        "category_added",
        "category_updated",
        "account_settings_changed",
        "week_created",
        "week_locked",
        "week_unlocked",
        "cash_added",
        "cash_transferred",
        "cash_check_performed",
        "time_off_allowance_updated",
        "time_off_extra_day_earned",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: {
      type: Date,
      default: function () {
        // Auto-expire after 90 days
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date;
      },
    },
  },
  { timestamps: true },
);

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ accountId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

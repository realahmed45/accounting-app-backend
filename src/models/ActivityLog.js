import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
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
    action: {
      type: String,
      enum: [
        "expense_created",
        "expense_updated",
        "expense_deleted",
        "member_invited",
        "member_removed",
        "permission_granted",
        "permission_revoked",
        "ownership_transfer_initiated",
        "ownership_transferred",
        "ownership_correction_requested",
        "week_created",
        "week_locked",
        "bank_account_added",
        "bank_account_removed",
        "account_settings_changed",
        "shift_created",
        "shift_updated",
        "shift_cancelled",
        "shift_assigned",
        "shift_replaced",
        "extra_hours_submitted",
        "extra_hours_approved",
        "extra_hours_rejected",
        "shift_type_created",
        "shift_type_updated",
        "shift_checkin_submitted",
        "time_off_allowance_updated",
        "time_off_extra_day_earned",
        "work_log_added",
        "work_log_deleted",
      ],
      required: true,
    },
    targetDescription: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ accountId: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;

import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    emailNotifications: {
      expenses: {
        type: Boolean,
        default: true,
      },
      shifts: {
        type: Boolean,
        default: true,
      },
      checkIns: {
        type: Boolean,
        default: true,
      },
      workLogs: {
        type: Boolean,
        default: true,
      },
      permissions: {
        type: Boolean,
        default: true,
      },
      ownership: {
        type: Boolean,
        default: true,
      },
      banking: {
        type: Boolean,
        default: true,
      },
      weekly: {
        type: Boolean,
        default: true,
      },
      all: {
        type: Boolean,
        default: true,
      },
    },
    inAppNotifications: {
      expenses: {
        type: Boolean,
        default: true,
      },
      shifts: {
        type: Boolean,
        default: true,
      },
      checkIns: {
        type: Boolean,
        default: true,
      },
      workLogs: {
        type: Boolean,
        default: true,
      },
      permissions: {
        type: Boolean,
        default: true,
      },
      ownership: {
        type: Boolean,
        default: true,
      },
      banking: {
        type: Boolean,
        default: true,
      },
      weekly: {
        type: Boolean,
        default: true,
      },
      all: {
        type: Boolean,
        default: true,
      },
    },
    emailFrequency: {
      type: String,
      enum: ["instant", "hourly_digest", "daily_digest"],
      default: "instant",
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "22:00",
      },
      endTime: {
        type: String,
        default: "08:00",
      },
    },
    notificationSound: {
      type: Boolean,
      default: true,
    },
    desktopNotifications: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

notificationPreferenceSchema.index({ userId: 1 });

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema,
);

export default NotificationPreference;

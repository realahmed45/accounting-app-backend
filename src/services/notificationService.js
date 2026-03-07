import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import AccountMember from "../models/AccountMember.js";
import User from "../models/User.js";
import { sendNotificationEmail } from "./emailNotificationService.js";

// Notification type definitions with metadata
const NOTIFICATION_TYPES = {
  // Expenses
  expense_created: {
    title: "New Expense Added",
    priority: "medium",
    category: "expenses",
    notifyRoles: ["all"],
  },
  expense_updated: {
    title: "Expense Updated",
    priority: "low",
    category: "expenses",
    notifyRoles: ["all"],
  },
  expense_deleted: {
    title: "Expense Deleted",
    priority: "low",
    category: "expenses",
    notifyRoles: ["all"],
  },
  photo_uploaded: {
    title: "Proof Photo Uploaded",
    priority: "low",
    category: "expenses",
    notifyRoles: ["all"],
  },
  photo_deleted: {
    title: "Proof Photo Removed",
    priority: "low",
    category: "expenses",
    notifyRoles: ["all"],
  },

  // Shifts
  shift_created: {
    title: "New Shift Created",
    priority: "medium",
    category: "shifts",
    notifyRoles: ["all"],
  },
  shift_updated: {
    title: "Shift Updated",
    priority: "medium",
    category: "shifts",
    notifyRoles: ["all"],
  },
  shift_cancelled: {
    title: "Shift Cancelled",
    priority: "high",
    category: "shifts",
    notifyRoles: ["all"],
  },
  shift_assigned: {
    title: "You've Been Assigned to a Shift",
    priority: "high",
    category: "shifts",
    notifyRoles: ["assignedMember"],
  },
  shift_replaced: {
    title: "Shift Reassigned",
    priority: "high",
    category: "shifts",
    notifyRoles: ["affected"],
  },
  shift_checkin_submitted: {
    title: "Team Member Checked In",
    priority: "low",
    category: "checkIns",
    notifyRoles: ["managers"],
  },
  shift_checkout_submitted: {
    title: "Team Member Checked Out",
    priority: "low",
    category: "checkIns",
    notifyRoles: ["managers"],
  },
  shift_type_created: {
    title: "New Shift Type Created",
    priority: "low",
    category: "shifts",
    notifyRoles: ["all"],
  },
  shift_type_updated: {
    title: "Shift Type Updated",
    priority: "low",
    category: "shifts",
    notifyRoles: ["all"],
  },

  // Work & Hours
  work_log_added: {
    title: "Work Log Added",
    priority: "low",
    category: "workLogs",
    notifyRoles: ["affected"],
  },
  work_log_deleted: {
    title: "Work Log Deleted",
    priority: "low",
    category: "workLogs",
    notifyRoles: ["affected"],
  },
  extra_hours_submitted: {
    title: "Extra Hours Request Submitted",
    priority: "medium",
    category: "workLogs",
    notifyRoles: ["managers"],
  },
  extra_hours_approved: {
    title: "Your Extra Hours Were Approved",
    priority: "high",
    category: "workLogs",
    notifyRoles: ["affected"],
  },
  extra_hours_rejected: {
    title: "Your Extra Hours Were Rejected",
    priority: "high",
    category: "workLogs",
    notifyRoles: ["affected"],
  },

  // Team & Permissions
  member_invited: {
    title: "New Member Invited",
    priority: "medium",
    category: "permissions",
    notifyRoles: ["all"],
  },
  member_removed: {
    title: "Member Removed",
    priority: "medium",
    category: "permissions",
    notifyRoles: ["all"],
  },
  permission_granted: {
    title: "Permission Granted to You",
    priority: "high",
    category: "permissions",
    notifyRoles: ["affected"],
  },
  permission_revoked: {
    title: "Permission Revoked",
    priority: "high",
    category: "permissions",
    notifyRoles: ["affected"],
  },
  ownership_transferred: {
    title: "Account Ownership Transferred",
    priority: "urgent",
    category: "ownership",
    notifyRoles: ["all"],
  },
  ownership_transfer_initiated: {
    title: "Ownership Transfer Requested",
    priority: "urgent",
    category: "ownership",
    notifyRoles: ["affected"],
  },
  ownership_correction_requested: {
    title: "Ownership Correction Requested",
    priority: "high",
    category: "ownership",
    notifyRoles: ["owner"],
  },

  // Banking
  bank_account_added: {
    title: "Bank Account Added",
    priority: "medium",
    category: "banking",
    notifyRoles: ["all"],
  },
  bank_account_removed: {
    title: "Bank Account Removed",
    priority: "medium",
    category: "banking",
    notifyRoles: ["all"],
  },
  bank_account_updated: {
    title: "Bank Account Updated",
    priority: "low",
    category: "banking",
    notifyRoles: ["all"],
  },
  category_added: {
    title: "Category Added",
    priority: "low",
    category: "banking",
    notifyRoles: ["all"],
  },
  category_updated: {
    title: "Category Updated",
    priority: "low",
    category: "banking",
    notifyRoles: ["all"],
  },

  // Weekly Operations
  week_created: {
    title: "New Week Started",
    priority: "medium",
    category: "weekly",
    notifyRoles: ["all"],
  },
  week_locked: {
    title: "Week Locked",
    priority: "high",
    category: "weekly",
    notifyRoles: ["all"],
  },
  week_unlocked: {
    title: "Week Unlocked",
    priority: "medium",
    category: "weekly",
    notifyRoles: ["all"],
  },
  cash_added: {
    title: "Cash Added",
    priority: "medium",
    category: "weekly",
    notifyRoles: ["all"],
  },
  bank_transfer: {
    title: "Bank Transfer to Cash",
    priority: "medium",
    category: "banking",
    notifyRoles: ["all"],
  },
  cash_transferred: {
    title: "Cash Transferred",
    priority: "medium",
    category: "weekly",
    notifyRoles: ["all"],
  },
  cash_check_performed: {
    title: "Cash Flow Check Completed",
    priority: "medium",
    category: "weekly",
    notifyRoles: ["all"],
  },

  // Time Off
  time_off_allowance_updated: {
    title: "Time Off Allowance Updated",
    priority: "medium",
    category: "workLogs",
    notifyRoles: ["affected"],
  },
  time_off_extra_day_earned: {
    title: "You Earned an Extra Day Off",
    priority: "high",
    category: "workLogs",
    notifyRoles: ["affected"],
  },

  // Settings
  account_settings_changed: {
    title: "Account Settings Changed",
    priority: "low",
    category: "banking",
    notifyRoles: ["all"],
  },
};

/**
 * Format notification message based on type and data
 */
const formatNotificationMessage = (type, data) => {
  const messages = {
    expense_created: `${data.actorName} added ${data.amount} expense for ${data.category}`,
    expense_updated: `${data.actorName} updated an expense in ${data.category}`,
    expense_deleted: `${data.actorName} deleted ${data.amount} expense`,
    photo_uploaded: `${data.actorName} uploaded ${data.photoCount} proof photo(s) for an expense`,
    photo_deleted: `${data.actorName} removed a proof photo`,

    shift_created: `${data.actorName} created ${data.shiftName} for ${data.date}`,
    shift_updated: `${data.actorName} updated ${data.shiftName}`,
    shift_cancelled: `${data.shiftName} on ${data.date} has been cancelled`,
    shift_assigned: `You've been assigned to ${data.shiftName} on ${data.date} (${data.startTime} - ${data.endTime})`,
    shift_replaced: `${data.newMemberName} replaced ${data.oldMemberName} on ${data.shiftName}`,

    shift_checkin_submitted: `${data.memberName} checked in to ${data.shiftName} at ${data.checkInTime}`,
    shift_checkout_submitted: `${data.memberName} checked out from ${data.shiftName} at ${data.checkOutTime}`,

    shift_type_created: `${data.actorName} created new shift type: ${data.shiftTypeName}`,
    shift_type_updated: `${data.actorName} updated shift type: ${data.shiftTypeName}`,

    work_log_added: `${data.actorName} logged ${data.durationHours}h work for ${data.memberName} on ${data.date}`,
    work_log_deleted: `${data.actorName} deleted a work log for ${data.memberName}`,

    extra_hours_submitted: `${data.memberName} requested ${data.hours} extra hours`,
    extra_hours_approved: `Your ${data.hours} extra hours request was approved`,
    extra_hours_rejected: `Your ${data.hours} extra hours request was rejected`,

    member_invited: `${data.actorName} invited ${data.memberEmail} to join`,
    member_removed: `${data.actorName} removed ${data.memberName} from the account`,
    permission_granted: `${data.actorName} granted you "${data.permissionName}" permission`,
    permission_revoked: `${data.actorName} revoked your "${data.permissionName}" permission`,

    ownership_transferred: `Account ownership transferred from ${data.fromName} to ${data.toName}`,
    ownership_transfer_initiated: `${data.fromName} wants to transfer account ownership to you`,
    ownership_correction_requested: `${data.requesterName} requested ownership correction`,

    bank_account_added: `${data.actorName} added bank account: ${data.bankAccountName}`,
    bank_account_removed: `${data.actorName} removed bank account: ${data.bankAccountName}`,
    bank_account_updated: `${data.actorName} updated bank account: ${data.bankAccountName}`,

    category_added: `${data.actorName} added category: ${data.categoryName}`,
    category_updated: `${data.actorName} updated category: ${data.categoryName}`,

    week_created: `${data.actorName} created a new week (${data.startDate} - ${data.endDate})`,
    week_locked: `${data.actorName} locked the week (${data.startDate} - ${data.endDate})`,
    week_unlocked: `${data.actorName} unlocked the week`,

    cash_added: `${data.actorName} added ${data.amount} to cash box`,
    bank_transfer: `${data.actorName} transferred ${data.amount} from ${data.bankAccountName} to cash box`,
    cash_transferred: `${data.actorName} transferred ${data.amount} ${data.direction}`,
    cash_check_performed: `${data.managerName} performed cash check - ${data.status}`,

    time_off_allowance_updated: `Your time off allowance was updated to ${data.allowanceDays} days`,
    time_off_extra_day_earned: `You earned an extra day off! Total balance: ${data.totalDays} days`,

    account_settings_changed: `${data.actorName} updated account settings`,
  };

  return messages[type] || `${data.actorName} performed an action`;
};

/**
 * Get notification recipients based on role requirements
 */
const getNotificationRecipients = async (
  accountId,
  type,
  actorUserId,
  data = {},
) => {
  const typeConfig = NOTIFICATION_TYPES[type];
  if (!typeConfig) return [];

  const notifyRoles = typeConfig.notifyRoles;

  // Get all account members
  const members = await AccountMember.find({ accountId }).populate("userId");

  let recipients = [];

  if (notifyRoles.includes("all")) {
    // Notify all members (including actor for single-user accounts or testing)
    // Filter out actor only if there are other members
    const otherMembers = members.filter(
      (m) => m.userId._id.toString() !== actorUserId.toString(),
    );

    if (otherMembers.length > 0) {
      // Multi-user account - notify others only
      recipients = otherMembers.map((m) => m.userId);
    } else {
      // Single-user account - notify self
      recipients = members.map((m) => m.userId);
    }
  } else if (notifyRoles.includes("assignedMember")) {
    // Notify only the assigned member
    if (data.assignedMemberId) {
      const member = await AccountMember.findById(
        data.assignedMemberId,
      ).populate("userId");
      if (member && member.userId._id.toString() !== actorUserId.toString()) {
        recipients = [member.userId];
      }
    }
  } else if (notifyRoles.includes("affected")) {
    // Notify specific affected user(s)
    if (data.affectedUserIds && Array.isArray(data.affectedUserIds)) {
      const affectedMembers = await User.find({
        _id: { $in: data.affectedUserIds },
      });
      recipients = affectedMembers.filter(
        (u) => u._id.toString() !== actorUserId.toString(),
      );
    } else if (data.affectedUserId) {
      const affectedUser = await User.findById(data.affectedUserId);
      if (
        affectedUser &&
        affectedUser._id.toString() !== actorUserId.toString()
      ) {
        recipients = [affectedUser];
      }
    }
  } else if (notifyRoles.includes("managers")) {
    // Notify members with management permissions
    recipients = members
      .filter(
        (m) =>
          (m.permissions?.accessSettings || m.role === "owner") &&
          m.userId._id.toString() !== actorUserId.toString(),
      )
      .map((m) => m.userId);
  } else if (notifyRoles.includes("owner")) {
    // Notify only owner
    const ownerMember = members.find((m) => m.role === "owner");
    if (
      ownerMember &&
      ownerMember.userId._id.toString() !== actorUserId.toString()
    ) {
      recipients = [ownerMember.userId];
    }
  }

  return recipients;
};

/**
 * Check if user should receive notification based on preferences
 */
const shouldNotifyUser = async (userId, type, channel = "inApp") => {
  try {
    const typeConfig = NOTIFICATION_TYPES[type];
    if (!typeConfig) return false;

    const category = typeConfig.category;

    // Get or create user preferences
    let preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) {
      // Create default preferences
      preferences = await NotificationPreference.create({ userId });
    }

    const channelPrefs =
      channel === "email"
        ? preferences.emailNotifications
        : preferences.inAppNotifications;

    // Check master switch
    if (!channelPrefs.all) return false;

    // Check category-specific preference
    if (channelPrefs[category] !== undefined) {
      return channelPrefs[category];
    }

    return true;
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    return true; // Default to sending notification on error
  }
};

/**
 * Check if current time is within quiet hours
 */
const isWithinQuietHours = (quietHours) => {
  if (!quietHours.enabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const { startTime, endTime } = quietHours;

  if (startTime < endTime) {
    // Normal range (e.g., 22:00 - 08:00 next day is not this case)
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight (e.g., 22:00 - 08:00)
    return currentTime >= startTime || currentTime < endTime;
  }
};

/**
 * Create a notification for a specific user
 */
export const createNotification = async (
  userId,
  accountId,
  actorUserId,
  actorDisplayName,
  type,
  data = {},
) => {
  try {
    // Check if user wants in-app notifications
    const shouldNotify = await shouldNotifyUser(userId, type, "inApp");
    if (!shouldNotify) return null;

    const typeConfig = NOTIFICATION_TYPES[type];
    if (!typeConfig) {
      console.error(`Unknown notification type: ${type}`);
      return null;
    }

    const notification = await Notification.create({
      userId,
      accountId,
      actorUserId,
      actorDisplayName,
      type,
      title: typeConfig.title,
      message: formatNotificationMessage(type, {
        ...data,
        actorName: actorDisplayName,
      }),
      data,
      priority: typeConfig.priority,
    });

    // Check if email should be sent
    const shouldEmail = await shouldNotifyUser(userId, type, "email");
    if (shouldEmail) {
      // Get user preferences to check quiet hours
      const preferences = await NotificationPreference.findOne({ userId });
      if (preferences && !isWithinQuietHours(preferences.quietHours)) {
        // Send email notification (don't await to avoid blocking)
        sendNotificationEmail(notification, userId).catch((err) =>
          console.error("Error sending notification email:", err),
        );
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

/**
 * Create notifications for multiple account members
 */
export const notifyAccountMembers = async (
  accountId,
  type,
  actorUserId,
  actorDisplayName,
  data = {},
) => {
  try {
    console.log(`\n🔔 CREATING NOTIFICATION:`);
    console.log(`   Type: ${type}`);
    console.log(`   Account: ${accountId}`);
    console.log(`   Actor: ${actorDisplayName}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));

    const recipients = await getNotificationRecipients(
      accountId,
      type,
      actorUserId,
      data,
    );

    console.log(`   Recipients: ${recipients.length} users`);
    recipients.forEach((r) =>
      console.log(`     - ${r.firstName} ${r.familyName} (${r.email})`),
    );

    const notifications = await Promise.all(
      recipients.map((user) =>
        createNotification(
          user._id,
          accountId,
          actorUserId,
          actorDisplayName,
          type,
          data,
        ),
      ),
    );

    const successfulNotifications = notifications.filter((n) => n !== null);
    console.log(
      `   ✅ Created ${successfulNotifications.length} notifications\n`,
    );

    return successfulNotifications;
  } catch (error) {
    console.error("❌ Error notifying account members:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId, accountId = null) => {
  try {
    const query = { userId, isRead: false };
    if (accountId) query.accountId = accountId;

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return null;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId, accountId = null) => {
  try {
    const query = { userId, isRead: false };
    if (accountId) query.accountId = accountId;

    const count = await Notification.countDocuments(query);
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

export default {
  createNotification,
  notifyAccountMembers,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
};

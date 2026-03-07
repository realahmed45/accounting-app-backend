import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  getRecentNotifications,
} from "../controllers/notificationController.js";
import { notifyAccountMembers } from "../services/notificationService.js";
import AccountMember from "../models/AccountMember.js";
import NotificationPreference from "../models/NotificationPreference.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// DEBUG ENDPOINT - Check notification preferences and email settings
router.get("/debug-preferences", async (req, res) => {
  try {
    console.log("\\n🔍 DEBUG PREFERENCES ENDPOINT CALLED");
    console.log(`   User: ${req.user.email} (ID: ${req.user.id})`);

    // Get user's preferences
    let preferences = await NotificationPreference.findOne({
      userId: req.user.id,
    });

    if (!preferences) {
      console.log("   ⚠️ No preferences found, creating default...");
      preferences = await NotificationPreference.create({
        userId: req.user.id,
      });
    }

    console.log("   ✅ Preferences found:");
    console.log("   Email Notifications:");
    console.log(`      All: ${preferences.emailNotifications.all}`);
    console.log(`      Banking: ${preferences.emailNotifications.banking}`);
    console.log(`      Weekly: ${preferences.emailNotifications.weekly}`);
    console.log(`      Expenses: ${preferences.emailNotifications.expenses}`);
    console.log(`   Email Frequency: ${preferences.emailFrequency}`);
    console.log(
      `   Desktop Notifications: ${preferences.desktopNotifications}`,
    );
    console.log(`   Notification Sound: ${preferences.notificationSound}`);
    console.log(
      `   Quiet Hours: ${preferences.quietHours?.enabled ? "Enabled" : "Disabled"}`,
    );
    if (preferences.quietHours?.enabled) {
      console.log(`      Start: ${preferences.quietHours.startTime}`);
      console.log(`      End: ${preferences.quietHours.endTime}`);
    }

    res.status(200).json({
      success: true,
      data: {
        userId: req.user.id,
        email: req.user.email,
        preferences: preferences,
        diagnostics: {
          emailsEnabled: preferences.emailNotifications.all,
          bankingEmailsEnabled: preferences.emailNotifications.banking,
          weeklyEmailsEnabled: preferences.emailNotifications.weekly,
          emailFrequency: preferences.emailFrequency,
          quietHoursActive: preferences.quietHours?.enabled || false,
        },
      },
    });
  } catch (error) {
    console.error("❌ Debug preferences failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// TEST ENDPOINT - Create a test notification
router.post("/test", async (req, res) => {
  try {
    console.log("\n🧪 TEST NOTIFICATION ENDPOINT CALLED");
    console.log(`   User: ${req.user.email}`);

    // Get user's account
    const member = await AccountMember.findOne({
      userId: req.user.id,
    }).populate("userId");
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "No account found" });
    }

    console.log(`   Account: ${member.accountId}`);
    console.log(`   Calling notifyAccountMembers...\n`);

    // Create test notification
    await notifyAccountMembers(
      member.accountId.toString(),
      "expense_created",
      req.user.id,
      `${req.user.firstName} ${req.user.lastName || ""}`.trim(),
      {
        amount: "$100.00",
        category: "TEST",
        note: "This is a test notification",
        paymentSource: "cash",
        date: new Date().toISOString(),
      },
    );

    console.log("✅ Test notification created!\n");

    res.status(200).json({
      success: true,
      message: "Test notification created! Check your notifications.",
    });
  } catch (error) {
    console.error("❌ Test notification failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Notification routes
router.get("/recent", getRecentNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.put("/mark-all-read", markAllAsRead);
router.get("/:id", getNotificationById);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);
router.get("/", getNotifications);

export default router;

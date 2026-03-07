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

const router = express.Router();

// All routes require authentication
router.use(protect);

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

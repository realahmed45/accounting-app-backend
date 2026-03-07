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

const router = express.Router();

// All routes require authentication
router.use(protect);

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

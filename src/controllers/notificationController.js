import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import AccountMember from "../models/AccountMember.js";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from "../services/notificationService.js";

// @desc    Get user's notifications with pagination
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      accountId,
      isRead,
      type,
      priority,
      startDate,
      endDate,
    } = req.query;

    const query = { userId: req.user.id };

    // Apply filters
    if (accountId) query.accountId = accountId;
    if (isRead !== undefined) query.isRead = isRead === "true";
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const notifications = await Notification.find(query)
      .populate("accountId", "accountName uniqueId")
      .populate("actorUserId", "firstName familyName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { accountId } = req.query;
    const count = await getUnreadCount(req.user.id, accountId || null);

    console.log(
      `\ud83d\udd14 Unread count requested for user ${req.user.id}: ${count}`,
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("\u274c Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single notification with full details
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate("accountId", "accountName uniqueId currency")
      .populate("actorUserId", "firstName familyName email");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Auto-mark as read when viewed
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(
      req.params.id,
      req.user.id,
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const { accountId } = req.body;
    const result = await markAllNotificationsAsRead(
      req.user.id,
      accountId || null,
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({
      userId: req.user.id,
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updatePreferences = async (req, res) => {
  try {
    const updates = req.body;

    let preferences = await NotificationPreference.findOne({
      userId: req.user.id,
    });

    if (!preferences) {
      // Create new preferences
      preferences = await NotificationPreference.create({
        userId: req.user.id,
        ...updates,
      });
    } else {
      // Update existing preferences
      Object.keys(updates).forEach((key) => {
        if (typeof updates[key] === "object" && !Array.isArray(updates[key])) {
          // Merge nested objects
          preferences[key] = { ...preferences[key], ...updates[key] };
        } else {
          preferences[key] = updates[key];
        }
      });
      await preferences.save();
    }

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get recent notifications (for dropdown)
// @route   GET /api/notifications/recent
// @access  Private
export const getRecentNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const notifications = await Notification.find({ userId: req.user.id })
      .populate("accountId", "accountName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await getUnreadCount(req.user.id);

    console.log(`📥 Recent notifications for user ${req.user.id}:`);
    console.log(`   - Total: ${notifications.length}`);
    console.log(`   - Unread: ${unreadCount}`);
    if (notifications.length > 0) {
      console.log(`   - Latest: ${notifications[0].title}`);
    }

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("\u274c Error fetching recent notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

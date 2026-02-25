import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";

const ACTION_LABELS = {
  expense_created: "Expense created",
  expense_updated: "Expense updated",
  expense_deleted: "Expense deleted",
  member_invited: "Member invited",
  member_removed: "Member removed",
  permission_granted: "Permission granted",
  permission_revoked: "Permission revoked",
  ownership_transferred: "Ownership transferred",
  bank_account_added: "Bank account added",
  bank_account_removed: "Bank account removed",
  category_added: "Category added",
  week_locked: "Week locked",
  week_unlocked: "Week unlocked",
  ownership_correction_requested: "Ownership correction requested",
};

// @desc    Get activity log for an account (paginated)
// @route   GET /api/accounts/:id/activity
// @access  Private — owner or accessSettings permission
export const getActivityLog = async (req, res) => {
  try {
    const caller = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!caller) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }

    if (caller.role !== "owner" && !caller.permissions.accessSettings) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view the activity log",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const actionFilter = req.query.action;

    const filter = { accountId: req.params.id };
    if (actionFilter) filter.action = actionFilter;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    const enriched = logs.map((log) => ({
      _id: log._id,
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] || log.action,
      actorDisplayName: log.actorDisplayName,
      targetDescription: log.targetDescription,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

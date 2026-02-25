import WorkLog from "../models/WorkLog.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";

// @desc    Get work logs
// @route   GET /api/accounts/:id/schedule/work-logs
// @access  Private
export const getAll = async (req, res) => {
  try {
    const { month, memberId } = req.query;
    const query = { accountId: req.params.id };

    if (month) {
      const year = parseInt(month.split("-")[0]);
      const monthIdx = parseInt(month.split("-")[1]) - 1;
      const startDate = new Date(year, monthIdx, 1);
      const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (memberId) query.memberId = memberId;

    const logs = await WorkLog.find(query)
      .populate("memberId", "displayName")
      .populate("loggedBy", "firstName familyName")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create work log entry
// @route   POST /api/accounts/:id/schedule/work-logs
// @access  Private (Manager only)
export const create = async (req, res) => {
  try {
    const { memberId, date, startTime, endTime, note } = req.body;

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration < 0) duration += 24 * 60; // Handle overnight

    const log = await WorkLog.create({
      accountId: req.params.id,
      memberId,
      date: new Date(date),
      startTime,
      endTime,
      durationMinutes: duration,
      note,
      loggedBy: req.user.id,
    });

    // Log activity
    const member = await AccountMember.findById(memberId);
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: "work_log_added",
      targetDescription: `Added work log for ${member.displayName}: ${duration} mins on ${new Date(date).toLocaleDateString()}`,
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete work log
// @route   DELETE /api/accounts/:id/schedule/work-logs/:logId
// @access  Private (Manager only)
export const remove = async (req, res) => {
  try {
    const log = await WorkLog.findOneAndDelete({
      _id: req.params.logId,
      accountId: req.params.id,
    });

    if (!log) return res.status(404).json({ success: false, message: "Work log not found" });

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
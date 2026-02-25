import ExtraHour from "../models/ExtraHour.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";
import Account from "../models/Account.js";
import TimeOffBalance from "../models/TimeOffBalance.js";

// @desc    Get extra hours for an account
// @route   GET /api/accounts/:id/schedule/extra-hours
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

    // If not a manager, only show own records
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const isManager = member.role === "owner" || member.permissions?.manageSchedule;

    if (!isManager) {
      query.memberId = member._id;
    } else if (memberId) {
      query.memberId = memberId;
    }

    const records = await ExtraHour.find(query)
      .populate("memberId", "displayName")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit extra hours
// @route   POST /api/accounts/:id/schedule/extra-hours
// @access  Private
export const submit = async (req, res) => {
  try {
    const { date, startTime, endTime, reason, imageData, latitude, longitude } = req.body;

    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Overlap check
    const existing = await ExtraHour.findOne({
      accountId: req.params.id,
      memberId: member._id,
      date: new Date(date),
      status: { $ne: "rejected" },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "Overlapping extra hours already exist for this date" });
    }

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    let duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration < 0) duration += 24 * 60; // Handle overnight

    const record = await ExtraHour.create({
      accountId: req.params.id,
      memberId: member._id,
      date: new Date(date),
      startTime,
      endTime,
      durationMinutes: duration,
      reason,
      imageData,
      proofLatitude: latitude,
      proofLongitude: longitude,
      proofCapturedAt: new Date(),
    });

    // Log activity
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: member.displayName,
      action: "extra_hours_submitted",
      targetDescription: `Submitted ${duration} mins of extra hours for ${new Date(date).toLocaleDateString()}`,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve/Reject extra hours
// @route   PUT /api/accounts/:id/schedule/extra-hours/:ehId/approve (or reject)
// @access  Private (Manager only)
export const review = async (req, res) => {
  try {
    const { status, rejectionNote } = req.body;
    const ehId = req.params.ehId;

    const record = await ExtraHour.findOne({
      _id: ehId,
      accountId: req.params.id,
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    record.status = status;
    record.reviewedBy = req.user.id;
    record.reviewedAt = new Date();
    if (rejectionNote) record.rejectionNote = rejectionNote;

    await record.save();

    if (status === "approved") {
      // Check for extra day off credit
      await checkAndUpdateTimeOffCredit(req.params.id, record.memberId);
    }

    // Log activity
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: status === "approved" ? "extra_hours_approved" : "extra_hours_rejected",
      targetDescription: `${status === "approved" ? "Approved" : "Rejected"} extra hours for ${new Date(record.date).toLocaleDateString()}`,
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper: Monthly hours to Extra Day Off conversion
const checkAndUpdateTimeOffCredit = async (accountId, memberId) => {
  const account = await Account.findById(accountId);
  const ratio = account.overtimeToExtraDayRatio || 8;
  const year = new Date().getFullYear();

  // Sum all approved overtime for this member this year
  const allApproved = await ExtraHour.find({
    accountId,
    memberId,
    status: "approved",
    date: { 
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31, 23, 59, 59)
    }
  });

  const totalMinutes = allApproved.reduce((sum, r) => sum + r.durationMinutes, 0);
  const totalHours = totalMinutes / 60;
  const extraDaysEarned = Math.floor(totalHours / ratio);

  // Update TimeOffBalance
  let balance = await TimeOffBalance.findOne({ accountId, memberId, year });
  if (!balance) {
    balance = new TimeOffBalance({ accountId, memberId, year });
  }

  if (balance.extraEarnedDays !== extraDaysEarned) {
    balance.extraEarnedDays = extraDaysEarned;
    await balance.save();
    
    // Log credit event
    await ActivityLog.create({
      accountId,
      actorUserId: memberId, // Technically the system/member earned it
      actorDisplayName: "System",
      action: "time_off_extra_day_earned",
      targetDescription: `Member earned an extra day off from overtime (Total extra days: ${extraDaysEarned})`,
    });
  }
};
import Shift from "../models/Shift.js";
import ShiftType from "../models/ShiftType.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";

// Helper to check for overlapping shifts
const hasOverlap = async (accountId, memberId, date, startTime, endTime, excludeShiftId = null) => {
  if (!memberId) return false;

  const query = {
    accountId,
    assignedMemberId: memberId,
    date,
    status: { $ne: "cancelled" },
  };

  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }

  const existingShifts = await Shift.find(query).populate("shiftTypeId");

  for (const s of existingShifts) {
    const sStart = s.shiftTypeId ? s.shiftTypeId.startTime : s.adHocStart;
    const sEnd = s.shiftTypeId ? s.shiftTypeId.endTime : s.adHocEnd;

    // Overlap logic: (StartA < EndB) and (EndA > StartB)
    if (startTime < sEnd && endTime > sStart) {
      return true;
    }
  }

  return false;
};

// @desc    Get shifts in a date range
// @route   GET /api/accounts/:id/schedule/shifts
// @access  Private
export const getRange = async (req, res) => {
  try {
    const { from, to, memberId, status } = req.query;
    const query = { accountId: req.params.id };

    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    if (memberId) query.assignedMemberId = memberId;
    if (status) query.status = status;

    const shifts = await Shift.find(query)
      .populate("shiftTypeId")
      .populate("assignedMemberId", "displayName")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user's upcoming shifts
// @route   GET /api/accounts/:id/schedule/shifts/my
// @access  Private
export const getMine = async (req, res) => {
  try {
    // Find the member record for this user in this account
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shifts = await Shift.find({
      accountId: req.params.id,
      assignedMemberId: member._id,
      date: { $gte: today },
      status: "assigned",
    })
      .populate("shiftTypeId")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create shift
// @route   POST /api/accounts/:id/schedule/shifts
// @access  Private (Manager only)
export const create = async (req, res) => {
  try {
    const { shiftTypeId, date, assignedMemberId, notes, adHocStart, adHocEnd, adHocLabel } = req.body;

    let startTime, endTime;
    if (shiftTypeId) {
      const type = await ShiftType.findById(shiftTypeId);
      if (!type) return res.status(404).json({ success: false, message: "Shift type not found" });
      startTime = type.startTime;
      endTime = type.endTime;
    } else {
      if (!adHocStart || !adHocEnd) {
        return res.status(400).json({ success: false, message: "Ad-hoc shifts require start and end times" });
      }
      startTime = adHocStart;
      endTime = adHocEnd;
    }

    // Conflict detection
    if (assignedMemberId) {
      const overlap = await hasOverlap(req.params.id, assignedMemberId, new Date(date), startTime, endTime);
      if (overlap) {
        return res.status(409).json({ success: false, message: "Member already has an overlapping shift on this date" });
      }
    }

    const shift = await Shift.create({
      accountId: req.params.id,
      shiftTypeId,
      date: new Date(date),
      assignedMemberId,
      status: assignedMemberId ? "assigned" : "open",
      notes,
      adHocStart,
      adHocEnd,
      adHocLabel,
      createdBy: req.user.id,
    });

    // Log activity
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: "shift_created",
      targetDescription: `Created shift for ${new Date(date).toLocaleDateString()}`,
    });

    res.status(201).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update shift instance
// @route   PUT /api/accounts/:id/schedule/shifts/:shiftId
// @access  Private (Manager only)
export const update = async (req, res) => {
  try {
    const { notes, status } = req.body;
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.shiftId, accountId: req.params.id },
      { notes, status },
      { new: true }
    );

    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });

    res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel shift
// @route   DELETE /api/accounts/:id/schedule/shifts/:shiftId
// @access  Private (Manager only)
export const cancel = async (req, res) => {
  try {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.shiftId, accountId: req.params.id },
      { status: "cancelled" },
      { new: true }
    );

    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });

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

// @desc    Assign or replace member in a shift
// @route   POST /api/accounts/:id/schedule/shifts/:shiftId/assign
// @access  Private (Manager only)
export const assign = async (req, res) => {
  try {
    const { memberId } = req.body;
    const shift = await Shift.findOne({ _id: req.params.shiftId, accountId: req.params.id }).populate("shiftTypeId");

    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });

    const startTime = shift.shiftTypeId ? shift.shiftTypeId.startTime : shift.adHocStart;
    const endTime = shift.shiftTypeId ? shift.shiftTypeId.endTime : shift.adHocEnd;

    // Conflict detection
    const overlap = await hasOverlap(req.params.id, memberId, shift.date, startTime, endTime, shift._id);
    if (overlap) {
      return res.status(409).json({ success: false, message: "Member already has an overlapping shift on this date" });
    }

    const oldMemberId = shift.assignedMemberId;
    shift.assignedMemberId = memberId;
    shift.status = "assigned";

    if (oldMemberId && oldMemberId.toString() !== memberId) {
      shift.replacedFrom = oldMemberId;
      shift.replacedAt = new Date();
      shift.replacedBy = req.user.id;
    }

    await shift.save();

    res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
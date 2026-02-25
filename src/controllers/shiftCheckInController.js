import ShiftCheckIn from "../models/ShiftCheckIn.js";
import Shift from "../models/Shift.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";

// @desc    Submit shift check-in
// @route   POST /api/accounts/:id/schedule/shifts/:shiftId/checkin
// @access  Private
export const submit = async (req, res) => {
  try {
    const { imageData, latitude, longitude, locationLabel } = req.body;
    const { id: accountId, shiftId } = req.params;

    const member = await AccountMember.findOne({
      accountId,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const shift = await Shift.findOne({ _id: shiftId, accountId });

    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    // Validation: Own shift
    if (shift.assignedMemberId.toString() !== member._id.toString()) {
      return res.status(403).json({ success: false, message: "This shift is not assigned to you" });
    }

    // Validation: Date is today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(shift.date);
    shiftDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== shiftDate.getTime()) {
      return res.status(400).json({ success: false, message: "You can only check in to today's shifts" });
    }

    // Validation: One check-in per shift
    const existing = await ShiftCheckIn.findOne({ shiftId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Check-in already submitted for this shift" });
    }

    const checkIn = await ShiftCheckIn.create({
      accountId,
      shiftId,
      memberId: member._id,
      imageData,
      latitude,
      longitude,
      locationLabel,
    });

    // Log activity
    await ActivityLog.create({
      accountId,
      actorUserId: req.user.id,
      actorDisplayName: member.displayName,
      action: "shift_checkin_submitted",
      targetDescription: `Checked in to shift for ${shiftDate.toLocaleDateString()}`,
    });

    res.status(201).json({
      success: true,
      data: checkIn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get check-in proof
// @route   GET /api/accounts/:id/schedule/shifts/:shiftId/checkin
// @access  Private
export const get = async (req, res) => {
  try {
    const checkIn = await ShiftCheckIn.findOne({
      shiftId: req.params.shiftId,
      accountId: req.params.id,
    }).populate("memberId", "displayName");

    if (!checkIn) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    res.status(200).json({
      success: true,
      data: checkIn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
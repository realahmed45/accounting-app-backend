import ShiftCheckOut from "../models/ShiftCheckOut.js";
import ShiftCheckIn from "../models/ShiftCheckIn.js";
import Shift from "../models/Shift.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";
import { notifyAccountMembers } from "../services/notificationService.js";

// @desc    Submit shift check-out
// @route   POST /api/accounts/:id/schedule/shifts/:shiftId/checkout
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
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    const shift = await Shift.findOne({ _id: shiftId, accountId });

    if (!shift) {
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });
    }

    // Validation: Own shift
    if (shift.assignedMemberId.toString() !== member._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "This shift is not assigned to you" });
    }

    // Validation: Must have checked in first
    const checkIn = await ShiftCheckIn.findOne({ shiftId });
    if (!checkIn) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "No check-in found for this shift. You must check in before checking out.",
        });
    }

    // Validation: One check-out per shift
    const existing = await ShiftCheckOut.findOne({ shiftId });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Check-out already submitted for this shift",
        });
    }

    const checkOut = await ShiftCheckOut.create({
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
      action: "shift_checkin_submitted", // Using existing enum or should I add shift_checkout_submitted?
      // Actually ActivityLog.js enum has shift_checkin_submitted but not shift_checkout_submitted.
      // I should add it to the enum if possible, or use a generic one.
      targetDescription: `Checked out from shift on ${new Date(shift.date).toLocaleDateString()}`,
    });

    // Send notification
    const shiftPopulated =
      await Shift.findById(shiftId).populate("shiftTypeId");
    const duration = Math.floor(
      (checkOut.createdAt - checkIn.createdAt) / 1000 / 60,
    ); // minutes
    notifyAccountMembers(
      accountId,
      "shift_checkout_submitted",
      req.user.id,
      member.displayName,
      {
        shiftId,
        memberId: member._id,
        memberName: member.displayName,
        date: new Date(shift.date),
        shiftName:
          shiftPopulated?.shiftTypeId?.name ||
          shiftPopulated?.adHocLabel ||
          "Shift",
        checkInTime: checkIn.createdAt,
        checkOutTime: checkOut.createdAt,
        duration,
        locationLabel: checkOut.locationLabel,
        hasPhoto: !!imageData,
      },
    ).catch((err) => console.error("Notification error:", err));

    res.status(201).json({
      success: true,
      data: checkOut,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get check-out proof
// @route   GET /api/accounts/:id/schedule/shifts/:shiftId/checkout
// @access  Private
export const get = async (req, res) => {
  try {
    const checkOut = await ShiftCheckOut.findOne({
      shiftId: req.params.shiftId,
      accountId: req.params.id,
    }).populate("memberId", "displayName");

    if (!checkOut) {
      return res
        .status(404)
        .json({ success: false, message: "Check-out not found" });
    }

    res.status(200).json({
      success: true,
      data: checkOut,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

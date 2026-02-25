import ShiftType from "../models/ShiftType.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountMember from "../models/AccountMember.js";

// @desc    Get all shift types for an account
// @route   GET /api/accounts/:id/schedule/shift-types
// @access  Private
export const getAll = async (req, res) => {
  try {
    const shiftTypes = await ShiftType.find({
      accountId: req.params.id,
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: shiftTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create shift type
// @route   POST /api/accounts/:id/schedule/shift-types
// @access  Private (Manager only)
export const create = async (req, res) => {
  try {
    const { name, startTime, endTime, breakMinutes, color } = req.body;

    const shiftType = await ShiftType.create({
      accountId: req.params.id,
      name,
      startTime,
      endTime,
      breakMinutes,
      color,
    });

    // Log activity
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: "shift_type_created",
      targetDescription: `Created shift type: ${name} (${startTime}-${endTime})`,
    });

    res.status(201).json({
      success: true,
      data: shiftType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update shift type
// @route   PUT /api/accounts/:id/schedule/shift-types/:typeId
// @access  Private (Manager only)
export const update = async (req, res) => {
  try {
    const shiftType = await ShiftType.findOneAndUpdate(
      { _id: req.params.typeId, accountId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!shiftType) {
      return res.status(404).json({
        success: false,
        message: "Shift type not found",
      });
    }

    // Log activity
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: "shift_type_updated",
      targetDescription: `Updated shift type: ${shiftType.name}`,
    });

    res.status(200).json({
      success: true,
      data: shiftType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Deactivate shift type
// @route   DELETE /api/accounts/:id/schedule/shift-types/:typeId
// @access  Private (Manager only)
export const remove = async (req, res) => {
  try {
    const shiftType = await ShiftType.findOneAndUpdate(
      { _id: req.params.typeId, accountId: req.params.id },
      { isActive: false },
      { new: true }
    );

    if (!shiftType) {
      return res.status(404).json({
        success: false,
        message: "Shift type not found",
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
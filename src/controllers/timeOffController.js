import TimeOffBalance from "../models/TimeOffBalance.js";
import Account from "../models/Account.js";
import AccountMember from "../models/AccountMember.js";
import ActivityLog from "../models/ActivityLog.js";
import { notifyAccountMembers } from "../services/notificationService.js";

// @desc    Get all members' time off balances
// @route   GET /api/accounts/:id/schedule/time-off
// @access  Private (Manager only)
export const getAll = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const balances = await TimeOffBalance.find({
      accountId: req.params.id,
      year,
    }).populate("memberId", "displayName");

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get own time off balance
// @route   GET /api/accounts/:id/schedule/time-off/me
// @access  Private
export const getMine = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    let balance = await TimeOffBalance.findOne({
      accountId: req.params.id,
      memberId: member._id,
      year,
    });

    if (!balance) {
      // Auto-create for current year if missing
      balance = await TimeOffBalance.create({
        accountId: req.params.id,
        memberId: member._id,
        year,
      });
    }

    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update annual allowance
// @route   PUT /api/accounts/:id/schedule/time-off/:memberId/allowance
// @access  Private (Manager only)
export const setAllowance = async (req, res) => {
  try {
    const { annualAllowanceDays, year = new Date().getFullYear() } = req.body;
    const { id: accountId, memberId } = req.params;

    let balance = await TimeOffBalance.findOne({ accountId, memberId, year });
    if (!balance) {
      balance = new TimeOffBalance({ accountId, memberId, year });
    }

    balance.annualAllowanceDays = annualAllowanceDays;
    await balance.save();

    // Get member details for notification
    const member = await AccountMember.findById(memberId).populate(
      "userId",
      "firstName lastName",
    );

    // Log activity
    await ActivityLog.create({
      accountId,
      actorUserId: req.user.id,
      actorDisplayName: req.user.firstName + " " + req.user.familyName,
      action: "time_off_allowance_updated",
      targetDescription: `Updated annual allowance to ${annualAllowanceDays} days`,
    });

    // Send notification to the member
    notifyAccountMembers(
      accountId,
      "time_off_allowance_updated",
      req.user.id,
      `${req.user.firstName} ${req.user.lastName || req.user.familyName || ""}`.trim(),
      {
        memberId: member._id,
        memberName: member.userId
          ? `${member.userId.firstName} ${member.userId.lastName}`
          : "Member",
        allowanceDays: annualAllowanceDays,
        year,
      },
    ).catch((err) => console.error("Notification error:", err));

    res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update overtime-to-day ratio
// @route   PUT /api/accounts/:id/schedule/time-off/settings
// @access  Private (Manager only)
export const setRatio = async (req, res) => {
  try {
    const { ratio } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { overtimeToExtraDayRatio: ratio },
      { new: true },
    );

    res.status(200).json({
      success: true,
      data: { overtimeToExtraDayRatio: account.overtimeToExtraDayRatio },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

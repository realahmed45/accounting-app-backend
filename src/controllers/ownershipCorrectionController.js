import OwnershipTransferRequest from "../models/OwnershipTransferRequest.js";
import AccountMember from "../models/AccountMember.js";
import { logActivity } from "../utils/activityLogger.js";

// @desc    Request a correction to a wrong ownership transfer
// @route   POST /api/accounts/:id/ownership-correction
// @access  Private — original owner (now view-only) or current owner
export const requestOwnershipCorrection = async (req, res) => {
  try {
    const { intendedEmail, intendedWhatsApp, confirm } = req.body;

    if (!intendedEmail) {
      return res
        .status(400)
        .json({ success: false, message: "intendedEmail is required" });
    }
    if (!confirm) {
      return res
        .status(400)
        .json({ success: false, message: "confirm must be true" });
    }

    const caller = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!caller) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }

    // Must be current owner OR the original owner who initiated the transfer (viewOnly)
    const isOwner = caller.role === "owner";
    const isViewOnlyOriginalOwner = caller.viewOnly === true;

    if (!isOwner && !isViewOnlyOriginalOwner) {
      return res.status(403).json({
        success: false,
        message:
          "Only the account owner or the original owner can request a correction",
      });
    }

    // Find a pending transfer request for this account
    const transferRequest = await OwnershipTransferRequest.findOne({
      accountId: req.params.id,
      status: { $in: ["pending", "accepted"] },
    }).sort({ createdAt: -1 });

    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: "No ownership transfer found for this account",
      });
    }

    if (transferRequest.status === "correctionRequested") {
      return res.status(400).json({
        success: false,
        message: "A correction has already been requested for this transfer",
      });
    }

    transferRequest.status = "correctionRequested";
    transferRequest.correctionTargetEmail = intendedEmail.toLowerCase().trim();
    if (intendedWhatsApp)
      transferRequest.correctionTargetWhatsApp = intendedWhatsApp;
    transferRequest.correctionRequestedAt = new Date();
    await transferRequest.save();

    const actorName =
      `${req.user.firstName || ""} ${req.user.familyName || req.user.lastName || ""}`.trim() ||
      req.user.email;

    logActivity({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: actorName,
      action: "ownership_correction_requested",
      targetDescription: `Correction requested: intended recipient is ${intendedEmail}`,
      metadata: {
        originalToEmail: transferRequest.toEmail,
        correctionTargetEmail: intendedEmail,
        correctionRequestedAt: transferRequest.correctionRequestedAt,
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Your correction request has been submitted. Ownership will be moved to the correct person within 4 days.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending ownership transfer request for an account (if any)
// @route   GET /api/accounts/:id/ownership-transfer-status
// @access  Private — must be a member
export const getTransferStatus = async (req, res) => {
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

    const transferRequest = await OwnershipTransferRequest.findOne({
      accountId: req.params.id,
      status: { $in: ["pending", "correctionRequested"] },
    })
      .sort({ createdAt: -1 })
      .select(
        "status toEmail correctionTargetEmail correctionRequestedAt createdAt expiresAt fromUserId",
      );

    if (!transferRequest) {
      return res.status(200).json({ success: true, data: null });
    }

    // Include whether the caller initiated the transfer (so frontend can show Help button)
    const isInitiator = transferRequest.fromUserId.toString() === req.user.id;

    res.status(200).json({
      success: true,
      data: {
        status: transferRequest.status,
        toEmail: transferRequest.toEmail,
        correctionTargetEmail: transferRequest.correctionTargetEmail,
        correctionRequestedAt: transferRequest.correctionRequestedAt,
        createdAt: transferRequest.createdAt,
        expiresAt: transferRequest.expiresAt,
        isInitiator,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

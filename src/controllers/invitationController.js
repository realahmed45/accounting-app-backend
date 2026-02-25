import Invitation from "../models/Invitation.js";
import AccountMember from "../models/AccountMember.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import OwnershipTransferRequest from "../models/OwnershipTransferRequest.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth.js";
import { logActivity } from "../utils/activityLogger.js";

const ALL_PERMISSIONS = {
  calculateCash: true,
  accessSettings: true,
  addUser: true,
  addCategories: true,
  addBankAccount: true,
  makeExpense: true,
  createAccountDownward: true,
  createAccountUpward: true,
};

const NO_PERMISSIONS = {
  calculateCash: false,
  accessSettings: false,
  addUser: false,
  addCategories: false,
  addBankAccount: false,
  makeExpense: false,
  createAccountDownward: false,
  createAccountUpward: false,
};

// @desc    Get all pending invitations for an account
// @route   GET /api/accounts/:id/invitations
// @access  Private — must be owner or have addUser permission
export const getAccountInvitations = async (req, res) => {
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
    if (caller.role !== "owner" && !caller.permissions.addUser) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    const invitations = await Invitation.find({
      accountId: req.params.id,
      status: "pending",
    })
      .populate("invitedByUserId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel / revoke a pending invitation
// @route   DELETE /api/accounts/:id/invitations/:invId
// @access  Private — must be owner or have addUser permission
export const cancelInvitation = async (req, res) => {
  try {
    const caller = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });
    if (!caller || (caller.role !== "owner" && !caller.permissions.addUser)) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied" });
    }

    const invitation = await Invitation.findOne({
      _id: req.params.invId,
      accountId: req.params.id,
    });
    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found" });
    }

    await invitation.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get details of a pending invitation (public — no auth)
// @route   GET /api/invitations/:token
// @access  Public
export const getInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: "pending",
    })
      .populate("accountId", "accountName accountType")
      .populate("invitedByUserId", "firstName lastName email");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or has already been used / expired",
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(410).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        displayName: invitation.displayName,
        accountName: invitation.accountId?.accountName,
        accountType: invitation.accountId?.accountType,
        inviterName:
          `${invitation.invitedByUserId?.firstName || ""} ${invitation.invitedByUserId?.lastName || ""}`.trim() ||
          invitation.invitedByUserId?.email,
        permissions: invitation.permissions,
        viewOnly: invitation.viewOnly,
        invitationType: invitation.type,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an invitation — create user if needed, create AccountMember
//          Also handles ownershipTransfer invitations (full role swap)
// @route   POST /api/invitations/:token/accept
// @access  Public
export const acceptInvitation = async (req, res) => {
  try {
    const { firstName, lastName, familyName, password } = req.body;

    const first = firstName || "";
    const last = familyName || lastName || "";

    if (!first || !last || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const invitation = await Invitation.findOne({
      token: req.params.token,
      status: "pending",
    }).populate("accountId", "accountName userId ownerId");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or already used",
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(410).json({
        success: false,
        message: "This invitation has expired",
      });
    }

    // ── Create or find the user ──────────────────────────────────────────
    let user = await User.findOne({ email: invitation.email });

    if (user) {
      const existing = await AccountMember.findOne({
        accountId: invitation.accountId._id,
        userId: user._id,
      });
      if (existing && invitation.type !== "ownershipTransfer") {
        invitation.status = "accepted";
        await invitation.save();
        const jwtToken = generateToken(user._id);
        return res.status(200).json({
          success: true,
          message: "You are already a member of this account",
          data: {
            token: jwtToken,
            user: {
              _id: user._id,
              firstName: user.firstName,
              familyName: user.familyName,
              email: user.email,
            },
          },
        });
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({
        firstName: first,
        familyName: last,
        email: invitation.email,
        password: hashedPassword,
      });
    }

    // ── Handle ownership transfer ────────────────────────────────────────
    if (invitation.type === "ownershipTransfer") {
      const accountId = invitation.accountId._id;

      let newOwnerMember = await AccountMember.findOne({
        accountId,
        userId: user._id,
      });
      if (!newOwnerMember) {
        newOwnerMember = await AccountMember.create({
          accountId,
          userId: user._id,
          displayName: `${first} ${last}`.trim(),
          role: "owner",
          permissions: { ...ALL_PERMISSIONS },
          viewOnly: false,
          invitedBy: invitation.invitedByUserId,
        });
      } else {
        newOwnerMember.role = "owner";
        newOwnerMember.permissions = { ...ALL_PERMISSIONS };
        newOwnerMember.viewOnly = false;
        newOwnerMember.markModified("permissions");
        await newOwnerMember.save();
      }

      // Demote original owner to view-only member
      const originalOwnerMember = await AccountMember.findOne({
        accountId,
        userId: invitation.invitedByUserId,
      });
      if (originalOwnerMember && originalOwnerMember.role === "owner") {
        originalOwnerMember.role = "member";
        originalOwnerMember.viewOnly = true;
        originalOwnerMember.permissions = { ...NO_PERMISSIONS };
        originalOwnerMember.markModified("permissions");
        await originalOwnerMember.save();
      }

      await Account.findByIdAndUpdate(accountId, { ownerId: user._id });

      await OwnershipTransferRequest.findOneAndUpdate(
        { accountId, inviteToken: invitation.token },
        { status: "accepted" },
      );

      logActivity({
        accountId: accountId.toString(),
        actorUserId: user._id.toString(),
        actorDisplayName: `${first} ${last}`.trim(),
        action: "ownership_transferred",
        targetDescription: `Ownership accepted by ${invitation.email}`,
        metadata: {
          newOwnerId: user._id,
          fromUserId: invitation.invitedByUserId,
        },
      });

      invitation.status = "accepted";
      await invitation.save();

      const jwtToken = generateToken(user._id);
      return res.status(201).json({
        success: true,
        message: `You are now the owner of ${invitation.accountId.accountName}`,
        data: {
          token: jwtToken,
          user: {
            _id: user._id,
            firstName: user.firstName,
            familyName: user.familyName,
            email: user.email,
          },
        },
      });
    }

    // ── Standard invitation ──────────────────────────────────────────────
    await AccountMember.create({
      accountId: invitation.accountId._id,
      userId: user._id,
      displayName: invitation.displayName || `${first} ${last}`.trim(),
      role: "member",
      permissions: invitation.permissions,
      viewOnly: invitation.viewOnly || false,
      invitedBy: invitation.invitedByUserId,
    });

    logActivity({
      accountId: invitation.accountId._id.toString(),
      actorUserId: user._id.toString(),
      actorDisplayName: `${first} ${last}`.trim(),
      action: "member_invited",
      targetDescription: `${invitation.email} accepted invitation`,
      metadata: { userId: user._id, email: invitation.email },
    });

    invitation.status = "accepted";
    await invitation.save();

    const jwtToken = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: `Welcome! You've joined ${invitation.accountId.accountName}`,
      data: {
        token: jwtToken,
        user: {
          _id: user._id,
          firstName: user.firstName,
          familyName: user.familyName,
          email: user.email,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get resend details for an invitation (frontend sends email via EmailJS)
// @route   POST /api/invitations/resend
// @access  Private
export const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const invitation = await Invitation.findById(invitationId)
      .populate("accountId", "accountName")
      .populate("invitedByUserId", "firstName familyName lastName email");

    if (!invitation || invitation.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Pending invitation not found",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://accounting-app-lyart.vercel.app";
    const inviteLink = `${frontendUrl}?invite=1&token=${invitation.token}`;
    const inviterFirst = invitation.invitedByUserId?.firstName || "";
    const inviterLast =
      invitation.invitedByUserId?.familyName ||
      invitation.invitedByUserId?.lastName ||
      "";
    const inviterName =
      `${inviterFirst} ${inviterLast}`.trim() ||
      invitation.invitedByUserId?.email;

    res.status(200).json({
      success: true,
      inviteToken: invitation.token,
      inviteLink,
      inviterName,
      accountName: invitation.accountId.accountName,
      toEmail: invitation.email,
      permissions: invitation.permissions,
      invitationType: invitation.type,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

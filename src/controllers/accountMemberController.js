import AccountMember from "../models/AccountMember.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import OwnershipTransferRequest from "../models/OwnershipTransferRequest.js";
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

// Helper: get the calling user's AccountMember record for this account
const getCallerMember = async (accountId, userId) => {
  return AccountMember.findOne({ accountId, userId });
};

// Helper: check if account exists and is accessible
const findAccount = async (accountId) => {
  return Account.findById(accountId);
};

// @desc    Get all members of an account
// @route   GET /api/accounts/:id/members
// @access  Private — must be a member
export const getMembers = async (req, res) => {
  try {
    const account = await findAccount(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Caller must be a member
    const caller = await getCallerMember(req.params.id, req.user.id);
    if (!caller) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }

    const members = await AccountMember.find({ accountId: req.params.id })
      .populate("userId", "firstName lastName email")
      .sort({ role: 1, createdAt: 1 });

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite a member to an account by email — sends invitation email
// @route   POST /api/accounts/:id/members
// @access  Private — must be owner or have addUser permission
export const addMember = async (req, res) => {
  try {
    const { email, displayName, permissions } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const account = await findAccount(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Caller must be owner or have addUser permission
    const caller = await getCallerMember(req.params.id, req.user.id);
    if (!caller) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }
    if (caller.role !== "owner" && !caller.permissions.addUser) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add users",
      });
    }

    // If user already exists in DB, check they're not already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const alreadyMember = await AccountMember.findOne({
        accountId: req.params.id,
        userId: existingUser._id,
      });
      if (alreadyMember) {
        return res.status(400).json({
          success: false,
          message: "This user is already a member of this account",
        });
      }
    }

    // Check if there's already a pending invitation for this email + account
    const existingInvite = await Invitation.findOne({
      accountId: req.params.id,
      email: normalizedEmail,
      status: "pending",
    });
    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message:
          "An invitation has already been sent to this email. Ask them to check their inbox, or resend.",
      });
    }

    // Cascade rule: can only grant permissions you yourself have (unless owner)
    let grantedPermissions = { ...NO_PERMISSIONS };
    if (permissions) {
      for (const key of Object.keys(NO_PERMISSIONS)) {
        if (permissions[key]) {
          if (caller.role === "owner" || caller.permissions[key]) {
            grantedPermissions[key] = true;
          }
        }
      }
    } else {
      grantedPermissions.makeExpense = true;
    }

    // Create invitation record — expires in 7 days
    const token = Invitation.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const viewOnly = req.body.viewOnly === true;

    const invitation = await Invitation.create({
      accountId: req.params.id,
      invitedByUserId: req.user.id,
      email: normalizedEmail,
      displayName: displayName || "",
      permissions: grantedPermissions,
      token,
      expiresAt,
      type: "invitation",
      viewOnly,
    });

    const frontendUrl = process.env.FRONTEND_URL || "https://accounting-app-lyart.vercel.app";
    const inviteLink = `${frontendUrl}?invite=1&token=${token}`;
    const inviterName =
      `${req.user.firstName || ""} ${req.user.familyName || req.user.lastName || ""}`.trim() ||
      req.user.email;

    logActivity({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: inviterName,
      action: "member_invited",
      targetDescription: `Member invited: ${normalizedEmail}`,
      metadata: { email: normalizedEmail, permissions: grantedPermissions },
    });

    res.status(201).json({
      success: true,
      inviteToken: token,
      inviteLink,
      inviterName,
      accountName: account.accountName,
      message: `Invitation created for ${normalizedEmail}`,
      data: {
        invitationId: invitation._id,
        email: normalizedEmail,
        displayName: displayName || "",
        permissions: grantedPermissions,
        expiresAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Invitation already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a member's permissions / displayName
// @route   PUT /api/accounts/:id/members/:memberId
// @access  Private — must be owner or have addUser permission
export const updateMember = async (req, res) => {
  try {
    const { permissions, displayName } = req.body;

    const account = await findAccount(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const caller = await getCallerMember(req.params.id, req.user.id);
    if (!caller) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }
    if (caller.role !== "owner" && !caller.permissions.addUser) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit users",
      });
    }

    const target = await AccountMember.findById(req.params.memberId);
    if (!target || target.accountId.toString() !== req.params.id) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    // Cannot demote/edit the owner
    if (target.role === "owner") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot edit the account owner" });
    }

    if (displayName) target.displayName = displayName;

    if (permissions) {
      for (const key of Object.keys(NO_PERMISSIONS)) {
        if (permissions[key] !== undefined) {
          if (permissions[key] === true) {
            // Cascade: can only grant perms you have
            if (caller.role === "owner" || caller.permissions[key]) {
              target.permissions[key] = true;
            }
          } else {
            target.permissions[key] = false;
          }
        }
      }
      target.markModified("permissions");
    }

    await target.save();
    await target.populate("userId", "firstName lastName email");

    res.status(200).json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a member from an account
// @route   DELETE /api/accounts/:id/members/:memberId
// @access  Private — must be owner OR the member themselves (leaving)
export const removeMember = async (req, res) => {
  try {
    const account = await findAccount(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const target = await AccountMember.findById(req.params.memberId);
    if (!target || target.accountId.toString() !== req.params.id) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    // Owner cannot be removed
    if (target.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the account owner. Transfer ownership first.",
      });
    }

    const caller = await getCallerMember(req.params.id, req.user.id);
    const isSelf = target.userId.toString() === req.user.id;

    if (!isSelf && (!caller || caller.role !== "owner")) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can remove other members",
      });
    }

    await target.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate ownership transfer — creates invitation + transfer request
// @route   POST /api/accounts/:id/members/transfer-ownership
// @access  Private — current owner only
export const transferOwnership = async (req, res) => {
  try {
    const { toEmail, toWhatsApp, toTelegram } = req.body;

    if (!toEmail) {
      return res
        .status(400)
        .json({ success: false, message: "toEmail is required" });
    }

    const normalizedEmail = toEmail.toLowerCase().trim();

    const account = await findAccount(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const callerMember = await getCallerMember(req.params.id, req.user.id);
    if (!callerMember || callerMember.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the current owner can transfer ownership",
      });
    }

    if (normalizedEmail === req.user.email) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot transfer ownership to yourself",
        });
    }

    // Block if there's already a pending transfer
    const existingTransfer = await OwnershipTransferRequest.findOne({
      accountId: req.params.id,
      status: "pending",
    });
    if (existingTransfer) {
      return res.status(400).json({
        success: false,
        message:
          "There is already a pending ownership transfer for this account. Cancel it first or wait for it to expire.",
      });
    }

    // Create an ownershipTransfer invitation
    const token = Invitation.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.create({
      accountId: req.params.id,
      invitedByUserId: req.user.id,
      email: normalizedEmail,
      displayName: "",
      permissions: { ...ALL_PERMISSIONS },
      token,
      expiresAt,
      type: "ownershipTransfer",
    });

    // Create the transfer request record
    await OwnershipTransferRequest.create({
      accountId: req.params.id,
      fromUserId: req.user.id,
      toEmail: normalizedEmail,
      toWhatsApp: toWhatsApp || "",
      toTelegram: toTelegram || "",
      inviteToken: token,
      status: "pending",
      expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL || "https://accounting-app-lyart.vercel.app";
    const inviteLink = `${frontendUrl}?invite=1&token=${token}`;
    const inviterName =
      `${req.user.firstName || ""} ${req.user.familyName || req.user.lastName || ""}`.trim() ||
      req.user.email;

    logActivity({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: inviterName,
      action: "ownership_transferred",
      targetDescription: `Ownership transfer initiated to ${normalizedEmail}`,
      metadata: { toEmail: normalizedEmail },
    });

    res.status(201).json({
      success: true,
      inviteToken: token,
      inviteLink,
      inviterName,
      accountName: account.accountName,
      message: `Ownership transfer initiated. ${normalizedEmail} will receive an invitation to accept.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's member record for an account (includes permissions)
//          Auto-bootstraps an owner record if the user is the account creator (legacy accounts)
// @route   GET /api/accounts/:id/members/me
// @access  Private
export const getMyMembership = async (req, res) => {
  try {
    let member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    }).populate("userId", "firstName lastName email");

    // Legacy migration: if no member record exists but this user is the account creator/owner, bootstrap one
    if (!member) {
      const account = await Account.findById(req.params.id);
      if (
        account &&
        (account.userId?.toString() === req.user.id ||
          account.ownerId?.toString() === req.user.id)
      ) {
        const newMember = await AccountMember.create({
          accountId: req.params.id,
          userId: req.user.id,
          displayName:
            `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
            req.user.email,
          role: "owner",
          permissions: { ...ALL_PERMISSIONS },
          invitedBy: null,
        });
        // Also set ownerId on account if missing
        if (!account.ownerId) {
          account.ownerId = req.user.id;
          await account.save();
        }
        member = await AccountMember.findById(newMember._id).populate(
          "userId",
          "firstName lastName email",
        );
      }
    }

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Not a member of this account" });
    }

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

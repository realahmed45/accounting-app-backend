import AccountRelationship from "../models/AccountRelationship.js";
import Account from "../models/Account.js";
import AccountMember from "../models/AccountMember.js";
import Category from "../models/Category.js";

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

// @desc    Get all relationships for an account (parent, children, sideways)
// @route   GET /api/accounts/:id/relationships
// @access  Private — must be a member
export const getRelationships = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
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

    // Relationships where this account is parent or child
    const [asParent, asChild] = await Promise.all([
      AccountRelationship.find({ parentAccountId: req.params.id }).populate(
        "childAccountId",
        "accountName accountType",
      ),
      AccountRelationship.find({ childAccountId: req.params.id }).populate(
        "parentAccountId",
        "accountName accountType",
      ),
    ]);

    res.status(200).json({
      success: true,
      data: {
        asParent,
        asChild,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a downward sub-account under this account
// @route   POST /api/accounts/:id/relationships/downward
// @access  Private — must have createAccountDownward permission
export const createDownwardAccount = async (req, res) => {
  try {
    const {
      accountName,
      accountType,
      category,
      subcategory,
      customDescription,
      description,
      currency,
      timezone,
      accessLevel,
    } = req.body;

    const parentAccount = await Account.findById(req.params.id);
    if (!parentAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Parent account not found" });
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
    if (caller.role !== "owner" && !caller.permissions.createAccountDownward) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You don't have permission to create sub-accounts",
        });
    }

    // Create the child account
    const childAccount = await Account.create({
      accountName: accountName || "Sub Account",
      accountType: accountType || "business",
      category: category || null,
      subcategory: subcategory || null,
      customDescription: customDescription || null,
      description: description || null,
      userId: req.user.id,
      ownerId: req.user.id,
      parentAccountId: req.params.id,
      currency: currency || parentAccount.currency || "USD",
      timezone: timezone || parentAccount.timezone || "UTC",
    });

    // Create default categories
    const defaultCategories = [
      "Food & Dining",
      "Transportation",
      "Utilities",
      "Shopping",
      "Entertainment",
      "Healthcare",
      "Other",
    ];
    await Promise.all(
      defaultCategories.map((name) =>
        Category.create({ accountId: childAccount._id, name, isDefault: true }),
      ),
    );

    // Create owner AccountMember for caller on child account
    await AccountMember.create({
      accountId: childAccount._id,
      userId: req.user.id,
      displayName: `${req.user.firstName} ${req.user.lastName}`,
      role: "owner",
      permissions: { ...ALL_PERMISSIONS },
      invitedBy: null,
    });

    // Create the relationship record
    const relationship = await AccountRelationship.create({
      parentAccountId: req.params.id,
      childAccountId: childAccount._id,
      relationshipType: "downward",
      accessLevel: accessLevel || "full",
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: { account: childAccount, relationship },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Relationship already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Link this account upward to an existing parent account
// @route   POST /api/accounts/:id/relationships/upward
// @access  Private — caller must be owner of this account AND member of parent
export const linkUpwardAccount = async (req, res) => {
  try {
    const { parentAccountId, accessLevel } = req.body;

    if (!parentAccountId) {
      return res
        .status(400)
        .json({ success: false, message: "parentAccountId is required" });
    }

    const childAccount = await Account.findById(req.params.id);
    if (!childAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const parentAccount = await Account.findById(parentAccountId);
    if (!parentAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Parent account not found" });
    }

    // Caller must have createAccountUpward on this account
    const callerOnChild = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });
    if (!callerOnChild) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member of this account" });
    }
    if (
      callerOnChild.role !== "owner" &&
      !callerOnChild.permissions.createAccountUpward
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You don't have permission to link to a parent account",
        });
    }

    // Caller must also be a member of the parent
    const callerOnParent = await AccountMember.findOne({
      accountId: parentAccountId,
      userId: req.user.id,
    });
    if (!callerOnParent) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You must be a member of the parent account to link to it",
        });
    }

    // Update child account's parentAccountId
    childAccount.parentAccountId = parentAccountId;
    await childAccount.save();

    const relationship = await AccountRelationship.create({
      parentAccountId,
      childAccountId: req.params.id,
      relationshipType: "upward",
      accessLevel: accessLevel || "view",
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Relationship already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create sideways (peer) relationship between two sub-accounts
// @route   POST /api/accounts/:id/relationships/sideways
// @access  Private — caller must be owner of parent and both children must be under this parent
export const linkSidewaysAccount = async (req, res) => {
  try {
    const { targetAccountId, accessLevel } = req.body;

    if (!targetAccountId) {
      return res
        .status(400)
        .json({ success: false, message: "targetAccountId is required" });
    }

    // Both accounts must share a parent, or this route itself IS the parent granting sideways access
    const sourceAccount = await Account.findById(req.params.id);
    const targetAccount = await Account.findById(targetAccountId);

    if (!sourceAccount || !targetAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Caller must be a member of both accounts with appropriate perms
    const [callerSource, callerTarget] = await Promise.all([
      AccountMember.findOne({ accountId: req.params.id, userId: req.user.id }),
      AccountMember.findOne({
        accountId: targetAccountId,
        userId: req.user.id,
      }),
    ]);

    if (!callerSource || !callerTarget) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "You must be a member of both accounts to create a sideways link",
        });
    }

    const relationship = await AccountRelationship.create({
      parentAccountId: req.params.id,
      childAccountId: targetAccountId,
      relationshipType: "sideways",
      accessLevel: accessLevel || "view",
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Relationship already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a relationship
// @route   DELETE /api/accounts/:id/relationships/:relId
// @access  Private — must be owner of the account
export const removeRelationship = async (req, res) => {
  try {
    const relationship = await AccountRelationship.findById(req.params.relId);
    if (!relationship) {
      return res
        .status(404)
        .json({ success: false, message: "Relationship not found" });
    }

    // Caller must be owner of the account
    const caller = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });
    if (!caller || caller.role !== "owner") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only the account owner can remove relationships",
        });
    }

    await relationship.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

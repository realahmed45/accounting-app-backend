import Account from "../models/Account.js";
import Category from "../models/Category.js";
import Person from "../models/Person.js";
import AccountMember from "../models/AccountMember.js";
import mongoose from "mongoose";
import {
  generateAccountUniqueId,
  validateUniqueIdFormat,
} from "../utils/generateUniqueId.js";

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

// @desc    Create new account
// @route   POST /api/accounts
// @access  Private
export const createAccount = async (req, res) => {
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
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Personal account — no category required
      if (accountType === "personal") {
        // Generate unique ID for this account
        const uniqueId = await generateAccountUniqueId();

        const [account] = await Account.create(
          [
            {
              accountName: accountName || "Personal",
              accountType: "personal",
              description: description || null,
              userId: req.user.id,
              ownerId: req.user.id,
              uniqueId,
              currency: null,
              timezone: timezone || "UTC",
            },
          ],
          { session },
        );

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
        await Category.insertMany(
          defaultCategories.map((categoryName) => ({
            accountId: account._id,
            name: categoryName,
            isDefault: true,
          })),
          { session },
        );

        // Bootstrap creator as owner member
        await AccountMember.create(
          [
            {
              accountId: account._id,
              userId: req.user.id,
              displayName:
                `${req.user.firstName} ${req.user.lastName}`.trim() ||
                req.user.email,
              role: "owner",
              permissions: { ...ALL_PERMISSIONS },
              invitedBy: null,
            },
          ],
          { session },
        );

        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({ success: true, data: account });
      }

      // Business account — category required
      if (!category) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Category is required for business accounts",
        });
      }

      if (category === "Other" && !customDescription) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Custom description is required for Other category",
        });
      }

      // Generate unique ID for business account
      const uniqueId = await generateAccountUniqueId();

      const [account] = await Account.create(
        [
          {
            accountName:
              accountName ||
              (category === "Other"
                ? customDescription
                : subcategory || category),
            accountType: "business",
            category,
            subcategory: subcategory || null,
            customDescription: customDescription || null,
            userId: req.user.id,
            ownerId: req.user.id,
            uniqueId,
            currency: null,
            timezone: timezone || "UTC",
          },
        ],
        { session },
      );

      // Create default categories for business account
      const defaultCategories = [
        "Food & Dining",
        "Transportation",
        "Utilities",
        "Shopping",
        "Entertainment",
        "Healthcare",
        "Other",
      ];
      await Category.insertMany(
        defaultCategories.map((categoryName) => ({
          accountId: account._id,
          name: categoryName,
          isDefault: true,
        })),
        { session },
      );

      // Bootstrap creator as owner member
      await AccountMember.create(
        [
          {
            accountId: account._id,
            userId: req.user.id,
            displayName:
              `${req.user.firstName} ${req.user.lastName}`.trim() ||
              req.user.email,
            role: "owner",
            permissions: { ...ALL_PERMISSIONS },
            invitedBy: null,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();
      return res.status(201).json({ success: true, data: account });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all accounts for logged in user (where they are a member)
// @route   GET /api/accounts
// @access  Private
export const getAccounts = async (req, res) => {
  try {
    const memberships = await AccountMember.find({ userId: req.user.id })
      .populate("accountId")
      .sort({ createdAt: -1 });

    const accounts = memberships
      .filter((m) => m.accountId) // Filter out any broken references
      .map((m) => {
        const acc = m.accountId.toObject();
        acc.role = m.role;
        acc.permissions = m.permissions;
        acc.viewOnly = m.viewOnly;
        return acc;
      });

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
export const getAccount = async (req, res) => {
  try {
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    }).populate("accountId");

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this account",
      });
    }

    const account = member.accountId.toObject();
    account.role = member.role;
    account.permissions = member.permissions;
    account.viewOnly = member.viewOnly;

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
export const updateAccount = async (req, res) => {
  try {
    let account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Only the owner can update account settings
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member || member.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the account owner can update account settings",
      });
    }

    account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Only the owner can delete the account
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member || member.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the account owner can delete this account",
      });
    }

    await account.deleteOne();

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

// @desc    Get categories for an account
// @route   GET /api/accounts/:id/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Caller must be a member
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this account's categories",
      });
    }

    const categories = await Category.find({ accountId: req.params.id }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create category for an account
// @route   POST /api/accounts/:id/categories
// @access  Private
export const createCategory = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Caller must have addCategories permission or be owner
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (
      !member ||
      (member.role !== "owner" && !member.permissions.addCategories)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add categories",
      });
    }

    const category = await Category.create({
      accountId: req.params.id,
      name: req.body.name,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update category name
// @route   PUT /api/accounts/:id/categories/:categoryId
// @access  Private (owner or addCategories permission)
export const updateCategory = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Caller must have addCategories permission or be owner
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (
      !member ||
      (member.role !== "owner" && !member.permissions.addCategories)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit categories",
      });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category exists and belongs to this account
    const category = await Category.findOne({
      _id: req.params.categoryId,
      accountId: req.params.id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if new name already exists in this account (excluding current category)
    const existingCategory = await Category.findOne({
      accountId: req.params.id,
      name: name.trim(),
      _id: { $ne: req.params.categoryId },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    category.name = name.trim();
    await category.save();

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get people for an account
// @route   GET /api/accounts/:id/people
// @access  Private
export const getPeople = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Caller must be a member
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this account's people list",
      });
    }

    const people = await Person.find({ accountId: req.params.id }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: people.length,
      data: people,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create person for an account
// @route   POST /api/accounts/:id/people
// @access  Private
export const createPerson = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Caller must have addUser permission or be owner
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member || (member.role !== "owner" && !member.permissions.addUser)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add people",
      });
    }

    const person = await Person.create({
      accountId: req.params.id,
      name: req.body.name,
      isCashFlowManager: req.body.isCashFlowManager || false,
      pinCode: req.body.pinCode,
    });

    res.status(201).json({
      success: true,
      data: person,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Find account by unique ID
// @route   GET /api/accounts/by-unique-id/:uniqueId
// @access  Private
export const findAccountByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    // Validate format
    if (!validateUniqueIdFormat(uniqueId.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid unique ID format. Expected format: ACC-XXXXXX",
      });
    }

    // Find account
    const account = await Account.findOne({
      uniqueId: uniqueId.toUpperCase(),
    }).select("uniqueId accountName accountType");

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found with this unique ID",
      });
    }

    // Return limited info for security (don't expose full account details)
    res.json({
      success: true,
      data: {
        uniqueId: account.uniqueId,
        accountName: account.accountName,
        accountType: account.accountType,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Link current account to a parent account
// @route   POST /api/accounts/:accountId/link-parent
// @access  Private
export const linkToParent = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { parentUniqueId } = req.body;

    if (!parentUniqueId) {
      return res.status(400).json({
        success: false,
        message: "Parent account unique ID is required",
      });
    }

    // Validate format
    if (!validateUniqueIdFormat(parentUniqueId.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent unique ID format. Expected: ACC-XXXXXX",
      });
    }

    // Check if user is owner or has accessSettings permission
    const member = await AccountMember.findOne({
      accountId,
      userId: req.user.id,
    });

    if (
      !member ||
      (member.role !== "owner" && !member.permissions.accessSettings)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to link this account to a parent",
      });
    }

    // Find parent account
    const parentAccount = await Account.findOne({
      uniqueId: parentUniqueId.toUpperCase(),
    });

    if (!parentAccount) {
      return res.status(404).json({
        success: false,
        message: "Parent account not found with this unique ID",
      });
    }

    // Prevent linking account to itself
    if (parentAccount._id.toString() === accountId) {
      return res.status(400).json({
        success: false,
        message: "Cannot link account to itself",
      });
    }

    // Check for circular reference
    // Prevent child from becoming parent's parent
    let checkAccount = parentAccount;
    while (checkAccount.parentAccountId) {
      if (checkAccount.parentAccountId.toString() === accountId) {
        return res.status(400).json({
          success: false,
          message: "Circular parent-child relationship detected",
        });
      }
      checkAccount = await Account.findById(checkAccount.parentAccountId);
      if (!checkAccount) break;
    }

    // Update account with parent
    const account = await Account.findByIdAndUpdate(
      accountId,
      { parentAccountId: parentAccount._id },
      { new: true },
    ).populate("parentAccountId", "accountName uniqueId accountType");

    res.json({
      success: true,
      message: `Account successfully linked to ${parentAccount.accountName}`,
      data: account,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

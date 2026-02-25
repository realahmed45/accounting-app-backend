import Account from "../models/Account.js";
import Category from "../models/Category.js";
import Person from "../models/Person.js";
import AccountMember from "../models/AccountMember.js";

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

    // Personal account — no category required
    if (accountType === "personal") {
      const account = await Account.create({
        accountName: accountName || "Personal",
        accountType: "personal",
        description: description || null,
        userId: req.user.id,
        ownerId: req.user.id,
        currency: currency || "USD",
        timezone: timezone || "UTC",
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
        defaultCategories.map((categoryName) =>
          Category.create({
            accountId: account._id,
            name: categoryName,
            isDefault: true,
          }),
        ),
      );

      // Bootstrap creator as owner member
      await AccountMember.create({
        accountId: account._id,
        userId: req.user.id,
        displayName:
          `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.email,
        role: "owner",
        permissions: { ...ALL_PERMISSIONS },
        invitedBy: null,
      });

      return res.status(201).json({ success: true, data: account });
    }

    // Business account — category required
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required for business accounts",
      });
    }

    if (category === "Other" && !customDescription) {
      return res.status(400).json({
        success: false,
        message: "Custom description is required for Other category",
      });
    }

    const account = await Account.create({
      accountName:
        accountName ||
        (category === "Other" ? customDescription : subcategory || category),
      accountType: "business",
      category,
      subcategory: subcategory || null,
      customDescription: customDescription || null,
      userId: req.user.id,
      ownerId: req.user.id,
      currency: currency || "USD",
      timezone: timezone || "UTC",
    });

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
    await Promise.all(
      defaultCategories.map((categoryName) =>
        Category.create({
          accountId: account._id,
          name: categoryName,
          isDefault: true,
        }),
      ),
    );

    // Bootstrap creator as owner member
    await AccountMember.create({
      accountId: account._id,
      userId: req.user.id,
      displayName:
        `${req.user.firstName} ${req.user.lastName}`.trim() || req.user.email,
      role: "owner",
      permissions: { ...ALL_PERMISSIONS },
      invitedBy: null,
    });

    return res.status(201).json({ success: true, data: account });
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

// @desc    Get all accounts for logged in user
// @route   GET /api/accounts
// @access  Private
export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({
      createdAt: -1,
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
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this account",
      });
    }

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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this account",
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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this account",
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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Make sure user owns account
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

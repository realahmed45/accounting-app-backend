import Week from "../models/Week.js";
import AccountMember from "../models/AccountMember.js";
import Expense from "../models/Expense.js";
import BankAccount from "../models/BankAccount.js";

// @desc    Add cash to box
// @route   POST /api/weeks/:id/add-cash
// @access  Private
export const addCashToBox = async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const week = await Week.findById(req.params.id);
    if (!week) return res.status(404).json({ success: false, message: "Week not found" });

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member) {
      return res.status(401).json({ success: false, message: "Not a member of this account" });
    }

    if (week.isLocked) {
      return res.status(400).json({ success: false, message: "Week is locked" });
    }

    week.cashBoxBalance += parseFloat(amount);
    week.cashTransactions.push({
      amount: parseFloat(amount),
      note: note || "",
      date: new Date(),
      createdAt: new Date(),
    });
    await week.save();

    res.status(200).json({ success: true, data: week });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new week
// @route   POST /api/weeks
// @access  Private
export const createWeek = async (req, res) => {
  try {
    const { accountId, startDate, endDate, cashBoxBalance } = req.body;

    const member = await AccountMember.findOne({ accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this account",
      });
    }

    if (member.role !== "owner" && !member.permissions.createAccountDownward) {
      return res.status(403).json({
        success: false,
        message: "No permission to create weeks/sub-accounts",
      });
    }

    const week = await Week.create({
      accountId,
      startDate,
      endDate,
      cashBoxBalance: cashBoxBalance || 0,
    });

    res.status(201).json({
      success: true,
      data: week,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all weeks for an account
// @route   GET /api/weeks/account/:accountId
// @access  Private
export const getWeeksByAccount = async (req, res) => {
  try {
    const member = await AccountMember.findOne({ accountId: req.params.accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this account",
      });
    }

    const weeks = await Week.find({ accountId: req.params.accountId }).sort({
      startDate: -1,
    });

    res.status(200).json({
      success: true,
      count: weeks.length,
      data: weeks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single week
// @route   GET /api/weeks/:id
// @access  Private
export const getWeek = async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);

    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this account",
      });
    }

    res.status(200).json({
      success: true,
      data: week,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update week
// @route   PUT /api/weeks/:id
// @access  Private
export const updateWeek = async (req, res) => {
  try {
    let week = await Week.findById(req.params.id);

    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member || (member.role !== "owner" && !member.permissions.calculateCash)) {
      return res.status(403).json({
        success: false,
        message: "No permission to update weeks",
      });
    }

    // Don't allow updates to locked weeks
    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a locked week",
      });
    }

    week = await Week.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: week,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lock week
// @route   PUT /api/weeks/:id/lock
// @access  Private
export const lockWeek = async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);

    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member || (member.role !== "owner" && !member.permissions.calculateCash)) {
      return res.status(403).json({
        success: false,
        message: "No permission to lock weeks",
      });
    }

    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Week is already locked",
      });
    }

    week.isLocked = true;
    week.lockedAt = new Date();
    await week.save();

    res.status(200).json({
      success: true,
      data: week,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete week
// @route   DELETE /api/weeks/:id
// @access  Private
export const deleteWeek = async (req, res) => {
  try {
    const week = await Week.findById(req.params.id);

    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member || member.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the account owner can delete weeks",
      });
    }

    // Don't allow deletion of locked weeks
    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a locked week",
      });
    }

    // Delete all expenses associated with this week
    await Expense.deleteMany({ weekId: req.params.id });

    await week.deleteOne();

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

// @desc    Transfer from bank account to cash
// @route   POST /api/weeks/:id/transfer-bank-to-cash
// @access  Private
export const transferBankToCash = async (req, res) => {
  try {
    const { bankAccountId, amount } = req.body;

    if (!bankAccountId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Bank account ID and valid amount are required",
      });
    }

    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member || (member.role !== "owner" && !member.permissions.calculateCash)) {
      return res.status(403).json({
        success: false,
        message: "No permission to transfer funds",
      });
    }

    // Check if week is locked
    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer in a locked week",
      });
    }

    // Get bank account
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    if (bankAccount.accountId.toString() !== week.accountId.toString()) {
      return res.status(401).json({
        success: false,
        message: "Bank account does not belong to this account",
      });
    }

    // Check sufficient balance
    if (bankAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient bank account balance",
      });
    }

    // Transfer: deduct from bank, add to cash
    bankAccount.balance -= amount;
    await bankAccount.save();

    week.cashBoxBalance += amount;
    await week.save();

    res.status(200).json({
      success: true,
      data: {
        week,
        bankAccount,
      },
      message: "Transfer completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

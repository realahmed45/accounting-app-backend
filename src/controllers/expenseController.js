import Expense from "../models/Expense.js";
import Week from "../models/Week.js";
import AccountMember from "../models/AccountMember.js";
import BillPhoto from "../models/BillPhoto.js";
import BankAccount from "../models/BankAccount.js";

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const {
      accountId,
      weekId,
      date,
      amount,
      category,
      note,
      paymentSource,
      bankAccountId,
    } = req.body;

    // Verify account membership
    const member = await AccountMember.findOne({ accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this account",
      });
    }

    if (member.role !== "owner" && !member.permissions.makeExpense) {
      return res.status(403).json({
        success: false,
        message: "No permission to create expenses",
      });
    }

    // Verify week exists and is not locked
    const week = await Week.findById(weekId);
    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot add expenses to a locked week",
      });
    }

    // Handle payment deduction
    if (paymentSource === "bank" && bankAccountId) {
      // Deduct from bank account
      const bankAccount = await BankAccount.findById(bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: "Bank account not found",
        });
      }

      if (bankAccount.accountId.toString() !== accountId) {
        return res.status(401).json({
          success: false,
          message: "Bank account does not belong to this account",
        });
      }

      if (bankAccount.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient bank account balance",
        });
      }

      // Deduct from bank account balance
      bankAccount.balance -= amount;
      await bankAccount.save();
    } else {
      // Deduct from cash box
      if (week.cashBoxBalance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient cash balance",
        });
      }

      week.cashBoxBalance -= amount;
      await week.save();
    }

    const expense = await Expense.create({
      accountId,
      weekId,
      date,
      amount,
      category,
      note,
      paymentSource: paymentSource || "cash",
      bankAccountId: paymentSource === "bank" ? bankAccountId : null,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all expenses for a week
// @route   GET /api/expenses/week/:weekId
// @access  Private
export const getExpensesByWeek = async (req, res) => {
  try {
    const week = await Week.findById(req.params.weekId);

    if (!week) {
      return res.status(404).json({
        success: false,
        message: "Week not found",
      });
    }

    // Verify membership
    const member = await AccountMember.findOne({ accountId: week.accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this account",
      });
    }

    const expenses = await Expense.find({ weekId: req.params.weekId }).sort({
      date: -1,
    });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all expenses for an account
// @route   GET /api/expenses/account/:accountId
// @access  Private
export const getExpensesByAccount = async (req, res) => {
  try {
    const member = await AccountMember.findOne({ accountId: req.params.accountId, userId: req.user.id });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this account",
      });
    }

    // Optional query params for filtering
    const { startDate, endDate, category } = req.query;

    let query = { accountId: req.params.accountId };

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Verify membership
    const member = await AccountMember.findOne({ accountId: expense.accountId, userId: req.user.id });
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this expense",
      });
    }

    // Get associated photos
    const photos = await BillPhoto.find({ expenseId: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        expense,
        photos,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Verify membership and permission
    const member = await AccountMember.findOne({ accountId: expense.accountId, userId: req.user.id });
    if (!member || (member.role !== "owner" && !member.permissions.makeExpense)) {
      return res.status(403).json({
        success: false,
        message: "No permission to update expenses",
      });
    }

    // Check if week is locked
    const week = await Week.findById(expense.weekId);
    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot update expenses in a locked week",
      });
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Verify membership and permission
    const member = await AccountMember.findOne({ accountId: expense.accountId, userId: req.user.id });
    if (!member || (member.role !== "owner" && !member.permissions.makeExpense)) {
      return res.status(403).json({
        success: false,
        message: "No permission to delete expenses",
      });
    }

    // Check if week is locked
    const week = await Week.findById(expense.weekId);
    if (week.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete expenses in a locked week",
      });
    }

    // Refund the amount back to the source
    if (expense.paymentSource === "bank" && expense.bankAccountId) {
      // Refund to bank account
      const bankAccount = await BankAccount.findById(expense.bankAccountId);
      if (bankAccount) {
        bankAccount.balance += expense.amount;
        await bankAccount.save();
      }
    } else {
      // Refund to cash box
      week.cashBoxBalance += expense.amount;
      await week.save();
    }

    // Delete associated photos
    await BillPhoto.deleteMany({ expenseId: req.params.id });

    await expense.deleteOne();

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

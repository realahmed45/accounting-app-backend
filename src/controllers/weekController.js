import Week from "../models/Week.js";
import Account from "../models/Account.js";
import Expense from "../models/Expense.js";

// @desc    Create new week
// @route   POST /api/weeks
// @access  Private
export const createWeek = async (req, res) => {
  try {
    const { accountId, startDate, endDate, bankBalance, cashBoxBalance } =
      req.body;

    // Verify account ownership
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const week = await Week.create({
      accountId,
      startDate,
      endDate,
      bankBalance: bankBalance || 0,
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
    const account = await Account.findById(req.params.accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Verify ownership through account
    const account = await Account.findById(week.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Verify ownership
    const account = await Account.findById(week.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Verify ownership
    const account = await Account.findById(week.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

    // Verify ownership
    const account = await Account.findById(week.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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

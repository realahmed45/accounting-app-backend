import RecurringExpense from "../models/RecurringExpense.js";
import Expense from "../models/Expense.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Get all recurring expenses for an account
 * @route   GET /api/accounts/:id/recurring-expenses
 * @access  Private
 */
export const getRecurringExpenses = async (req, res) => {
  try {
    const accountId = req.params.id;

    const recurringExpenses = await RecurringExpense.find({ accountId })
      .populate("categoryId", "name color")
      .populate("personId", "name")
      .populate("bankAccountId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: recurringExpenses.length,
      data: recurringExpenses,
    });
  } catch (error) {
    console.error("Get recurring expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recurring expenses",
    });
  }
};

/**
 * @desc    Create a recurring expense
 * @route   POST /api/accounts/:id/recurring-expenses
 * @access  Private
 */
export const createRecurringExpense = async (req, res) => {
  try {
    const accountId = req.params.id;
    const {
      templateName,
      description,
      amount,
      isVariable,
      categoryId,
      personId,
      bankAccountId,
      frequency,
      interval,
      dayOfWeek,
      dayOfMonth,
      monthOfYear,
      startDate,
      endDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!templateName || !amount || !frequency) {
      return res.status(400).json({
        success: false,
        message: "Template name, amount, and frequency are required",
      });
    }

    const recurringExpense = await RecurringExpense.create({
      accountId,
      templateName,
      description,
      amount,
      isVariable: isVariable || false,
      categoryId,
      personId,
      bankAccountId,
      frequency,
      interval: interval || 1,
      dayOfWeek,
      dayOfMonth,
      monthOfYear,
      startDate: startDate || new Date(),
      endDate,
      createdBy: req.user.id,
      notes,
    });

    // Calculate next scheduled date
    recurringExpense.nextScheduled = recurringExpense.calculateNextDate();
    await recurringExpense.save();

    await logActivity(
      req.user.id,
      accountId,
      "recurring_expense",
      "create",
      `Created recurring expense: ${templateName}`,
    );

    res.status(201).json({
      success: true,
      data: recurringExpense,
    });
  } catch (error) {
    console.error("Create recurring expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create recurring expense",
    });
  }
};

/**
 * @desc    Update a recurring expense
 * @route   PUT /api/accounts/:id/recurring-expenses/:recurringId
 * @access  Private
 */
export const updateRecurringExpense = async (req, res) => {
  try {
    const { recurringId } = req.params;
    const updates = req.body;

    let recurringExpense = await RecurringExpense.findById(recurringId);

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        message: "Recurring expense not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "templateName",
      "description",
      "amount",
      "isVariable",
      "categoryId",
      "personId",
      "bankAccountId",
      "frequency",
      "interval",
      "dayOfWeek",
      "dayOfMonth",
      "monthOfYear",
      "startDate",
      "endDate",
      "isActive",
      "notes",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        recurringExpense[field] = updates[field];
      }
    });

    // Recalculate next scheduled date
    recurringExpense.nextScheduled = recurringExpense.calculateNextDate();

    await recurringExpense.save();

    await logActivity(
      req.user.id,
      recurringExpense.accountId,
      "recurring_expense",
      "update",
      `Updated recurring expense: ${recurringExpense.templateName}`,
    );

    res.json({
      success: true,
      data: recurringExpense,
    });
  } catch (error) {
    console.error("Update recurring expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update recurring expense",
    });
  }
};

/**
 * @desc    Delete a recurring expense
 * @route   DELETE /api/accounts/:id/recurring-expenses/:recurringId
 * @access  Private
 */
export const deleteRecurringExpense = async (req, res) => {
  try {
    const { recurringId } = req.params;

    const recurringExpense = await RecurringExpense.findById(recurringId);

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        message: "Recurring expense not found",
      });
    }

    await recurringExpense.deleteOne();

    await logActivity(
      req.user.id,
      recurringExpense.accountId,
      "recurring_expense",
      "delete",
      `Deleted recurring expense: ${recurringExpense.templateName}`,
    );

    res.json({
      success: true,
      message: "Recurring expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete recurring expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete recurring expense",
    });
  }
};

/**
 * @desc    Pause/resume a recurring expense
 * @route   PATCH /api/accounts/:id/recurring-expenses/:recurringId/toggle
 * @access  Private
 */
export const toggleRecurringExpense = async (req, res) => {
  try {
    const { recurringId } = req.params;

    const recurringExpense = await RecurringExpense.findById(recurringId);

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        message: "Recurring expense not found",
      });
    }

    recurringExpense.isActive = !recurringExpense.isActive;
    await recurringExpense.save();

    await logActivity(
      req.user.id,
      recurringExpense.accountId,
      "recurring_expense",
      "update",
      `${recurringExpense.isActive ? "Resumed" : "Paused"} recurring expense: ${recurringExpense.templateName}`,
    );

    res.json({
      success: true,
      message: `Recurring expense ${recurringExpense.isActive ? "resumed" : "paused"} successfully`,
      data: recurringExpense,
    });
  } catch (error) {
    console.error("Toggle recurring expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle recurring expense",
    });
  }
};

/**
 * @desc    Process recurring expenses (create due expenses)
 * @route   POST /api/recurring-expenses/process (Cron job endpoint)
 * @access  Private/Internal
 */
export const processRecurringExpenses = async (req, res) => {
  try {
    const recurringExpenses = await RecurringExpense.find({
      isActive: true,
    });

    let createdCount = 0;

    for (const recurring of recurringExpenses) {
      if (recurring.shouldCreateToday()) {
        // Create the expense
        const expense = await Expense.create({
          accountId: recurring.accountId,
          description: recurring.description || recurring.templateName,
          amount: recurring.amount,
          categoryId: recurring.categoryId,
          personId: recurring.personId,
          bankAccountId: recurring.bankAccountId,
          date: new Date(),
          notes: `Auto-created from recurring expense: ${recurring.templateName}`,
          tags: [],
          isRecurring: true,
          recurringExpenseId: recurring._id,
        });

        // Update recurring expense
        recurring.lastCreated = new Date();
        recurring.totalCreated += 1;
        recurring.nextScheduled = recurring.calculateNextDate();
        await recurring.save();

        createdCount++;

        await logActivity(
          recurring.createdBy,
          recurring.accountId,
          "expense",
          "create",
          `Auto-created recurring expense: ${recurring.templateName}`,
        );
      }
    }

    res.json({
      success: true,
      message: `Processed ${createdCount} recurring expenses`,
      createdCount,
    });
  } catch (error) {
    console.error("Process recurring expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process recurring expenses",
    });
  }
};

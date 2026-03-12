import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import { logActivity } from "../utils/activityLogger.js";
import { createNotification } from "../services/notificationService.js";

/**
 * @desc    Get all budgets for an account
 * @route   GET /api/accounts/:id/budgets
 * @access  Private
 */
export const getBudgets = async (req, res) => {
  try {
    const accountId = req.params.id;

    const budgets = await Budget.find({ accountId, isActive: true })
      .populate("categoryId", "name color")
      .populate("personId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Enrich with calculated fields
    const enrichedBudgets = budgets.map((budget) => ({
      ...budget.toObject(),
      percentageSpent: budget.getPercentageSpent(),
      remaining: budget.getRemaining(),
      isExceeded: budget.isExceeded(),
    }));

    res.json({
      success: true,
      count: enrichedBudgets.length,
      data: enrichedBudgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get budgets",
    });
  }
};

/**
 * @desc    Create a new budget
 * @route   POST /api/accounts/:id/budgets
 * @access  Private
 */
export const createBudget = async (req, res) => {
  try {
    const accountId = req.params.id;
    const {
      name,
      type,
      categoryId,
      personId,
      amount,
      period,
      periodStart,
      periodEnd,
      alertAt50,
      alertAt75,
      alertAt90,
      alertAt100,
      rollover,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Name and positive amount are required",
      });
    }

    // Calculate period dates
    const now = new Date();
    let currentPeriodStart = periodStart ? new Date(periodStart) : now;
    let currentPeriodEnd;

    switch (period) {
      case "daily":
        currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
        break;
      case "weekly":
        currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
        break;
      case "monthly":
        currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        break;
      case "yearly":
        currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        break;
      case "custom":
        currentPeriodEnd = periodEnd ? new Date(periodEnd) : null;
        break;
      default:
        currentPeriodEnd = new Date(currentPeriodStart);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const budget = await Budget.create({
      accountId,
      name,
      type: type || "total",
      categoryId,
      personId,
      amount,
      period: period || "monthly",
      periodStart,
      periodEnd,
      currentPeriodStart,
      currentPeriodEnd,
      alertAt50: alertAt50 !== undefined ? alertAt50 : true,
      alertAt75: alertAt75 !== undefined ? alertAt75 : true,
      alertAt90: alertAt90 !== undefined ? alertAt90 : true,
      alertAt100: alertAt100 !== undefined ? alertAt100 : true,
      rollover: rollover || false,
      createdBy: req.user.id,
      notes,
    });

    await logActivity(
      req.user.id,
      accountId,
      "budget",
      "create",
      `Created budget: ${name} ($${amount})`,
    );

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create budget",
    });
  }
};

/**
 * @desc    Update a budget
 * @route   PUT /api/accounts/:id/budgets/:budgetId
 * @access  Private
 */
export const updateBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const updates = req.body;

    let budget = await Budget.findById(budgetId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "amount",
      "period",
      "alertAt50",
      "alertAt75",
      "alertAt90",
      "alertAt100",
      "rollover",
      "isActive",
      "notes",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        budget[field] = updates[field];
      }
    });

    await budget.save();

    await logActivity(
      req.user.id,
      budget.accountId,
      "budget",
      "update",
      `Updated budget: ${budget.name}`,
    );

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update budget",
    });
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/accounts/:id/budgets/:budgetId
 * @access  Private
 */
export const deleteBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;

    const budget = await Budget.findById(budgetId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    await budget.deleteOne();

    await logActivity(
      req.user.id,
      budget.accountId,
      "budget",
      "delete",
      `Deleted budget: ${budget.name}`,
    );

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete budget",
    });
  }
};

/**
 * @desc    Check and update budget spending
 * @route   POST /api/accounts/:id/budgets/check
 * @access  Private (Internal - called when expense created/updated)
 */
export const checkBudgetSpending = async (accountId, expense, userId) => {
  try {
    // Find relevant budgets
    const budgets = await Budget.find({
      accountId,
      isActive: true,
      $or: [
        { type: "total" }, // Total account budget
        { type: "category", categoryId: expense.categoryId }, // Category budget
        { type: "person", personId: expense.personId }, // Person budget
      ],
    });

    for (const budget of budgets) {
      // Recalculate spent amount
      let query = {
        accountId,
        date: {
          $gte: budget.currentPeriodStart,
          $lte: budget.currentPeriodEnd,
        },
      };

      if (budget.type === "category") {
        query.categoryId = budget.categoryId;
      } else if (budget.type === "person") {
        query.personId = budget.personId;
      }

      const expenses = await Expense.find(query);
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      budget.spent = totalSpent;

      // Check for alerts
      const percentageSpent = budget.getPercentageSpent();

      if (budget.shouldAlert(50)) {
        budget.alerted50 = true;
        await sendBudgetAlert(accountId, budget, 50, userId);
      }
      if (budget.shouldAlert(75)) {
        budget.alerted75 = true;
        await sendBudgetAlert(accountId, budget, 75, userId);
      }
      if (budget.shouldAlert(90)) {
        budget.alerted90 = true;
        await sendBudgetAlert(accountId, budget, 90, userId);
      }
      if (budget.shouldAlert(100)) {
        budget.alerted100 = true;
        await sendBudgetAlert(accountId, budget, 100, userId);
      }

      await budget.save();
    }
  } catch (error) {
    console.error("Check budget spending error:", error);
  }
};

// Helper function to send budget alerts
async function sendBudgetAlert(accountId, budget, percentage, userId) {
  const message =
    percentage === 100
      ? `⚠️ Budget "${budget.name}" has been exceeded! Spent: $${budget.spent.toFixed(2)} / $${budget.amount.toFixed(2)}`
      : `⚠️ Budget "${budget.name}" is ${percentage}% spent ($${budget.spent.toFixed(2)} / $${budget.amount.toFixed(2)})`;

  await createNotification({
    userId,
    accountId,
    type: "budget_alert",
    title: `Budget Alert: ${budget.name}`,
    message,
    priority: percentage >= 100 ? "high" : "medium",
    data: {
      budgetId: budget._id,
      budgetName: budget.name,
      percentage,
      spent: budget.spent,
      limit: budget.amount,
    },
  });
}

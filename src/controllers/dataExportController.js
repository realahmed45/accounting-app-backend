import Expense from "../models/Expense.js";
import Shift from "../models/Shift.js";
import Person from "../models/Person.js";
import BankAccount from "../models/BankAccount.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Export expenses to CSV
 * @route   GET /api/accounts/:id/export/expenses/csv
 * @access  Private (Professional+ plan)
 */
export const exportExpensesToCSV = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { dateFrom, dateTo, categories, paymentSources } = req.query;

    // Build filter
    const filter = { accountId };

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (categories) {
      filter.category = { $in: categories.split(",") };
    }

    if (paymentSources) {
      filter.paymentSource = { $in: paymentSources.split(",") };
    }

    // Fetch expenses
    const expenses = await Expense.find(filter)
      .populate("weekId", "weekNumber year")
      .populate("bankAccountId", "name")
      .populate("userId", "name")
      .populate("tags", "name")
      .sort({ date: -1 });

    // Generate CSV
    let csv =
      "Date,Amount,Category,Payment Source,Bank Account,Week,Note,Tags,Currency\n";

    expenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString();
      const amount = expense.amount.toFixed(2);
      const category = expense.category || "";
      const paymentSource = expense.paymentSource || "";
      const bankAccount = expense.bankAccountId?.name || "";
      const week = expense.weekId
        ? `Week ${expense.weekId.weekNumber} ${expense.weekId.year}`
        : "";
      const note = (expense.note || "").replace(/"/g, '""'); // Escape quotes
      const tags = expense.tags.map((t) => t.name).join("; ") || "";
      const currency = expense.currency || "USD";

      csv += `"${date}","${amount}","${category}","${paymentSource}","${bankAccount}","${week}","${note}","${tags}","${currency}"\n`;
    });

    await logActivity(
      req.user.id,
      accountId,
      "export",
      "csv",
      `Exported ${expenses.length} expenses to CSV`,
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses_${Date.now()}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({
      success: false,
      message: "CSV export failed",
    });
  }
};

/**
 * @desc    Export expenses to JSON
 * @route   GET /api/accounts/:id/export/expenses/json
 * @access  Private (Professional+ plan)
 */
export const exportExpensesToJSON = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { dateFrom, dateTo, categories, paymentSources } = req.query;

    // Build filter
    const filter = { accountId };

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (categories) {
      filter.category = { $in: categories.split(",") };
    }

    if (paymentSources) {
      filter.paymentSource = { $in: paymentSources.split(",") };
    }

    // Fetch expenses
    const expenses = await Expense.find(filter)
      .populate("weekId", "weekNumber year startDate endDate")
      .populate("bankAccountId", "name type")
      .populate("userId", "name email")
      .populate("tags", "name color")
      .sort({ date: -1 })
      .lean();

    await logActivity(
      req.user.id,
      accountId,
      "export",
      "json",
      `Exported ${expenses.length} expenses to JSON`,
    );

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expenses_${Date.now()}.json"`,
    );
    res.json({
      exportDate: new Date().toISOString(),
      totalRecords: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("Export JSON error:", error);
    res.status(500).json({
      success: false,
      message: "JSON export failed",
    });
  }
};

/**
 * @desc    Export schedule to CSV
 * @route   GET /api/accounts/:id/export/schedule/csv
 * @access  Private (Professional+ plan)
 */
export const exportScheduleToCSV = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { dateFrom, dateTo, personId } = req.query;

    // Build filter
    const filter = { accountId };

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (personId) {
      filter.personId = personId;
    }

    // Fetch shifts
    const shifts = await Shift.find(filter)
      .populate("personId", "name")
      .populate("createdBy", "name")
      .sort({ date: -1, startTime: 1 });

    // Generate CSV
    let csv =
      "Date,Person,Start Time,End Time,Total Hours,Hourly Rate,Total Pay,Status,Notes\n";

    shifts.forEach((shift) => {
      const date = new Date(shift.date).toLocaleDateString();
      const person = shift.personId?.name || "";
      const startTime = shift.startTime || "";
      const endTime = shift.endTime || "";
      const totalHours = shift.totalHours?.toFixed(2) || "0.00";
      const hourlyRate = shift.hourlyRate?.toFixed(2) || "0.00";
      const totalPay = shift.totalPay?.toFixed(2) || "0.00";
      const status = shift.status || "";
      const notes = (shift.notes || "").replace(/"/g, '""'); // Escape quotes

      csv += `"${date}","${person}","${startTime}","${endTime}","${totalHours}","${hourlyRate}","${totalPay}","${status}","${notes}"\n`;
    });

    await logActivity(
      req.user.id,
      accountId,
      "export",
      "csv",
      `Exported ${shifts.length} shifts to CSV`,
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="schedule_${Date.now()}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export schedule CSV error:", error);
    res.status(500).json({
      success: false,
      message: "Schedule CSV export failed",
    });
  }
};

/**
 * @desc    Export full account summary
 * @route   GET /api/accounts/:id/export/summary
 * @access  Private (Business+ plan)
 */
export const exportAccountSummary = async (req, res) => {
  try {
    const accountId = req.params.id;

    // Get all data
    const [expenses, shifts, persons, bankAccounts] = await Promise.all([
      Expense.find({ accountId })
        .populate("weekId", "weekNumber year")
        .populate("tags", "name color")
        .sort({ date: -1 }),
      Shift.find({ accountId }).populate("personId", "name").sort({ date: -1 }),
      Person.find({ accountId }).lean(),
      BankAccount.find({ accountId }).lean(),
    ]);

    // Calculate summary statistics
    const expenseStats = await Expense.aggregate([
      { $match: { accountId: accountId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const shiftStats = await Shift.aggregate([
      { $match: { accountId: accountId } },
      {
        $group: {
          _id: null,
          totalHours: { $sum: "$totalHours" },
          totalPay: { $sum: "$totalPay" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      exportDate: new Date().toISOString(),
      accountId,
      statistics: {
        expenses: expenseStats[0] || {
          totalAmount: 0,
          avgAmount: 0,
          count: 0,
        },
        shifts: shiftStats[0] || { totalHours: 0, totalPay: 0, count: 0 },
        personsCount: persons.length,
        bankAccountsCount: bankAccounts.length,
      },
      data: {
        expenses: expenses.slice(0, 1000), // Limit to 1000 most recent
        shifts: shifts.slice(0, 1000),
        persons,
        bankAccounts,
      },
    };

    await logActivity(
      req.user.id,
      accountId,
      "export",
      "summary",
      `Exported full account summary`,
    );

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="account_summary_${Date.now()}.json"`,
    );
    res.json(summary);
  } catch (error) {
    console.error("Export summary error:", error);
    res.status(500).json({
      success: false,
      message: "Summary export failed",
    });
  }
};

/**
 * @desc    Get export options and limits
 * @route   GET /api/accounts/:id/export/options
 * @access  Private
 */
export const getExportOptions = async (req, res) => {
  try {
    const accountId = req.params.id;

    // Get counts
    const expenseCount = await Expense.countDocuments({ accountId });
    const shiftCount = await Shift.countDocuments({ accountId });

    res.json({
      success: true,
      data: {
        availableFormats: ["csv", "json"],
        exportTypes: ["expenses", "schedule", "summary"],
        limits: {
          maxRecords: 10000,
          maxFileSize: "50MB",
        },
        currentCounts: {
          expenses: expenseCount,
          shifts: shiftCount,
        },
      },
    });
  } catch (error) {
    console.error("Get export options error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get export options",
    });
  }
};

import Expense from "../models/Expense.js";
import Person from "../models/Person.js";
import Category from "../models/Category.js";
import BankAccount from "../models/BankAccount.js";

/**
 * @desc    Advanced search across expenses
 * @route   POST /api/accounts/:id/search
 * @access  Private
 */
export const advancedSearch = async (req, res) => {
  try {
    const accountId = req.params.id;
    const {
      query, // Text search
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      categories,
      persons,
      bankAccounts,
      paymentSources,
      tags,
      isRecurring,
      currency,
      sortBy = "-date", // Default sort by date descending
      page = 1,
      limit = 50,
    } = req.body;

    // Build search filter
    const filter = { accountId };

    // Text search (searches in note field)
    if (query && query.trim()) {
      filter.note = { $regex: query.trim(), $options: "i" };
    }

    // Date range
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Amount range
    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount !== undefined) filter.amount.$gte = Number(minAmount);
      if (maxAmount !== undefined) filter.amount.$lte = Number(maxAmount);
    }

    // Categories
    if (categories && categories.length > 0) {
      filter.category = { $in: categories };
    }

    // Bank accounts
    if (bankAccounts && bankAccounts.length > 0) {
      filter.bankAccountId = { $in: bankAccounts };
    }

    // Payment sources
    if (paymentSources && paymentSources.length > 0) {
      filter.paymentSource = { $in: paymentSources };
    }

    // Tags
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Recurring filter
    if (isRecurring !== undefined) {
      filter.isRecurring = isRecurring;
    }

    // Currency filter
    if (currency) {
      filter.currency = currency;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const expenses = await Expense.find(filter)
      .populate("weekId", "weekNumber year startDate endDate")
      .populate("bankAccountId", "name type")
      .populate("userId", "name email")
      .populate("tags", "name color")
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    // Calculate aggregates
    const aggregates = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = aggregates[0] || {
      totalAmount: 0,
      avgAmount: 0,
      count: 0,
    };

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
};

/**
 * @desc    Get search filters/options for the account
 * @route   GET /api/accounts/:id/search/filters
 * @access  Private
 */
export const getSearchFilters = async (req, res) => {
  try {
    const accountId = req.params.id;

    // Get available categories
    const categories = await Category.find({ accountId }).select("name color");

    // Get available persons
    const persons = await Person.find({ accountId }).select("name");

    // Get available bank accounts
    const bankAccounts = await BankAccount.find({ accountId }).select(
      "name type",
    );

    // Get available currencies
    const currencies = await Expense.distinct("currency", { accountId });

    // Get date range
    const dateRange = await Expense.aggregate([
      { $match: { accountId: accountId } },
      {
        $group: {
          _id: null,
          minDate: { $min: "$date" },
          maxDate: { $max: "$date" },
        },
      },
    ]);

    // Get amount range
    const amountRange = await Expense.aggregate([
      { $match: { accountId: accountId } },
      {
        $group: {
          _id: null,
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        categories,
        persons,
        bankAccounts,
        currencies,
        dateRange: dateRange[0] || { minDate: null, maxDate: null },
        amountRange: amountRange[0] || { minAmount: 0, maxAmount: 0 },
        paymentSources: ["cash", "bank"],
      },
    });
  } catch (error) {
    console.error("Get search filters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get search filters",
    });
  }
};

import {
  seedAllSampleData,
  seedSampleShifts,
  seedSampleExpenses,
  clearSampleData,
} from "../services/sampleDataSeeder.js";
import { logActivity } from "../services/activityLogger.js";

/**
 * @desc    Seed all sample data for an account
 * @route   POST /api/accounts/:id/sample-data/seed-all
 * @access  Private (Owner only)
 */
export const seedAll = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await seedAllSampleData(accountId, userId);

    // Log activity
    await logActivity(
      accountId,
      userId,
      "sample_data_seeded",
      "SampleData",
      null,
      "Seeded all sample data for learning purposes",
    );

    res.status(200).json({
      success: true,
      message:
        "✅ Sample data created successfully! Explore the features to learn.",
      data: result,
    });
  } catch (error) {
    console.error("Error seeding all sample data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed sample data",
      error: error.message,
    });
  }
};

/**
 * @desc    Seed only scheduling sample data
 * @route   POST /api/accounts/:id/sample-data/seed-shifts
 * @access  Private (Owner/Manager only)
 */
export const seedShifts = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await seedSampleShifts(accountId);

    await logActivity(
      accountId,
      userId,
      "sample_shifts_seeded",
      "Shift",
      null,
      "Seeded sample shift data",
    );

    res.status(200).json({
      success: true,
      message: "✅ Sample shift data created! Check the Team Roster tab.",
      data: result,
    });
  } catch (error) {
    console.error("Error seeding sample shifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed sample shifts",
      error: error.message,
    });
  }
};

/**
 * @desc    Seed only expense sample data
 * @route   POST /api/accounts/:id/sample-data/seed-expenses
 * @access  Private (Owner only)
 */
export const seedExpenses = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await seedSampleExpenses(accountId, userId);

    await logActivity(
      accountId,
      userId,
      "sample_expenses_seeded",
      "Expense",
      null,
      "Seeded sample expense data",
    );

    res.status(200).json({
      success: true,
      message: "✅ Sample expense data created! Check the Expenses section.",
      data: result,
    });
  } catch (error) {
    console.error("Error seeding sample expenses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed sample expenses",
      error: error.message,
    });
  }
};

/**
 * @desc    Clear all sample data from an account
 * @route   DELETE /api/accounts/:id/sample-data/clear
 * @access  Private (Owner only)
 */
export const clearSamples = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.id;

    const result = await clearSampleData(accountId);

    await logActivity(
      accountId,
      userId,
      "sample_data_cleared",
      "SampleData",
      null,
      "Cleared all sample data",
    );

    res.status(200).json({
      success: true,
      message: "✅ Sample data cleared successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error clearing sample data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear sample data",
      error: error.message,
    });
  }
};

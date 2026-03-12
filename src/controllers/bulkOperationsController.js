import Expense from "../models/Expense.js";
import Tag from "../models/Tag.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Bulk delete expenses
 * @route   DELETE /api/accounts/:id/bulk/expenses
 * @access  Private
 */
export const bulkDeleteExpenses = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { expenseIds } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs array is required",
      });
    }

    // Delete expenses
    const result = await Expense.deleteMany({
      _id: { $in: expenseIds },
      accountId,
    });

    await logActivity(
      req.user.id,
      accountId,
      "expense",
      "bulk_delete",
      `Bulk deleted ${result.deletedCount} expenses`,
    );

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} expenses`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk delete failed",
    });
  }
};

/**
 * @desc    Bulk update expenses (add tags, change category, etc.)
 * @route   PATCH /api/accounts/:id/bulk/expenses
 * @access  Private
 */
export const bulkUpdateExpenses = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { expenseIds, updates } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs array is required",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    // Build update object
    const updateFields = {};

    // Allow updating specific fields
    if (updates.category !== undefined)
      updateFields.category = updates.category;
    if (updates.paymentSource !== undefined)
      updateFields.paymentSource = updates.paymentSource;
    if (updates.bankAccountId !== undefined)
      updateFields.bankAccountId = updates.bankAccountId;
    if (updates.currency !== undefined)
      updateFields.currency = updates.currency;

    // Handle tags separately (add or replace)
    if (updates.tags !== undefined) {
      if (updates.tagsAction === "add") {
        // Add tags to existing ones
        await Expense.updateMany(
          { _id: { $in: expenseIds }, accountId },
          { $addToSet: { tags: { $each: updates.tags } } },
        );
      } else {
        // Replace all tags
        updateFields.tags = updates.tags;
      }
    }

    // Perform update
    const result = await Expense.updateMany(
      { _id: { $in: expenseIds }, accountId },
      { $set: updateFields },
    );

    await logActivity(
      req.user.id,
      accountId,
      "expense",
      "bulk_update",
      `Bulk updated ${result.modifiedCount} expenses`,
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} expenses`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk update failed",
    });
  }
};

/**
 * @desc    Bulk add tags to expenses
 * @route   POST /api/accounts/:id/bulk/expenses/tags
 * @access  Private
 */
export const bulkAddTags = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { expenseIds, tagIds } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs array is required",
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tag IDs array is required",
      });
    }

    // Add tags to expenses
    const result = await Expense.updateMany(
      { _id: { $in: expenseIds }, accountId },
      { $addToSet: { tags: { $each: tagIds } } },
    );

    // Update usage count for tags
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: expenseIds.length } },
    );

    await logActivity(
      req.user.id,
      accountId,
      "expense",
      "bulk_tag",
      `Bulk added ${tagIds.length} tags to ${expenseIds.length} expenses`,
    );

    res.json({
      success: true,
      message: `Successfully added tags to ${result.modifiedCount} expenses`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk add tags error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk tag operation failed",
    });
  }
};

/**
 * @desc    Bulk remove tags from expenses
 * @route   DELETE /api/accounts/:id/bulk/expenses/tags
 * @access  Private
 */
export const bulkRemoveTags = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { expenseIds, tagIds } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs array is required",
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tag IDs array is required",
      });
    }

    // Remove tags from expenses
    const result = await Expense.updateMany(
      { _id: { $in: expenseIds }, accountId },
      { $pull: { tags: { $in: tagIds } } },
    );

    await logActivity(
      req.user.id,
      accountId,
      "expense",
      "bulk_untag",
      `Bulk removed ${tagIds.length} tags from ${expenseIds.length} expenses`,
    );

    res.json({
      success: true,
      message: `Successfully removed tags from ${result.modifiedCount} expenses`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk remove tags error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk untag operation failed",
    });
  }
};

/**
 * @desc    Bulk categorize expenses
 * @route   PATCH /api/accounts/:id/bulk/expenses/categorize
 * @access  Private
 */
export const bulkCategorize = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { expenseIds, category } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Expense IDs array is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Update category
    const result = await Expense.updateMany(
      { _id: { $in: expenseIds }, accountId },
      { $set: { category } },
    );

    await logActivity(
      req.user.id,
      accountId,
      "expense",
      "bulk_categorize",
      `Bulk categorized ${result.modifiedCount} expenses as '${category}'`,
    );

    res.json({
      success: true,
      message: `Successfully categorized ${result.modifiedCount} expenses`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk categorize error:", error);
    res.status(500).json({
      success: false,
      message: "Bulk categorize failed",
    });
  }
};

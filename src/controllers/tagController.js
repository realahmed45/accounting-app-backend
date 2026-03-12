import Tag from "../models/Tag.js";
import Expense from "../models/Expense.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Get all tags for an account
 * @route   GET /api/accounts/:id/tags
 * @access  Private
 */
export const getTags = async (req, res) => {
  try {
    const accountId = req.params.id;

    const tags = await Tag.find({ accountId })
      .sort({ usageCount: -1, name: 1 })
      .populate("createdBy", "name email");

    res.json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tags",
    });
  }
};

/**
 * @desc    Create a new tag
 * @route   POST /api/accounts/:id/tags
 * @access  Private
 */
export const createTag = async (req, res) => {
  try {
    const accountId = req.params.id;
    const { name, color, description } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ accountId, name });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: "A tag with this name already exists",
      });
    }

    const tag = await Tag.create({
      accountId,
      name,
      color: color || "#3B82F6",
      description,
      createdBy: req.user.id,
    });

    await logActivity(
      req.user.id,
      accountId,
      "tag",
      "create",
      `Created tag: ${name}`,
    );

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Create tag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tag",
    });
  }
};

/**
 * @desc    Update a tag
 * @route   PUT /api/accounts/:id/tags/:tagId
 * @access  Private
 */
export const updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name, color, description } = req.body;

    let tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    // Check for duplicate name
    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({
        accountId: tag.accountId,
        name,
        _id: { $ne: tagId },
      });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: "A tag with this name already exists",
        });
      }
    }

    tag.name = name || tag.name;
    tag.color = color || tag.color;
    tag.description = description !== undefined ? description : tag.description;

    await tag.save();

    await logActivity(
      req.user.id,
      tag.accountId,
      "tag",
      "update",
      `Updated tag: ${tag.name}`,
    );

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Update tag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tag",
    });
  }
};

/**
 * @desc    Delete a tag
 * @route   DELETE /api/accounts/:id/tags/:tagId
 * @access  Private
 */
export const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    const tag = await Tag.findById(tagId);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    // Remove tag from all expenses
    await Expense.updateMany({ tags: tagId }, { $pull: { tags: tagId } });

    await tag.deleteOne();

    await logActivity(
      req.user.id,
      tag.accountId,
      "tag",
      "delete",
      `Deleted tag: ${tag.name}`,
    );

    res.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Delete tag error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tag",
    });
  }
};

/**
 * @desc    Get popular tags (most used)
 * @route   GET /api/accounts/:id/tags/popular
 * @access  Private
 */
export const getPopularTags = async (req, res) => {
  try {
    const accountId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const tags = await Tag.find({ accountId })
      .sort({ usageCount: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    console.error("Get popular tags error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular tags",
    });
  }
};

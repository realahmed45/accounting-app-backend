import BillPhoto from "../models/BillPhoto.js";
import Expense from "../models/Expense.js";
import Account from "../models/Account.js";

// @desc    Upload bill photo
// @route   POST /api/photos/upload/:expenseId
// @access  Private
export const uploadBillPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const expense = await Expense.findById(req.params.expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Verify ownership
    const account = await Account.findById(expense.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Convert buffer to base64 data URL and save directly to DB
    const base64Data = req.file.buffer.toString("base64");
    const imageData = `data:${req.file.mimetype};base64,${base64Data}`;

    const billPhoto = await BillPhoto.create({
      expenseId: req.params.expenseId,
      accountId: expense.accountId,
      imageData,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: billPhoto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get photos for an expense
// @route   GET /api/photos/expense/:expenseId
// @access  Private
export const getPhotosByExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Verify ownership
    const account = await Account.findById(expense.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const photos = await BillPhoto.find({
      expenseId: req.params.expenseId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete photo
// @route   DELETE /api/photos/:id
// @access  Private
export const deletePhoto = async (req, res) => {
  try {
    const photo = await BillPhoto.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
      });
    }

    // Verify ownership
    const account = await Account.findById(photo.accountId);
    if (account.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Delete from database
    await photo.deleteOne();

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

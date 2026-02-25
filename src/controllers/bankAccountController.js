import AccountMember from "../models/AccountMember.js";

// Helper – verify account membership and return member record
const verifyAccountMembership = async (accountId, userId) => {
  const member = await AccountMember.findOne({ accountId, userId });
  if (!member) return { error: "Not authorized to access this account", status: 403 };
  return { member };
};

// @desc    Get all bank accounts for an account
// @route   GET /api/accounts/:id/bank-accounts
// @access  Private
export const getBankAccounts = async (req, res) => {
  try {
    const { error, status, member } = await verifyAccountMembership(
      req.params.id,
      req.user.id,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    const bankAccounts = await BankAccount.find({
      accountId: req.params.id,
      isActive: true,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: bankAccounts.length,
      data: bankAccounts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a bank account
// @route   POST /api/accounts/:id/bank-accounts
// @access  Private
export const createBankAccount = async (req, res) => {
  try {
    const { error, status, member } = await verifyAccountMembership(
      req.params.id,
      req.user.id,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    if (member.role !== "owner" && !member.permissions.addBankAccount) {
      return res.status(403).json({ success: false, message: "No permission to add bank accounts" });
    }

    const { name, bankName, accountType, lastFourDigits, balance, currency } =
      req.body;

    const bankAccount = await BankAccount.create({
      accountId: req.params.id,
      userId: req.user.id,
      name,
      bankName: bankName || "",
      accountType: accountType || "checking",
      lastFourDigits: lastFourDigits || "",
      balance: balance || 0,
      currency: currency || "USD",
    });

    res.status(201).json({ success: true, data: bankAccount });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a bank account
// @route   PUT /api/accounts/:id/bank-accounts/:bankId
// @access  Private
export const updateBankAccount = async (req, res) => {
  try {
    const { error, status, member } = await verifyAccountMembership(
      req.params.id,
      req.user.id,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: req.params.bankId, accountId: req.params.id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!bankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }

    res.status(200).json({ success: true, data: bankAccount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete (soft-delete) a bank account
// @route   DELETE /api/accounts/:id/bank-accounts/:bankId
// @access  Private
export const deleteBankAccount = async (req, res) => {
  try {
    const { error, status, member } = await verifyAccountMembership(
      req.params.id,
      req.user.id,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: req.params.bankId, accountId: req.params.id },
      { isActive: false },
      { new: true },
    );

    if (!bankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

import AccountMember from "../models/AccountMember.js";
import BankAccount from "../models/BankAccount.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Account from "../models/Account.js";

// Helper – verify account membership and return member record
const verifyAccountMembership = async (accountId, userId) => {
  const member = await AccountMember.findOne({ accountId, userId });
  if (!member)
    return { error: "Not authorized to access this account", status: 403 };
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
      return res.status(403).json({
        success: false,
        message: "No permission to add bank accounts",
      });
    }

    const { name, bankName, accountType, lastFourDigits, balance, currency } =
      req.body;

    // Get the account to check if this is first bank and enforce currency
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Check existing bank accounts
    const existingBanks = await BankAccount.find({
      accountId: req.params.id,
      isActive: true,
    });

    let finalCurrency = currency || "USD";

    if (existingBanks.length === 0) {
      // First bank account - set account currency
      account.currency = finalCurrency;
      await account.save();
    } else {
      // Enforce account currency for subsequent banks
      finalCurrency = account.currency || "USD";
    }

    const bankAccount = await BankAccount.create({
      accountId: req.params.id,
      userId: req.user.id,
      name,
      bankName: bankName || "",
      accountType: accountType || "checking",
      lastFourDigits: lastFourDigits || "",
      balance: balance || 0,
      currency: finalCurrency,
    });

    // Log activity
    const user = await User.findById(req.user.id);
    const displayName = user ? `${user.firstName} ${user.lastName}` : "System";
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: displayName,
      action: "bank_account_added",
      targetDescription: `Added bank account: ${name} (${bankName})`,
      metadata: { bankAccountId: bankAccount._id, initialBalance: balance },
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

    // Log activity
    const user = await User.findById(req.user.id);
    const displayName = user ? `${user.firstName} ${user.lastName}` : "System";
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: displayName,
      action: "account_settings_changed",
      targetDescription: `Updated bank account: ${bankAccount.name}`,
      metadata: { bankAccountId: bankAccount._id },
    });

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

    // Log activity
    const user = await User.findById(req.user.id);
    const displayName = user ? `${user.firstName} ${user.lastName}` : "System";
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: displayName,
      action: "bank_account_removed",
      targetDescription: `Removed bank account: ${bankAccount.name}`,
      metadata: { bankAccountId: bankAccount._id },
    });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Adjust bank account balance
// @route   POST /api/accounts/:id/bank-accounts/:bankId/adjust
// @access  Private
export const adjustBalance = async (req, res) => {
  try {
    const { error, status, member } = await verifyAccountMembership(
      req.params.id,
      req.user.id,
    );
    if (error)
      return res.status(status).json({ success: false, message: error });

    if (member.role !== "owner" && !member.permissions.calculateCash) {
      return res.status(403).json({
        success: false,
        message: "No permission to adjust bank balances",
      });
    }

    const bankAccount = await BankAccount.findOne({
      _id: req.params.bankId,
      accountId: req.params.id,
    });

    if (!bankAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Bank account not found" });
    }

    const { newBalance, reason } = req.body;

    if (typeof newBalance !== "number" || newBalance < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid balance amount" });
    }

    const oldBalance = bankAccount.balance;
    const difference = newBalance - oldBalance;
    bankAccount.balance = newBalance;
    await bankAccount.save();

    // Log activity
    const user = await User.findById(req.user.id);
    const displayName = user ? `${user.firstName} ${user.lastName}` : "System";
    await ActivityLog.create({
      accountId: req.params.id,
      actorUserId: req.user.id,
      actorDisplayName: displayName,
      action: "account_settings_changed",
      targetDescription: `Adjusted ${bankAccount.name} balance from $${oldBalance.toFixed(2)} to $${newBalance.toFixed(2)} (${difference >= 0 ? "+" : ""}$${difference.toFixed(2)})${reason ? `: ${reason}` : ""}`,
      metadata: {
        bankAccountId: bankAccount._id,
        oldBalance,
        newBalance,
        difference,
        reason,
      },
    });

    res.status(200).json({ success: true, data: bankAccount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

import Shift from "../models/Shift.js";
import ShiftType from "../models/ShiftType.js";
import Expense from "../models/Expense.js";
import BankAccount from "../models/BankAccount.js";
import AccountMember from "../models/AccountMember.js";

/**
 * SAMPLE DATA SEEDER
 * Creates realistic demo data for new users to explore and learn the system
 * This is NOT dummy data - it's educational sample data that helps users understand features
 */

/**
 * Seed sample shift data for scheduling feature
 */
export const seedSampleShifts = async (accountId) => {
  try {
    // Check if account already has shift types
    const existingShiftTypes = await ShiftType.find({ accountId });
    if (existingShiftTypes.length > 0) {
      return { success: true, message: "Sample shift data already exists" };
    }

    // Create sample shift types
    const shiftTypes = [
      {
        accountId,
        name: "Morning Shift",
        description: "Standard morning shift - Great for early birds!",
        startTime: "09:00",
        endTime: "17:00",
        color: "#3b82f6", // Blue
        isActive: true,
      },
      {
        accountId,
        name: "Evening Shift",
        description: "Evening coverage - Perfect for night owls!",
        startTime: "14:00",
        endTime: "22:00",
        color: "#8b5cf6", // Purple
        isActive: true,
      },
      {
        accountId,
        name: "Night Shift",
        description: "Overnight operations - Extra pay included!",
        startTime: "22:00",
        endTime: "06:00",
        color: "#ec4899", // Pink
        isActive: true,
      },
      {
        accountId,
        name: "Split Shift",
        description: "Two sessions with break - Flexible schedule!",
        startTime: "08:00",
        endTime: "14:00",
        color: "#10b981", // Green
        isActive: true,
      },
      {
        accountId,
        name: "Weekend Special",
        description: "Weekend coverage - Premium rate!",
        startTime: "10:00",
        endTime: "18:00",
        color: "#f59e0b", // Orange
        isActive: true,
      },
    ];

    const createdShiftTypes = await ShiftType.insertMany(shiftTypes);

    // Get all members in the account
    const members = await AccountMember.find({ accountId }).limit(5);

    if (members.length === 0) {
      return {
        success: true,
        message: "Sample shift types created, but no members to assign shifts",
      };
    }

    // Create sample shifts for the next 2 weeks
    const sampleShifts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + dayOffset);

      // Skip weekends for some variety
      if (shiftDate.getDay() === 0 || shiftDate.getDay() === 6) {
        // Only add weekend special shifts
        sampleShifts.push({
          accountId,
          shiftTypeId: createdShiftTypes[4]._id, // Weekend Special
          date: shiftDate,
          assignedMemberId: members[dayOffset % members.length]._id,
          status: "scheduled",
          notes: "🎯 Sample weekend shift - Explore the scheduling features!",
        });
      } else {
        // Add 2-3 shifts per weekday
        const shiftsPerDay = Math.floor(Math.random() * 2) + 2; // 2 or 3 shifts
        for (let i = 0; i < shiftsPerDay && i < members.length; i++) {
          const shiftTypeIndex = i % 4; // Cycle through first 4 shift types
          sampleShifts.push({
            accountId,
            shiftTypeId: createdShiftTypes[shiftTypeIndex]._id,
            date: shiftDate,
            assignedMemberId: members[(dayOffset + i) % members.length]._id,
            status: "scheduled",
            notes: `📘 Sample shift #${i + 1} - This is demo data to help you learn!`,
          });
        }
      }
    }

    await Shift.insertMany(sampleShifts);

    return {
      success: true,
      message: `Created ${createdShiftTypes.length} shift types and ${sampleShifts.length} sample shifts`,
      data: {
        shiftTypes: createdShiftTypes.length,
        shifts: sampleShifts.length,
      },
    };
  } catch (error) {
    console.error("Error seeding sample shifts:", error);
    throw error;
  }
};

/**
 * Seed sample expense data
 */
export const seedSampleExpenses = async (accountId, userId) => {
  try {
    // Check if account already has expenses
    const existingExpenses = await Expense.find({ accountId }).limit(1);
    if (existingExpenses.length > 0) {
      return { success: true, message: "Sample expense data already exists" };
    }

    // Check if account has bank accounts
    let bankAccount = await BankAccount.findOne({ accountId });

    // If no bank account exists, create a sample one
    if (!bankAccount) {
      bankAccount = await BankAccount.create({
        accountId,
        name: "Sample Business Account",
        bankName: "Demo Bank",
        accountNumber: "****1234",
        accountType: "checking",
        currency: "USD",
        currentBalance: 50000,
        description:
          "📘 This is sample data to help you explore expense tracking!",
        isActive: true,
        owner: userId,
      });
    }

    // Create sample expense categories
    const categories = [
      "Office Supplies",
      "Travel",
      "Meals & Entertainment",
      "Utilities",
      "Marketing",
      "Software & Subscriptions",
      "Equipment",
      "Rent",
    ];

    // Create sample expenses for the last 30 days
    const sampleExpenses = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const expenseDate = new Date(today);
      expenseDate.setDate(today.getDate() - dayOffset);

      // Add 1-3 expenses per day
      const expensesPerDay = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < expensesPerDay; i++) {
        const category =
          categories[Math.floor(Math.random() * categories.length)];
        const amount = (Math.random() * 500 + 20).toFixed(2);

        sampleExpenses.push({
          accountId,
          amount: parseFloat(amount),
          category,
          description: `📘 Sample ${category} expense - This is demo data to help you learn!`,
          date: expenseDate,
          paymentMethod: Math.random() > 0.5 ? "credit_card" : "cash",
          bankAccountId: bankAccount._id,
          receiptUrl: null,
          status: "approved",
          approvedBy: userId,
          submittedBy: userId,
          createdBy: userId,
        });
      }
    }

    await Expense.insertMany(sampleExpenses);

    return {
      success: true,
      message: `Created ${sampleExpenses.length} sample expenses`,
      data: {
        expenses: sampleExpenses.length,
        bankAccount: bankAccount._id,
      },
    };
  } catch (error) {
    console.error("Error seeding sample expenses:", error);
    throw error;
  }
};

/**
 * Master seed function - seeds all sample data types
 */
export const seedAllSampleData = async (accountId, userId) => {
  try {
    const results = {
      shifts: null,
      expenses: null,
    };

    // Seed shifts
    try {
      results.shifts = await seedSampleShifts(accountId);
    } catch (err) {
      results.shifts = { success: false, error: err.message };
    }

    // Seed expenses
    try {
      results.expenses = await seedSampleExpenses(accountId, userId);
    } catch (err) {
      results.expenses = { success: false, error: err.message };
    }

    return {
      success: true,
      message: "Sample data seeding completed",
      results,
    };
  } catch (error) {
    console.error("Error in master seed function:", error);
    throw error;
  }
};

/**
 * Clear all sample data (for testing purposes)
 */
export const clearSampleData = async (accountId) => {
  try {
    // Delete shifts and shift types with sample notes
    await Shift.deleteMany({
      accountId,
      notes: { $regex: /📘|🎯|Sample|demo data/i },
    });

    await ShiftType.deleteMany({
      accountId,
      description: { $regex: /📘|Sample|demo|Great for|Perfect for/i },
    });

    // Delete sample expenses
    await Expense.deleteMany({
      accountId,
      description: { $regex: /📘|Sample|demo data/i },
    });

    // Delete sample bank accounts
    await BankAccount.deleteMany({
      accountId,
      description: { $regex: /📘|Sample|demo data/i },
    });

    return {
      success: true,
      message: "Sample data cleared successfully",
    };
  } catch (error) {
    console.error("Error clearing sample data:", error);
    throw error;
  }
};

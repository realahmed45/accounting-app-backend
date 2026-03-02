import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Account from "../models/Account.js";
import AccountMember from "../models/AccountMember.js";
import Week from "../models/Week.js";
import Expense from "../models/Expense.js";
import BankAccount from "../models/BankAccount.js";
import Category from "../models/Category.js";
import Person from "../models/Person.js";
import BillPhoto from "../models/BillPhoto.js";
import CashFlowCheck from "../models/CashFlowCheck.js";
import Invitation from "../models/Invitation.js";
import ActivityLog from "../models/ActivityLog.js";
import AccountRelationship from "../models/AccountRelationship.js";
import OwnershipTransferRequest from "../models/OwnershipTransferRequest.js";
import Shift from "../models/Shift.js";
import ShiftType from "../models/ShiftType.js";
import ShiftCheckIn from "../models/ShiftCheckIn.js";
import ShiftCheckOut from "../models/ShiftCheckOut.js";
import WorkLog from "../models/WorkLog.js";
import ExtraHour from "../models/ExtraHour.js";
import TimeOffBalance from "../models/TimeOffBalance.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://chatbiz50_db_user:dtorU38nkLmTNdy8@cluster0.ehikyfh.mongodb.net/accounting-app?retryWrites=true&w=majority&appName=Cluster0",
    );
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanDatabase = async () => {
  try {
    await connectDB();

    console.log("\n🧹 Starting database cleanup...\n");

    // Delete all collections
    const collections = [
      { model: User, name: "Users" },
      { model: Account, name: "Accounts" },
      { model: AccountMember, name: "Account Members" },
      { model: Week, name: "Weeks" },
      { model: Expense, name: "Expenses" },
      { model: BankAccount, name: "Bank Accounts" },
      { model: Category, name: "Categories" },
      { model: Person, name: "People" },
      { model: BillPhoto, name: "Bill Photos" },
      { model: CashFlowCheck, name: "Cash Flow Checks" },
      { model: Invitation, name: "Invitations" },
      { model: ActivityLog, name: "Activity Logs" },
      { model: AccountRelationship, name: "Account Relationships" },
      { model: OwnershipTransferRequest, name: "Ownership Transfer Requests" },
      { model: Shift, name: "Shifts" },
      { model: ShiftType, name: "Shift Types" },
      { model: ShiftCheckIn, name: "Shift Check-Ins" },
      { model: ShiftCheckOut, name: "Shift Check-Outs" },
      { model: WorkLog, name: "Work Logs" },
      { model: ExtraHour, name: "Extra Hours" },
      { model: TimeOffBalance, name: "Time Off Balances" },
    ];

    for (const { model, name } of collections) {
      const result = await model.deleteMany({});
      console.log(`❌ Deleted ${result.deletedCount} ${name}`);
    }

    console.log("\n✅ Database cleaned successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    process.exit(1);
  }
};

// Run the cleanup
cleanDatabase();

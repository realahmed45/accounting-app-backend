import mongoose from "mongoose";
import dotenv from "dotenv";
import Account from "../models/Account.js";
import AccountMember from "../models/AccountMember.js";
import ShiftType from "../models/ShiftType.js";
import Shift from "../models/Shift.js";
import ShiftCheckIn from "../models/ShiftCheckIn.js";
import ShiftCheckOut from "../models/ShiftCheckOut.js";
import WorkLog from "../models/WorkLog.js";
import TimeOffBalance from "../models/TimeOffBalance.js";

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// Sample shift types
const sampleShiftTypes = [
  {
    name: "Morning Shift",
    startTime: "08:00",
    endTime: "16:00",
    breakMinutes: 60,
    color: "#10B981", // Emerald
  },
  {
    name: "Evening Shift",
    startTime: "14:00",
    endTime: "22:00",
    breakMinutes: 60,
    color: "#F59E0B", // Amber
  },
  {
    name: "Night Shift",
    startTime: "22:00",
    endTime: "06:00",
    breakMinutes: 60,
    color: "#6366F1", // Indigo
  },
  {
    name: "Part-Time",
    startTime: "09:00",
    endTime: "13:00",
    breakMinutes: 0,
    color: "#EC4899", // Pink
  },
];

// Helper to get dates for the current week
const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Generate sample image data (base64 placeholder)
const generateSampleImage = () => {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
};

// Main migration function
const populateSampleSchedulingData = async () => {
  try {
    console.log("\n🚀 Starting Sample Scheduling Data Migration...\n");

    // Get all accounts
    const accounts = await Account.find();
    console.log(`📊 Found ${accounts.length} accounts\n`);

    if (accounts.length === 0) {
      console.log("⚠️  No accounts found. Please create an account first.");
      return;
    }

    const weekDates = getCurrentWeekDates();
    const currentYear = new Date().getFullYear();

    for (const account of accounts) {
      console.log(`\n📁 Processing Account: ${account.accountName} (${account.uniqueId})`);

      // Get all members for this account
      const members = await AccountMember.find({ accountId: account._id });
      console.log(`   👥 Found ${members.length} members`);

      if (members.length === 0) {
        console.log("   ⚠️  Skipping - No members in this account");
        continue;
      }

      // 1. Create Shift Types
      console.log("   ⏰ Creating shift types...");
      const createdShiftTypes = [];

      for (const shiftTypeData of sampleShiftTypes) {
        // Check if shift type already exists
        const existing = await ShiftType.findOne({
          accountId: account._id,
          name: shiftTypeData.name,
        });

        if (existing) {
          console.log(`      ✓ ${shiftTypeData.name} (already exists)`);
          createdShiftTypes.push(existing);
        } else {
          const shiftType = await ShiftType.create({
            ...shiftTypeData,
            accountId: account._id,
          });
          console.log(`      ✓ ${shiftTypeData.name} (created)`);
          createdShiftTypes.push(shiftType);
        }
      }

      // 2. Create Sample Shifts for current week
      console.log("   📅 Creating sample shifts...");
      let shiftsCreated = 0;

      for (let i = 0; i < weekDates.length; i++) {
        const date = weekDates[i];
        
        // Create 2-3 shifts per day
        const shiftsPerDay = Math.floor(Math.random() * 2) + 2; // 2 or 3 shifts
        
        for (let j = 0; j < Math.min(shiftsPerDay, createdShiftTypes.length); j++) {
          const shiftType = createdShiftTypes[j];
          
          // Randomly assign to a member or leave open
          const shouldAssign = Math.random() > 0.3; // 70% chance of assignment
          const assignedMember = shouldAssign
            ? members[Math.floor(Math.random() * members.length)]
            : null;

          // Check if shift already exists
          const existingShift = await Shift.findOne({
            accountId: account._id,
            date: date,
            shiftTypeId: shiftType._id,
          });

          if (!existingShift) {
            await Shift.create({
              accountId: account._id,
              shiftTypeId: shiftType._id,
              date: date,
              assignedMemberId: assignedMember?._id || null,
              status: assignedMember ? "assigned" : "open",
              notes: shouldAssign ? "" : "Looking for coverage",
              createdBy: members[0].userId, // First member as creator
            });
            shiftsCreated++;
          }
        }
      }
      console.log(`      ✓ Created ${shiftsCreated} shifts`);

      // 3. Create Sample Check-Ins (for past days only)
      console.log("   ✅ Creating sample check-ins...");
      let checkInsCreated = 0;

      const pastShifts = await Shift.find({
        accountId: account._id,
        status: "assigned",
        date: { $lt: new Date() }, // Only past dates
      })
        .populate("assignedMemberId")
        .limit(10);

      for (const shift of pastShifts) {
        // 80% chance of having check-in
        if (Math.random() > 0.2 && shift.assignedMemberId) {
          const existingCheckIn = await ShiftCheckIn.findOne({
            shiftId: shift._id,
          });

          if (!existingCheckIn) {
            await ShiftCheckIn.create({
              accountId: account._id,
              shiftId: shift._id,
              memberId: shift.assignedMemberId._id,
              checkInTime: shift.date,
              imageData: generateSampleImage(),
              latitude: 40.7128 + Math.random() * 0.1,
              longitude: -74.006 + Math.random() * 0.1,
              locationLabel: "Office Location",
            });
            checkInsCreated++;
          }
        }
      }
      console.log(`      ✓ Created ${checkInsCreated} check-ins`);

      // 4. Create Sample Check-Outs (for shifts with check-ins)
      console.log("   ❌ Creating sample check-outs...");
      let checkOutsCreated = 0;

      const checkIns = await ShiftCheckIn.find({
        accountId: account._id,
      });

      for (const checkIn of checkIns) {
        // 70% chance of having check-out
        if (Math.random() > 0.3) {
          const existingCheckOut = await ShiftCheckOut.findOne({
            shiftId: checkIn.shiftId,
          });

          if (!existingCheckOut) {
            const shift = await Shift.findById(checkIn.shiftId).populate(
              "shiftTypeId"
            );
            if (shift && shift.shiftTypeId) {
              const checkOutDate = new Date(checkIn.checkInTime);
              const [endHour, endMin] = shift.shiftTypeId.endTime
                .split(":")
                .map(Number);
              checkOutDate.setHours(endHour, endMin, 0, 0);

              await ShiftCheckOut.create({
                accountId: account._id,
                shiftId: checkIn.shiftId,
                memberId: checkIn.memberId,
                checkOutTime: checkOutDate,
                imageData: generateSampleImage(),
                latitude: 40.7128 + Math.random() * 0.1,
                longitude: -74.006 + Math.random() * 0.1,
                locationLabel: "Office Location",
              });
              checkOutsCreated++;
            }
          }
        }
      }
      console.log(`      ✓ Created ${checkOutsCreated} check-outs`);

      // 5. Create Sample Work Logs
      console.log("   📝 Creating sample work logs...");
      let workLogsCreated = 0;

      for (const member of members.slice(0, Math.min(3, members.length))) {
        // Create 3-5 work logs per member
        const logsToCreate = Math.floor(Math.random() * 3) + 3;

        for (let i = 0; i < logsToCreate; i++) {
          const randomPastDate = new Date();
          randomPastDate.setDate(
            randomPastDate.getDate() - Math.floor(Math.random() * 14)
          );

          const startHour = 8 + Math.floor(Math.random() * 4);
          const durationHours = 4 + Math.floor(Math.random() * 5);
          const endHour = startHour + durationHours;

          const existingLog = await WorkLog.findOne({
            accountId: account._id,
            memberId: member._id,
            date: randomPastDate,
          });

          if (!existingLog) {
            await WorkLog.create({
              accountId: account._id,
              memberId: member._id,
              date: randomPastDate,
              startTime: `${String(startHour).padStart(2, "0")}:00`,
              endTime: `${String(endHour).padStart(2, "0")}:00`,
              durationMinutes: durationHours * 60,
              note: "Sample work log entry",
              loggedBy: members[0].userId, // First member as logger
            });
            workLogsCreated++;
          }
        }
      }
      console.log(`      ✓ Created ${workLogsCreated} work logs`);

      // 6. Create Time Off Balances
      console.log("   🏖️  Creating time off balances...");
      let balancesCreated = 0;

      for (const member of members) {
        const existingBalance = await TimeOffBalance.findOne({
          accountId: account._id,
          memberId: member._id,
          year: currentYear,
        });

        if (!existingBalance) {
          await TimeOffBalance.create({
            accountId: account._id,
            memberId: member._id,
            year: currentYear,
            annualAllowanceDays: 20 + Math.floor(Math.random() * 10), // 20-30 days
            usedDays: Math.floor(Math.random() * 10), // 0-10 days used
            extraEarnedDays: Math.floor(Math.random() * 3), // 0-3 extra days
          });
          balancesCreated++;
        }
      }
      console.log(`      ✓ Created ${balancesCreated} time off balances`);

      console.log(`   ✅ Completed account: ${account.accountName}\n`);
    }

    console.log("\n🎉 Sample Data Migration Completed Successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Processed ${accounts.length} accounts`);
    console.log(`   - Created shift types, shifts, check-ins, check-outs, work logs, and time off balances`);
    console.log(`   - All data can be edited or deleted by users via the Schedule screen\n`);
  } catch (error) {
    console.error("\n❌ Migration Error:", error);
    throw error;
  }
};

// Run the migration
const run = async () => {
  try {
    await connectDB();
    await populateSampleSchedulingData();
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

run();

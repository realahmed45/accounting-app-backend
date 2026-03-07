import Expense from "../models/Expense.js";
import Shift from "../models/Shift.js";
import ShiftCheckIn from "../models/ShiftCheckIn.js";
import ShiftCheckOut from "../models/ShiftCheckOut.js";
import WorkLog from "../models/WorkLog.js";
import BillPhoto from "../models/BillPhoto.js";
import AccountMember from "../models/AccountMember.js";
import User from "../models/User.js";
import Week from "../models/Week.js";
import ActivityLog from "../models/ActivityLog.js";

// @desc    Get comprehensive daily breakdown
// @route   GET /api/accounts/:id/daily-activity
// @access  Private
export const getDailyBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, weekId } = req.query;
    const accountId = req.params.id;

    // Verify member access
    const member = await AccountMember.findOne({
      accountId,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch all activities in parallel
    const [
      expenses,
      shifts,
      checkIns,
      checkOuts,
      workLogs,
      billPhotos,
      activityLogs,
    ] = await Promise.all([
      // Expenses with user info
      Expense.find({
        accountId,
        ...(weekId ? { weekId } : {}),
        ...(startDate && endDate ? { date: dateQuery } : {}),
      })
        .populate("userId", "firstName familyName")
        .sort({ date: 1, createdAt: 1 }),

      // Shifts
      Shift.find({
        accountId,
        ...(startDate && endDate ? { date: dateQuery } : {}),
      })
        .populate("shiftTypeId")
        .populate("assignedMemberId", "displayName userId")
        .populate("createdBy", "firstName familyName")
        .sort({ date: 1 }),

      // Check-ins
      ShiftCheckIn.find({
        accountId,
        ...(startDate && endDate ? { checkInTime: dateQuery } : {}),
      })
        .populate("memberId", "displayName userId")
        .populate("shiftId")
        .sort({ checkInTime: 1 }),

      // Check-outs
      ShiftCheckOut.find({
        accountId,
        ...(startDate && endDate ? { checkOutTime: dateQuery } : {}),
      })
        .populate("memberId", "displayName userId")
        .populate("shiftId")
        .sort({ checkOutTime: 1 }),

      // Work logs
      WorkLog.find({
        accountId,
        ...(startDate && endDate ? { date: dateQuery } : {}),
      })
        .populate("memberId", "displayName userId")
        .populate("loggedBy", "firstName familyName")
        .sort({ date: 1, createdAt: 1 }),

      // Bill photos (for expenses)
      BillPhoto.find({ accountId }).populate(
        "uploadedBy",
        "firstName familyName",
      ),

      // Activity logs (all other activities)
      ActivityLog.find({
        accountId,
        ...(startDate && endDate ? { createdAt: dateQuery } : {}),
      })
        .populate("actorUserId", "firstName familyName")
        .sort({ createdAt: 1 }),
    ]);

    // Get week details if weekId provided
    let week = null;
    if (weekId) {
      week = await Week.findById(weekId);
    }

    // Organize data by date
    const dailyData = {};

    // Add expenses
    expenses.forEach((expense) => {
      const dateStr = expense.date.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      // Find photos for this expense
      const expensePhotos = billPhotos.filter(
        (photo) => photo.expenseId.toString() === expense._id.toString(),
      );

      dailyData[dateStr].expenses.push({
        _id: expense._id,
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        paymentSource: expense.paymentSource,
        bankAccountId: expense.bankAccountId,
        user: expense.userId
          ? {
              name: `${expense.userId.firstName} ${expense.userId.familyName}`,
              id: expense.userId._id,
            }
          : null,
        timestamp: expense.createdAt || expense.date,
        photos: expensePhotos.map((p) => ({
          fileUrl: p.fileUrl,
          fileName: p.fileName,
          uploadedBy: p.uploadedBy
            ? {
                name: `${p.uploadedBy.firstName} ${p.uploadedBy.familyName}`,
                id: p.uploadedBy._id,
              }
            : null,
          timestamp: p.uploadedAt || p.createdAt,
        })),
      });
    });

    // Add shifts
    shifts.forEach((shift) => {
      const dateStr = shift.date.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      dailyData[dateStr].shifts.push({
        _id: shift._id,
        type: shift.shiftTypeId
          ? {
              label: shift.shiftTypeId.label,
              startTime: shift.shiftTypeId.startTime,
              endTime: shift.shiftTypeId.endTime,
            }
          : {
              label: shift.adHocLabel,
              startTime: shift.adHocStart,
              endTime: shift.adHocEnd,
            },
        assignedTo: shift.assignedMemberId
          ? {
              name: shift.assignedMemberId.displayName,
              id: shift.assignedMemberId._id,
              userId: shift.assignedMemberId.userId,
            }
          : null,
        status: shift.status,
        notes: shift.notes,
        createdBy: shift.createdBy
          ? {
              name: `${shift.createdBy.firstName} ${shift.createdBy.familyName}`,
              id: shift.createdBy._id,
            }
          : null,
        timestamp: shift.createdAt,
      });
    });

    // Add check-ins
    checkIns.forEach((checkIn) => {
      const dateStr = checkIn.checkInTime.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      dailyData[dateStr].checkIns.push({
        _id: checkIn._id,
        member: checkIn.memberId
          ? {
              name: checkIn.memberId.displayName,
              id: checkIn.memberId._id,
              userId: checkIn.memberId.userId,
            }
          : null,
        checkInTime: checkIn.checkInTime,
        imageData: checkIn.imageData,
        location: checkIn.locationLabel || null,
        coordinates: {
          latitude: checkIn.latitude,
          longitude: checkIn.longitude,
        },
        timestamp: checkIn.createdAt || checkIn.checkInTime,
      });
    });

    // Add check-outs
    checkOuts.forEach((checkOut) => {
      const dateStr = checkOut.checkOutTime.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      dailyData[dateStr].checkOuts.push({
        _id: checkOut._id,
        member: checkOut.memberId
          ? {
              name: checkOut.memberId.displayName,
              id: checkOut.memberId._id,
              userId: checkOut.memberId.userId,
            }
          : null,
        checkOutTime: checkOut.checkOutTime,
        imageData: checkOut.imageData,
        location: checkOut.locationLabel || null,
        coordinates: {
          latitude: checkOut.latitude,
          longitude: checkOut.longitude,
        },
        timestamp: checkOut.createdAt || checkOut.checkOutTime,
      });
    });

    // Add work logs
    workLogs.forEach((log) => {
      const dateStr = log.date.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      dailyData[dateStr].workLogs.push({
        _id: log._id,
        member: log.memberId
          ? {
              name: log.memberId.displayName,
              id: log.memberId._id,
              userId: log.memberId.userId,
            }
          : null,
        startTime: log.startTime,
        endTime: log.endTime,
        durationMinutes: log.durationMinutes,
        note: log.note,
        loggedBy: log.loggedBy
          ? {
              name: `${log.loggedBy.firstName} ${log.loggedBy.familyName}`,
              id: log.loggedBy._id,
            }
          : null,
        timestamp: log.createdAt,
      });
    });

    // Add activity logs (everything else)
    activityLogs.forEach((activity) => {
      const dateStr = activity.createdAt.toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          shifts: [],
          checkIns: [],
          checkOuts: [],
          workLogs: [],
          photos: [],
          activities: [],
        };
      }

      dailyData[dateStr].activities.push({
        _id: activity._id,
        action: activity.action,
        actorName: activity.actorDisplayName,
        actorUserId: activity.actorUserId,
        description: activity.targetDescription,
        metadata: activity.metadata || {},
        timestamp: activity.createdAt,
      });
    });

    // Convert to array and sort by date
    const dailyArray = Object.values(dailyData).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    res.status(200).json({
      success: true,
      data: {
        daily: dailyArray,
        week: week,
        summary: {
          totalExpenses: expenses.length,
          totalShifts: shifts.length,
          totalCheckIns: checkIns.length,
          totalCheckOuts: checkOuts.length,
          totalWorkLogs: workLogs.length,
          totalActivities: activityLogs.length,
          totalExpenseAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        },
      },
    });
  } catch (error) {
    console.error("Daily breakdown error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

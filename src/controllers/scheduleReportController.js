import Shift from "../models/Shift.js";
import ExtraHour from "../models/ExtraHour.js";
import WorkLog from "../models/WorkLog.js";
import TimeOffBalance from "../models/TimeOffBalance.js";
import AccountMember from "../models/AccountMember.js";

// @desc    Get monthly hours summary
// @route   GET /api/accounts/:id/schedule/reports/monthly
// @access  Private (Manager only)
export const getMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: "Month is required" });

    const year = parseInt(month.split("-")[0]);
    const monthIdx = parseInt(month.split("-")[1]) - 1;
    const startDate = new Date(year, monthIdx, 1);
    const endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59);

    const members = await AccountMember.find({ accountId: req.params.id });
    
    const reportData = await Promise.all(members.map(async (m) => {
      // 1. Scheduled Hours (assigned, non-cancelled shifts)
      const shifts = await Shift.find({
        accountId: req.params.id,
        assignedMemberId: m._id,
        date: { $gte: startDate, $lte: endDate },
        status: "assigned"
      }).populate("shiftTypeId");

      let scheduledMins = 0;
      shifts.forEach(s => {
        let start, end, breakMins = 0;
        if (s.shiftTypeId) {
          start = s.shiftTypeId.startTime;
          end = s.shiftTypeId.endTime;
          breakMins = s.shiftTypeId.breakMinutes || 0;
        } else {
          start = s.adHocStart;
          end = s.adHocEnd;
        }

        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        let duration = (eh * 60 + em) - (sh * 60 + sm);
        if (duration < 0) duration += 24 * 60;
        scheduledMins += (duration - breakMins);
      });

      // 2. Extra Hours (approved)
      const extras = await ExtraHour.find({
        accountId: req.params.id,
        memberId: m._id,
        date: { $gte: startDate, $lte: endDate },
        status: "approved"
      });
      const extraMins = extras.reduce((sum, r) => sum + r.durationMinutes, 0);

      // 3. Work Logs (manager added)
      const logs = await WorkLog.find({
        accountId: req.params.id,
        memberId: m._id,
        date: { $gte: startDate, $lte: endDate }
      });
      const logMins = logs.reduce((sum, r) => sum + r.durationMinutes, 0);

      // 4. Time Off
      const balance = await TimeOffBalance.findOne({
        accountId: req.params.id,
        memberId: m._id,
        year: year
      });

      return {
        memberId: m._id,
        displayName: m.displayName,
        scheduledHours: scheduledMins / 60,
        extraHours: extraMins / 60,
        workLogHours: logMins / 60,
        totalHours: (scheduledMins + extraMins + logMins) / 60,
        daysOffUsed: balance?.usedDays || 0,
        daysOffRemaining: (balance?.annualAllowanceDays || 0) + (balance?.extraEarnedDays || 0) - (balance?.usedDays || 0),
        extraDaysEarned: balance?.extraEarnedDays || 0
      };
    }));

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

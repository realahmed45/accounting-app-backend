import express from "express";
import { protect, requirePermission } from "../middleware/auth.js";
import * as shiftTypeController from "../controllers/shiftTypeController.js";
import * as shiftController from "../controllers/shiftController.js";
import * as extraHourController from "../controllers/extraHourController.js";
import * as shiftCheckInController from "../controllers/shiftCheckInController.js";
import * as shiftCheckOutController from "../controllers/shiftCheckOutController.js";
import * as timeOffController from "../controllers/timeOffController.js";
import * as workLogController from "../controllers/workLogController.js";
import * as reportController from "../controllers/scheduleReportController.js";
import { validateImageSize } from "../middleware/imageValidation.js";

const router = express.Router();

// All routes are account-scoped: /api/accounts/:id/schedule/...

// Middleware to inject accountId into req for consistency if needed (already in params :id)
router.use("/:id/schedule", protect);

// Shift Types
router.route("/:id/schedule/shift-types")
  .get(shiftTypeController.getAll)
  .post(requirePermission("manageSchedule"), shiftTypeController.create);

router.route("/:id/schedule/shift-types/:typeId")
  .put(requirePermission("manageSchedule"), shiftTypeController.update)
  .delete(requirePermission("manageSchedule"), shiftTypeController.remove);

// Shifts
router.route("/:id/schedule/shifts")
  .get(shiftController.getRange)
  .post(requirePermission("manageSchedule"), shiftController.create);

router.get("/:id/schedule/shifts/my", shiftController.getMine);

router.route("/:id/schedule/shifts/:shiftId")
  .put(requirePermission("manageSchedule"), shiftController.update)
  .delete(requirePermission("manageSchedule"), shiftController.cancel);

router.post("/:id/schedule/shifts/:shiftId/assign", requirePermission("manageSchedule"), shiftController.assign);

// Check-In
router.route("/:id/schedule/shifts/:shiftId/checkin")
  .post(validateImageSize(5), shiftCheckInController.submit)
  .get(shiftCheckInController.get);

// Check-Out
router.route("/:id/schedule/shifts/:shiftId/checkout")
  .post(validateImageSize(5), shiftCheckOutController.submit)
  .get(shiftCheckOutController.get);

// Extra Hours
router.route("/:id/schedule/extra-hours")
  .get(extraHourController.getAll)
  .post(validateImageSize(5), extraHourController.submit);

router.put("/:id/schedule/extra-hours/:ehId/review", requirePermission("manageSchedule"), extraHourController.review);

// Work Logs
router.route("/:id/schedule/work-logs")
  .get(workLogController.getAll)
  .post(requirePermission("manageSchedule"), workLogController.create);

router.delete("/:id/schedule/work-logs/:logId", requirePermission("manageSchedule"), workLogController.remove);

// Time Off
router.get("/:id/schedule/time-off", requirePermission("manageSchedule"), timeOffController.getAll);
router.get("/:id/schedule/time-off/me", timeOffController.getMine);
router.put("/:id/schedule/time-off/:memberId/allowance", requirePermission("manageSchedule"), timeOffController.setAllowance);
router.put("/:id/schedule/time-off/settings", requirePermission("manageSchedule"), timeOffController.setRatio);

// Reports
router.get("/:id/schedule/reports/monthly", requirePermission("manageSchedule"), reportController.getMonthlyReport);

export default router;

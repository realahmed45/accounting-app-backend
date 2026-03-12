import express from "express";
import {
  exportExpensesToCSV,
  exportExpensesToJSON,
  exportScheduleToCSV,
  exportAccountSummary,
  getExportOptions,
} from "../controllers/dataExportController.js";
import { protect } from "../middleware/auth.js";
import { requireFeature } from "../middleware/checkSubscription.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router.get("/options", getExportOptions);

router.get("/expenses/csv", requireFeature("dataExport"), exportExpensesToCSV);

router.get(
  "/expenses/json",
  requireFeature("dataExport"),
  exportExpensesToJSON,
);

router.get("/schedule/csv", requireFeature("dataExport"), exportScheduleToCSV);

router.get("/summary", requireFeature("dataExport"), exportAccountSummary);

export default router;

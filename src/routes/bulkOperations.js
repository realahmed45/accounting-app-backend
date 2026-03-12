import express from "express";
import {
  bulkDeleteExpenses,
  bulkUpdateExpenses,
  bulkAddTags,
  bulkRemoveTags,
  bulkCategorize,
} from "../controllers/bulkOperationsController.js";
import { protect } from "../middleware/auth.js";
import { requireFeature } from "../middleware/checkSubscription.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router.delete(
  "/expenses",
  requireFeature("advancedReports"),
  bulkDeleteExpenses,
);

router.patch(
  "/expenses",
  requireFeature("advancedReports"),
  bulkUpdateExpenses,
);

router.post("/expenses/tags", requireFeature("advancedReports"), bulkAddTags);

router.delete(
  "/expenses/tags",
  requireFeature("advancedReports"),
  bulkRemoveTags,
);

router.patch(
  "/expenses/categorize",
  requireFeature("advancedReports"),
  bulkCategorize,
);

export default router;

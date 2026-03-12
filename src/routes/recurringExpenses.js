import express from "express";
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
  processRecurringExpenses,
} from "../controllers/recurringExpenseController.js";
import { protect } from "../middleware/auth.js";
import { requireFeature } from "../middleware/checkSubscription.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router
  .route("/")
  .get(getRecurringExpenses)
  .post(requireFeature("advancedReports"), createRecurringExpense);

router
  .route("/:recurringId")
  .put(requireFeature("advancedReports"), updateRecurringExpense)
  .delete(requireFeature("advancedReports"), deleteRecurringExpense);

router.patch(
  "/:recurringId/toggle",
  requireFeature("advancedReports"),
  toggleRecurringExpense,
);

// Cron job endpoint (should be protected with API key in production)
router.post("/process", processRecurringExpenses);

export default router;

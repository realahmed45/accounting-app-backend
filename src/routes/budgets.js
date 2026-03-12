import express from "express";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController.js";
import { protect } from "../middleware/auth.js";
import { requireFeature } from "../middleware/checkSubscription.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router
  .route("/")
  .get(getBudgets)
  .post(requireFeature("advancedReports"), createBudget);

router
  .route("/:budgetId")
  .put(requireFeature("advancedReports"), updateBudget)
  .delete(requireFeature("advancedReports"), deleteBudget);

export default router;

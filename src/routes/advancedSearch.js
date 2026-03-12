import express from "express";
import {
  advancedSearch,
  getSearchFilters,
} from "../controllers/advancedSearchController.js";
import { protect } from "../middleware/auth.js";
import { requireFeature } from "../middleware/checkSubscription.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router.post("/", requireFeature("advancedReports"), advancedSearch);
router.get("/filters", getSearchFilters);

export default router;

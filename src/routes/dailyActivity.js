import express from "express";
import { protect } from "../middleware/auth.js";
import { getDailyBreakdown } from "../controllers/dailyActivityController.js";

const router = express.Router();

// Get comprehensive daily breakdown for an account
router.get("/:id/daily-activity", protect, getDailyBreakdown);

export default router;

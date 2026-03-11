import express from "express";
import {
  seedAll,
  seedShifts,
  seedExpenses,
  clearSamples,
} from "../controllers/sampleDataController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Seed all sample data
router.post("/seed-all", seedAll);

// Seed specific data types
router.post("/seed-shifts", seedShifts);
router.post("/seed-expenses", seedExpenses);

// Clear sample data
router.delete("/clear", clearSamples);

export default router;

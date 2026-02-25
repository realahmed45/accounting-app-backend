import express from "express";
import {
  createWeek,
  getWeeksByAccount,
  getWeek,
  updateWeek,
  lockWeek,
  deleteWeek,
  transferBankToCash,
  addCashToBox,
} from "../controllers/weekController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createWeek);
router.get("/account/:accountId", protect, getWeeksByAccount);

router
  .route("/:id")
  .get(protect, getWeek)
  .put(protect, updateWeek)
  .delete(protect, deleteWeek);

router.put("/:id/lock", protect, lockWeek);
router.post("/:id/transfer-bank-to-cash", protect, transferBankToCash);
router.post("/:id/add-cash", protect, addCashToBox);

export default router;

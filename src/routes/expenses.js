import express from "express";
import {
  createExpense,
  getExpensesByWeek,
  getExpensesByAccount,
  getExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createExpense);
router.get("/week/:weekId", protect, getExpensesByWeek);
router.get("/account/:accountId", protect, getExpensesByAccount);

router
  .route("/:id")
  .get(protect, getExpense)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

export default router;

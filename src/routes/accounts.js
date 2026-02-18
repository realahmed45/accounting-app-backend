import express from "express";
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  getPeople,
  createPerson,
} from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(protect, getAccounts).post(protect, createAccount);

router
  .route("/:id")
  .get(protect, getAccount)
  .put(protect, updateAccount)
  .delete(protect, deleteAccount);

router
  .route("/:id/categories")
  .get(protect, getCategories)
  .post(protect, createCategory);

router.route("/:id/people").get(protect, getPeople).post(protect, createPerson);

export default router;

import express from "express";
import {
  uploadBillPhoto,
  getPhotosByExpense,
  deletePhoto,
} from "../controllers/photoController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/upload/:expenseId",
  protect,
  upload.single("photo"),
  uploadBillPhoto,
);
router.get("/expense/:expenseId", protect, getPhotosByExpense);
router.delete("/:id", protect, deletePhoto);

export default router;

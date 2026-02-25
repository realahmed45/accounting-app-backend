import express from "express";
import {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  verifyPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.post("/verify-password", protect, verifyPassword);

export default router;

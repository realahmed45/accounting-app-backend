import express from "express";
import {
  getInvitation,
  acceptInvitation,
  resendInvitation,
} from "../controllers/invitationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes — no auth needed
router.get("/:token", getInvitation);
router.post("/:token/accept", acceptInvitation);

// Authenticated route — resend
router.post("/resend", protect, resendInvitation);

export default router;

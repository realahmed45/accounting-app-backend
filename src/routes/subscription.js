import express from "express";
import {
  getSubscription,
  getPlans,
  subscribeToPlan,
  cancelSubscription,
  getUsage,
  updatePaymentMethod,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/plans", getPlans);

// Protected routes
router.use(protect);

router.get("/", getSubscription);
router.get("/usage", getUsage);
router.post("/subscribe", subscribeToPlan);
router.post("/cancel", cancelSubscription);
router.put("/payment-method", updatePaymentMethod);

export default router;

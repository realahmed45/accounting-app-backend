import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { logActivity } from "../utils/activityLogger.js";

/**
 * @desc    Get current user's subscription
 * @route   GET /api/subscription
 * @access  Private
 */
export const getSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user.id });

    // Create free subscription if doesn't exist
    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.user.id,
        currentPlan: "free",
        status: "active",
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription",
    });
  }
};

/**
 * @desc    Get all available plans with pricing
 * @route   GET /api/subscription/plans
 * @access  Public
 */
export const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: "free",
        name: "Starter",
        description: "Perfect for individuals getting started",
        price: {
          monthly: 0,
          yearly: 0,
        },
        features: [
          "1 account/workspace",
          "50 expenses per month",
          "7-day expense history",
          "Basic categories",
          "Email support (48h response)",
          "Community forum access",
          "Sample data access",
          "Mobile web access",
        ],
        limits: {
          accounts: 1,
          expenses: 50,
          teamMembers: 0,
          storage: "50MB",
        },
        popular: false,
      },
      {
        id: "professional",
        name: "Professional",
        description: "For freelancers and solopreneurs",
        price: {
          monthly: 12,
          yearly: 120,
        },
        features: [
          "5 accounts/workspaces",
          "Unlimited expenses",
          "Unlimited history",
          "3 team members",
          "Custom categories & tags",
          "Photo storage (500MB)",
          "Basic scheduling (50 shifts/month)",
          "Email + chat support (24h)",
          "Export to CSV/PDF",
          "Mobile app access",
          "Remove branding",
          "Multi-currency support",
          "Bulk operations",
        ],
        limits: {
          accounts: 5,
          expenses: "Unlimited",
          teamMembers: 3,
          storage: "500MB",
        },
        popular: true,
      },
      {
        id: "business",
        name: "Business",
        description: "For growing teams and businesses",
        price: {
          monthly: 29,
          yearly: 290,
        },
        features: [
          "20 accounts/workspaces",
          "Unlimited everything",
          "Unlimited team members",
          "Advanced scheduling (unlimited)",
          "Photo storage (2GB)",
          "Overtime & shift management",
          "Advanced reports & analytics",
          "Priority support (12h response)",
          "API access (10,000 calls/month)",
          "Custom branding",
          "SSO (single sign-on)",
          "Bulk operations",
          "Advanced exports (Excel, QuickBooks)",
          "Scheduled reports",
        ],
        limits: {
          accounts: 20,
          expenses: "Unlimited",
          teamMembers: "Unlimited",
          storage: "2GB",
        },
        popular: false,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        price: {
          monthly: 79,
          yearly: "Custom",
        },
        features: [
          "Unlimited everything",
          "White-label option",
          "Dedicated account manager",
          "Phone support (2h response)",
          "Custom integrations",
          "Advanced API access (unlimited)",
          "SOC 2 compliance reports",
          "Custom contracts",
          "99.9% SLA guarantee",
          "Training & onboarding",
          "Priority feature requests",
          "Dedicated infrastructure (optional)",
        ],
        limits: {
          accounts: "Unlimited",
          expenses: "Unlimited",
          teamMembers: "Unlimited",
          storage: "Unlimited",
        },
        popular: false,
      },
    ];

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get plans",
    });
  }
};

/**
 * @desc    Subscribe to a plan (dummy implementation for now)
 * @route   POST /api/subscription/subscribe
 * @access  Private
 */
export const subscribeToPlan = async (req, res) => {
  try {
    const { plan, billingCycle, paymentMethod } = req.body;

    // Validate plan
    const validPlans = ["free", "professional", "business", "enterprise"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    // Get or create subscription
    let subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        currentPlan: plan,
        billingCycle: billingCycle || "monthly",
        status: "active",
        paymentMethod: paymentMethod || "none",
      });
    } else {
      subscription.currentPlan = plan;
      subscription.billingCycle = billingCycle || subscription.billingCycle;
      subscription.paymentMethod = paymentMethod || subscription.paymentMethod;
      subscription.status = "active";
    }

    // Set features based on plan
    subscription.featuresEnabled = Subscription.getPlanFeatures(plan);

    // Set pricing
    const pricing = Subscription.getPlanPricing(plan);
    subscription.amount =
      billingCycle === "yearly" ? pricing.yearly : pricing.monthly;

    // Set period dates
    const now = new Date();
    subscription.currentPeriodStart = now;
    if (billingCycle === "yearly") {
      subscription.currentPeriodEnd = new Date(
        now.setFullYear(now.getFullYear() + 1),
      );
    } else {
      subscription.currentPeriodEnd = new Date(
        now.setMonth(now.getMonth() + 1),
      );
    }

    await subscription.save();

    // Log activity
    await logActivity(
      req.user.id,
      null,
      "subscription",
      "update",
      `Subscribed to ${plan} plan (${billingCycle})`,
    );

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan} plan!`,
      data: subscription,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to plan",
    });
  }
};

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscription/cancel
 * @access  Private
 */
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();

    await subscription.save();

    // Log activity
    await logActivity(
      req.user.id,
      null,
      "subscription",
      "update",
      "Cancelled subscription",
    );

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};

/**
 * @desc    Get usage stats
 * @route   GET /api/subscription/usage
 * @access  Private
 */
export const getUsage = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Calculate actual usage
    const accounts = await Account.countDocuments({
      "members.user": req.user.id,
    });

    // Get plan limits
    const planLimits = {
      expensesThisMonth: subscription.checkLimit("expensesThisMonth"),
      accountsCount: subscription.checkLimit("accountsCount"),
      teamMembersCount: subscription.checkLimit("teamMembersCount"),
      storageUsedMB: subscription.checkLimit("storageUsedMB"),
      apiCallsThisMonth: subscription.checkLimit("apiCallsThisMonth"),
    };

    res.json({
      success: true,
      data: {
        plan: subscription.currentPlan,
        usage: subscription.usage,
        limits: planLimits,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Get usage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get usage stats",
    });
  }
};

/**
 * @desc    Update payment method (dummy for now)
 * @route   PUT /api/subscription/payment-method
 * @access  Private
 */
export const updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethod, cardDetails } = req.body;

    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    subscription.paymentMethod = paymentMethod;
    if (cardDetails) {
      subscription.paymentDetails = {
        last4: cardDetails.last4,
        brand: cardDetails.brand,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      };
    }

    await subscription.save();

    res.json({
      success: true,
      message: "Payment method updated successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Update payment method error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment method",
    });
  }
};

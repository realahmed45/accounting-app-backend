import Subscription from "../models/Subscription.js";

/**
 * Middleware to check if user has an active subscription
 */
export const requireSubscription = async (req, res, next) => {
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

    // Check if subscription is active
    if (!subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message:
          "Your subscription is not active. Please update your payment method.",
        code: "SUBSCRIPTION_INACTIVE",
      });
    }

    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Check subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify subscription",
    });
  }
};

/**
 * Middleware to check if user's plan has a specific feature
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        let subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription) {
          subscription = await Subscription.create({
            userId: req.user.id,
            currentPlan: "free",
            status: "active",
          });
        }
        req.subscription = subscription;
      }

      if (!req.subscription.hasFeature(featureName)) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a higher plan. Please upgrade your subscription.`,
          code: "FEATURE_NOT_AVAILABLE",
          requiredFeature: featureName,
          currentPlan: req.subscription.currentPlan,
        });
      }

      next();
    } catch (error) {
      console.error("Check feature error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify feature access",
      });
    }
  };
};

/**
 * Middleware to check usage limits
 */
export const checkLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        let subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription) {
          subscription = await Subscription.create({
            userId: req.user.id,
            currentPlan: "free",
            status: "active",
          });
        }
        req.subscription = subscription;
      }

      const limitCheck = req.subscription.checkLimit(limitType);

      if (limitCheck.isExceeded) {
        return res.status(403).json({
          success: false,
          message: `You have reached your ${limitType} limit for this billing period. Please upgrade your plan.`,
          code: "LIMIT_EXCEEDED",
          limitType,
          current: limitCheck.current,
          limit: limitCheck.limit,
          currentPlan: req.subscription.currentPlan,
        });
      }

      next();
    } catch (error) {
      console.error("Check limit error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify usage limits",
      });
    }
  };
};

/**
 * Middleware to check plan level
 */
export const requirePlan = (minimumPlan) => {
  const planHierarchy = {
    free: 0,
    professional: 1,
    business: 2,
    enterprise: 3,
  };

  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        let subscription = await Subscription.findOne({ userId: req.user.id });
        if (!subscription) {
          subscription = await Subscription.create({
            userId: req.user.id,
            currentPlan: "free",
            status: "active",
          });
        }
        req.subscription = subscription;
      }

      const userPlanLevel = planHierarchy[req.subscription.currentPlan];
      const requiredPlanLevel = planHierarchy[minimumPlan];

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires the ${minimumPlan} plan or higher.`,
          code: "PLAN_UPGRADE_REQUIRED",
          currentPlan: req.subscription.currentPlan,
          requiredPlan: minimumPlan,
        });
      }

      next();
    } catch (error) {
      console.error("Check plan error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify plan level",
      });
    }
  };
};

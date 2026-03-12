import Subscription from "../models/Subscription.js";

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Clean up old entries from rate limit store
 */
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
};

// Cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Generic rate limiter middleware
 * @param {string} limitType - Type of limit to check (e.g., 'api', 'export')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimit = (limitType, maxRequests, windowMs) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const key = `${limitType}:${userId}`;

      const now = Date.now();
      let userLimit = rateLimitStore.get(key);

      // Initialize or reset if window expired
      if (!userLimit || now > userLimit.resetTime) {
        userLimit = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(key, userLimit);
      }

      // Increment count
      userLimit.count++;

      // Check if limit exceeded
      if (userLimit.count > maxRequests) {
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded",
          retryAfter,
          limit: maxRequests,
          windowMs,
        });
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - userLimit.count);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(userLimit.resetTime).toISOString(),
      );

      next();
    } catch (error) {
      console.error("Rate limit error:", error);
      next(); // Allow request to proceed on error
    }
  };
};

/**
 * Plan-based rate limiter
 * Different limits based on subscription plan
 */
export const planBasedRateLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user's subscription
      let subscription = await Subscription.findOne({ userId }).select(
        "currentPlan",
      );

      if (!subscription) {
        // Create free subscription if none exists
        subscription = await Subscription.create({
          userId,
          currentPlan: "free",
        });
      }

      // Define limits per plan
      const limits = {
        api: {
          free: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
          professional: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
          business: { maxRequests: 5000, windowMs: 60 * 60 * 1000 }, // 5000/hour
          enterprise: { maxRequests: 20000, windowMs: 60 * 60 * 1000 }, // 20000/hour
        },
        export: {
          free: { maxRequests: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5/day
          professional: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50/day
          business: { maxRequests: 200, windowMs: 24 * 60 * 60 * 1000 }, // 200/day
          enterprise: { maxRequests: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000/day
        },
        search: {
          free: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
          professional: { maxRequests: 500, windowMs: 60 * 60 * 1000 }, // 500/hour
          business: { maxRequests: 2000, windowMs: 60 * 60 * 1000 }, // 2000/hour
          enterprise: { maxRequests: 10000, windowMs: 60 * 60 * 1000 }, // 10000/hour
        },
      };

      const planLimits = limits[limitType]?.[subscription.currentPlan];

      if (!planLimits) {
        return next(); // No limit defined, allow request
      }

      // Apply rate limit
      const key = `${limitType}:${userId}`;
      const now = Date.now();
      let userLimit = rateLimitStore.get(key);

      if (!userLimit || now > userLimit.resetTime) {
        userLimit = {
          count: 0,
          resetTime: now + planLimits.windowMs,
        };
        rateLimitStore.set(key, userLimit);
      }

      userLimit.count++;

      if (userLimit.count > planLimits.maxRequests) {
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded for ${subscription.currentPlan} plan`,
          retryAfter,
          limit: planLimits.maxRequests,
          currentPlan: subscription.currentPlan,
          upgradeMessage:
            "Upgrade your plan for higher limits at /api/subscription/plans",
        });
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", planLimits.maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        planLimits.maxRequests - userLimit.count,
      );
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(userLimit.resetTime).toISOString(),
      );
      res.setHeader("X-RateLimit-Plan", subscription.currentPlan);

      next();
    } catch (error) {
      console.error("Plan-based rate limit error:", error);
      next(); // Allow request to proceed on error
    }
  };
};

/**
 * API access rate limiter (per subscription plan)
 */
export const apiRateLimit = planBasedRateLimit("api");

/**
 * Export rate limiter (per subscription plan)
 */
export const exportRateLimit = planBasedRateLimit("export");

/**
 * Search rate limiter (per subscription plan)
 */
export const searchRateLimit = planBasedRateLimit("search");

/**
 * General rate limiter for auth endpoints
 */
export const authRateLimit = rateLimit("auth", 5, 15 * 60 * 1000); // 5 requests per 15 minutes

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimit = rateLimit("strict", 10, 60 * 60 * 1000); // 10 requests per hour

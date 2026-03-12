import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentPlan: {
      type: String,
      enum: ["free", "professional", "business", "enterprise"],
      default: "free",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "past_due", "trialing", "expired"],
      default: "active",
    },
    // Dummy payment fields (will be replaced with real Stripe later)
    paymentMethod: {
      type: String,
      default: "none", // 'none', 'card', 'paypal'
    },
    paymentDetails: {
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
    // Billing cycle
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    // Subscription dates
    startDate: {
      type: Date,
      default: Date.now,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    // Usage tracking
    usage: {
      expensesThisMonth: {
        type: Number,
        default: 0,
      },
      accountsCount: {
        type: Number,
        default: 0,
      },
      teamMembersCount: {
        type: Number,
        default: 0,
      },
      storageUsedMB: {
        type: Number,
        default: 0,
      },
      apiCallsThisMonth: {
        type: Number,
        default: 0,
      },
    },
    // Pricing
    amount: {
      type: Number,
      default: 0, // in cents
    },
    currency: {
      type: String,
      default: "usd",
    },
    // Dummy Stripe IDs (will be real later)
    stripeCustomerId: {
      type: String,
      default: "dummy_cus_" + Date.now(),
    },
    stripeSubscriptionId: {
      type: String,
      default: "dummy_sub_" + Date.now(),
    },
    // Features enabled
    featuresEnabled: {
      advancedReports: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      sso: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      advancedPermissions: { type: Boolean, default: false },
      multiCurrency: { type: Boolean, default: false },
      bulkOperations: { type: Boolean, default: false },
      scheduledReports: { type: Boolean, default: false },
    },
    // Metadata
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate current period end based on billing cycle
subscriptionSchema.pre("save", function (next) {
  if (this.isNew && !this.currentPeriodEnd) {
    const now = new Date();
    if (this.billingCycle === "yearly") {
      this.currentPeriodEnd = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      this.currentPeriodEnd = new Date(now.setMonth(now.getMonth() + 1));
    }
  }
  next();
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" || this.status === "trialing";
};

// Method to check if feature is enabled
subscriptionSchema.methods.hasFeature = function (featureName) {
  return this.featuresEnabled[featureName] === true;
};

// Method to check usage limits
subscriptionSchema.methods.checkLimit = function (limitType) {
  const planLimits = getPlanLimits(this.currentPlan);
  const currentUsage = this.usage[limitType] || 0;
  const limit = planLimits[limitType];

  return {
    current: currentUsage,
    limit: limit,
    remaining: limit === -1 ? -1 : limit - currentUsage,
    isExceeded: limit !== -1 && currentUsage >= limit,
  };
};

// Method to increment usage
subscriptionSchema.methods.incrementUsage = async function (
  usageType,
  amount = 1,
) {
  if (this.usage[usageType] !== undefined) {
    this.usage[usageType] += amount;
    await this.save();
  }
};

// Static method to get plan limits
function getPlanLimits(plan) {
  const limits = {
    free: {
      expensesThisMonth: 50,
      accountsCount: 1,
      teamMembersCount: 0,
      storageUsedMB: 50,
      apiCallsThisMonth: 0,
    },
    professional: {
      expensesThisMonth: -1, // unlimited
      accountsCount: 5,
      teamMembersCount: 3,
      storageUsedMB: 500,
      apiCallsThisMonth: 1000,
    },
    business: {
      expensesThisMonth: -1,
      accountsCount: 20,
      teamMembersCount: -1, // unlimited
      storageUsedMB: 2048,
      apiCallsThisMonth: 10000,
    },
    enterprise: {
      expensesThisMonth: -1,
      accountsCount: -1,
      teamMembersCount: -1,
      storageUsedMB: -1,
      apiCallsThisMonth: -1,
    },
  };
  return limits[plan] || limits.free;
}

// Static method to get plan features
subscriptionSchema.statics.getPlanFeatures = function (plan) {
  const features = {
    free: {
      advancedReports: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false,
      sso: false,
      customBranding: false,
      advancedPermissions: false,
      multiCurrency: false,
      bulkOperations: false,
      scheduledReports: false,
    },
    professional: {
      advancedReports: true,
      apiAccess: true,
      prioritySupport: false,
      whiteLabel: false,
      sso: false,
      customBranding: true,
      advancedPermissions: false,
      multiCurrency: true,
      bulkOperations: true,
      scheduledReports: false,
    },
    business: {
      advancedReports: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: false,
      sso: true,
      customBranding: true,
      advancedPermissions: true,
      multiCurrency: true,
      bulkOperations: true,
      scheduledReports: true,
    },
    enterprise: {
      advancedReports: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: true,
      sso: true,
      customBranding: true,
      advancedPermissions: true,
      multiCurrency: true,
      bulkOperations: true,
      scheduledReports: true,
    },
  };
  return features[plan] || features.free;
};

// Static method to get plan pricing
subscriptionSchema.statics.getPlanPricing = function (plan) {
  const pricing = {
    free: {
      monthly: 0,
      yearly: 0,
    },
    professional: {
      monthly: 1200, // $12.00
      yearly: 12000, // $120.00 (save 17%)
    },
    business: {
      monthly: 2900, // $29.00
      yearly: 29000, // $290.00 (save 17%)
    },
    enterprise: {
      monthly: 7900, // $79.00
      yearly: 79000, // $790.00 (contact for custom)
    },
  };
  return pricing[plan] || pricing.free;
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

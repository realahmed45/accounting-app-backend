import AccountMember from "../models/AccountMember.js";

/**
 * Check if user has specific permission in account
 */
export const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;

      // Get user's membership
      const membership = await AccountMember.findOne({ userId, accountId });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this account",
        });
      }

      // Check if user has permission
      if (!membership.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${permission}`,
          requiredPermission: permission,
          yourRole: membership.role,
        });
      }

      // Attach membership to request
      req.membership = membership;

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;

      // Get user's membership
      const membership = await AccountMember.findOne({ userId, accountId });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this account",
        });
      }

      // Check if user has one of the required roles
      if (!roles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(" or ")}`,
          yourRole: membership.role,
          requiredRoles: roles,
        });
      }

      // Attach membership to request
      req.membership = membership;

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};

/**
 * Require owner or admin role
 */
export const requireOwnerOrAdmin = hasRole("owner", "admin");

/**
 * Require owner role only
 */
export const requireOwner = hasRole("owner");

/**
 * Check if user can manage members (owner or admin with permission)
 */
export const canManageMembers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;

    const membership = await AccountMember.findOne({ userId, accountId });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this account",
      });
    }

    const canManage =
      membership.role === "owner" ||
      (membership.role === "admin" &&
        membership.permissions.includes("manage_members"));

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to manage members",
      });
    }

    req.membership = membership;
    next();
  } catch (error) {
    console.error("Manage members check error:", error);
    res.status(500).json({
      success: false,
      message: "Permission check failed",
    });
  }
};

/**
 * Check if user can modify specific resource (creator or admin/owner)
 */
export const canModifyResource = (
  resourceModel,
  resourceIdParam = "resourceId",
) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;
      const resourceId = req.params[resourceIdParam];

      // Get the resource
      const Model = resourceModel;
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      // Check if resource belongs to the account
      if (resource.accountId.toString() !== accountId) {
        return res.status(403).json({
          success: false,
          message: "Resource does not belong to this account",
        });
      }

      // Get user's membership
      const membership = await AccountMember.findOne({ userId, accountId });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this account",
        });
      }

      // Check if user is creator or has admin/owner role
      const isCreator = resource.createdBy?.toString() === userId;
      const isAdminOrOwner = ["owner", "admin"].includes(membership.role);

      if (!isCreator && !isAdminOrOwner) {
        return res.status(403).json({
          success: false,
          message: "You can only modify resources you created",
        });
      }

      req.membership = membership;
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Resource modification check error:", error);
      res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Standard permission types
 */
export const PERMISSIONS = {
  VIEW_EXPENSES: "view_expenses",
  ADD_EXPENSES: "add_expenses",
  EDIT_EXPENSES: "edit_expenses",
  DELETE_EXPENSES: "delete_expenses",
  VIEW_SCHEDULE: "view_schedule",
  EDIT_SCHEDULE: "edit_schedule",
  MANAGE_MEMBERS: "manage_members",
  VIEW_REPORTS: "view_reports",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_BUDGET: "manage_budget",
  EXPORT_DATA: "export_data",
};

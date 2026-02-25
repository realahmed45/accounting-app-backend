import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AccountMember from "../models/AccountMember.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "accounting_app_production_secret_key_2026_secure_token_xyz123",
      );

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET ||
      "accounting_app_production_secret_key_2026_secure_token_xyz123",
    {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    },
  );
};

// Permission middleware factory
// Usage: requirePermission("makeExpense") — checks AccountMember record for req.params.id
// Owner role always passes. Sets req.member for downstream use.
export const requirePermission = (permKey) => async (req, res, next) => {
  try {
    const member = await AccountMember.findOne({
      accountId: req.params.id,
      userId: req.user.id,
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this account",
      });
    }

    if (member.role === "owner" || member.permissions[permKey]) {
      req.member = member;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You don't have the '${permKey}' permission`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error checking permissions",
    });
  }
};

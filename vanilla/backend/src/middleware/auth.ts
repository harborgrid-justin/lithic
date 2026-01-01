import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendUnauthorized, sendForbidden } from "../utils/response";
import { auditLogger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  permissions?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

/**
 * Verify JWT token and authenticate user
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      sendUnauthorized(res, "No authentication token provided");
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & {
      sessionId: string;
    };

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
      permissions: decoded.permissions,
    };
    req.sessionId = decoded.sessionId;

    // Audit log
    auditLogger.info("User authenticated", {
      userId: decoded.id,
      email: decoded.email,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      endpoint: req.originalUrl,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Token has expired");
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, "Invalid token");
      return;
    }

    sendUnauthorized(res, "Authentication failed");
  }
};

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      auditLogger.warn("Unauthorized access attempt", {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
        ip: req.ip,
      });

      sendForbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      auditLogger.warn("Permission denied", {
        userId: req.user.id,
        userPermissions,
        requiredPermissions,
        endpoint: req.originalUrl,
        ip: req.ip,
      });

      sendForbidden(res, "You do not have the required permissions");
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & {
        sessionId: string;
      };
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId,
        permissions: decoded.permissions,
      };
      req.sessionId = decoded.sessionId;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (
  user: AuthUser,
  sessionId: string,
  expiresIn: string = process.env.JWT_EXPIRES_IN || "24h",
): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: user.permissions,
      sessionId,
    },
    JWT_SECRET,
    { expiresIn },
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
  userId: string,
  sessionId: string,
): string => {
  return jwt.sign({ userId, sessionId, type: "refresh" }, JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string,
): { userId: string; sessionId: string } => {
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }

  return {
    userId: decoded.userId,
    sessionId: decoded.sessionId,
  };
};

const authMiddleware = {
  authenticate,
  authorize,
  requirePermission,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
};

export default authMiddleware;

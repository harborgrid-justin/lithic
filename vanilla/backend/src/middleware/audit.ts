import { Request, Response, NextFunction } from "express";
import { auditLogger } from "../utils/logger";
import { AuthRequest } from "./auth";
import { maskSensitiveData } from "../utils/crypto";

interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  email?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  endpoint: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  changes?: any;
  metadata?: any;
}

/**
 * HIPAA Audit Logging Middleware
 * Logs all access to protected health information (PHI)
 */
export const auditLog = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Override res.end to capture response
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    const duration = Date.now() - startTime;

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      email: req.user?.email,
      action: getActionFromMethod(req.method),
      resource: getResourceFromPath(req.path),
      resourceId: req.params?.id,
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      statusCode: res.statusCode,
      metadata: {
        duration,
        requestId: (req as any).id,
      },
    };

    // Log based on status code and resource type
    if (shouldAudit(req.path, req.method)) {
      if (res.statusCode >= 400) {
        auditLogger.warn("Failed operation", auditEntry);
      } else {
        auditLogger.info("Successful operation", auditEntry);
      }
    }

    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };

  // Override res.json to capture data changes
  res.json = function (data: any): any {
    // Log data modifications for PHI
    if (isDataModification(req.method) && shouldAudit(req.path, req.method)) {
      const sanitizedBody = sanitizeBody(req.body);

      auditLogger.info("Data modification", {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        action: getActionFromMethod(req.method),
        resource: getResourceFromPath(req.path),
        resourceId: req.params?.id,
        changes: sanitizedBody,
        endpoint: req.originalUrl,
        ip: req.ip,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Determine if request should be audited
 */
const shouldAudit = (path: string, method: string): boolean => {
  // Audit all PHI-related endpoints
  const phiPatterns = [
    /\/patients/,
    /\/appointments/,
    /\/medical-records/,
    /\/prescriptions/,
    /\/lab-results/,
    /\/billing/,
    /\/insurance/,
  ];

  // Audit all authenticated endpoints
  const authPatterns = [
    /\/auth\/login/,
    /\/auth\/logout/,
    /\/auth\/register/,
    /\/auth\/password/,
  ];

  // Check if path matches PHI or auth patterns
  const isPHI = phiPatterns.some((pattern) => pattern.test(path));
  const isAuth = authPatterns.some((pattern) => pattern.test(path));

  return isPHI || isAuth;
};

/**
 * Check if request is a data modification
 */
const isDataModification = (method: string): boolean => {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
};

/**
 * Get action from HTTP method
 */
const getActionFromMethod = (method: string): string => {
  const actions: Record<string, string> = {
    GET: "VIEW",
    POST: "CREATE",
    PUT: "UPDATE",
    PATCH: "UPDATE",
    DELETE: "DELETE",
  };

  return actions[method] || "UNKNOWN";
};

/**
 * Extract resource from path
 */
const getResourceFromPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[0] || "unknown";
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "ssn",
    "creditCard",
    "cvv",
    "pin",
    "token",
    "secret",
  ];

  // Recursively sanitize
  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeBody(sanitized[key]);
    } else if (
      typeof sanitized[key] === "string" &&
      sanitized[key].length > 100
    ) {
      // Mask long strings that might contain PHI
      sanitized[key] = maskSensitiveData(sanitized[key]);
    }
  });

  return sanitized;
};

/**
 * Log successful authentication
 */
export const logAuthSuccess = (
  userId: string,
  email: string,
  req: Request,
): void => {
  auditLogger.info("Authentication successful", {
    timestamp: new Date().toISOString(),
    userId,
    email,
    action: "LOGIN",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

/**
 * Log failed authentication
 */
export const logAuthFailure = (
  email: string,
  reason: string,
  req: Request,
): void => {
  auditLogger.warn("Authentication failed", {
    timestamp: new Date().toISOString(),
    email: maskSensitiveData(email, 3),
    action: "LOGIN_FAILED",
    reason,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

/**
 * Log PHI access
 */
export const logPhiAccess = (
  userId: string,
  patientId: string,
  dataType: string,
  action: string,
  req: Request,
): void => {
  auditLogger.info("PHI accessed", {
    timestamp: new Date().toISOString(),
    userId,
    patientId,
    dataType,
    action,
    endpoint: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

/**
 * Log security event
 */
export const logSecurityEvent = (
  eventType: string,
  severity: "info" | "warn" | "error",
  details: any,
  req: Request,
): void => {
  auditLogger[severity]("Security event", {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    details,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

const auditMiddleware = {
  auditLog,
  logAuthSuccess,
  logAuthFailure,
  logPhiAccess,
  logSecurityEvent,
};

export default auditMiddleware;

import { prisma } from "./db";
import type { AuditAction } from "@prisma/client";

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  organizationId?: string;
  isPHIAccess?: boolean;
  phiType?: string;
}

/**
 * Create an audit log entry
 */
export async function logAudit(data: AuditLogData) {
  try {
    // Get user information if userId is provided
    let userName: string | undefined;
    let userEmail: string | undefined;
    let orgId = data.organizationId;

    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          name: true,
          email: true,
          organizationId: true,
        },
      });

      if (user) {
        userName = user.name || undefined;
        userEmail = user.email;
        orgId = orgId || user.organizationId;
      }
    }

    // Calculate retention period (HIPAA requires 6 years minimum)
    const retainUntil = new Date();
    retainUntil.setFullYear(retainUntil.getFullYear() + 7); // 7 years to be safe

    // Create audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName,
        userEmail,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        metadata: data.metadata || {},
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        organizationId: orgId!,
        isPHIAccess: data.isPHIAccess || false,
        phiType: data.phiType,
        hipaaCompliant: true,
        retainUntil,
      },
    });

    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
    // But log it for monitoring
    return null;
  }
}

/**
 * Log PHI access (Protected Health Information)
 */
export async function logPHIAccess({
  userId,
  resource,
  resourceId,
  phiType,
  action = "PHI_ACCESSED",
  description,
  metadata,
  ipAddress,
  userAgent,
  organizationId,
}: {
  userId: string;
  resource: string;
  resourceId: string;
  phiType: string;
  action?: AuditAction;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
}) {
  return logAudit({
    userId,
    action,
    resource,
    resourceId,
    description,
    metadata,
    ipAddress,
    userAgent,
    organizationId,
    isPHIAccess: true,
    phiType,
  });
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs({
  organizationId,
  userId,
  resource,
  action,
  isPHIAccess,
  startDate,
  endDate,
  page = 1,
  limit = 50,
}: {
  organizationId?: string;
  userId?: string;
  resource?: string;
  action?: AuditAction;
  isPHIAccess?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (organizationId) where.organizationId = organizationId;
  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action;
  if (isPHIAccess !== undefined) where.isPHIAccess = isPHIAccess;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditStats({
  organizationId,
  startDate,
  endDate,
}: {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = { organizationId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [totalLogs, phiAccessCount, uniqueUsers, actionCounts, resourceCounts] =
    await Promise.all([
      // Total audit logs
      prisma.auditLog.count({ where }),

      // PHI access count
      prisma.auditLog.count({
        where: { ...where, isPHIAccess: true },
      }),

      // Unique users
      prisma.auditLog.findMany({
        where,
        select: { userId: true },
        distinct: ["userId"],
      }),

      // Action counts
      prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),

      // Resource counts
      prisma.auditLog.groupBy({
        by: ["resource"],
        where,
        _count: true,
        orderBy: { _count: { resource: "desc" } },
        take: 10,
      }),
    ]);

  return {
    totalLogs,
    phiAccessCount,
    uniqueUsersCount: uniqueUsers.length,
    topActions: actionCounts.map((item) => ({
      action: item.action,
      count: item._count,
    })),
    topResources: resourceCounts.map((item) => ({
      resource: item.resource,
      count: item._count,
    })),
  };
}

/**
 * Export audit logs for compliance reporting
 */
export async function exportAuditLogs({
  organizationId,
  startDate,
  endDate,
  format = "json",
}: {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  format?: "json" | "csv";
}) {
  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: "asc" },
  });

  if (format === "csv") {
    // Convert to CSV format
    const headers = [
      "Timestamp",
      "User ID",
      "User Name",
      "User Email",
      "Action",
      "Resource",
      "Resource ID",
      "Description",
      "IP Address",
      "PHI Access",
      "PHI Type",
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.userId || "",
      log.userName || "",
      log.userEmail || "",
      log.action,
      log.resource,
      log.resourceId || "",
      log.description,
      log.ipAddress || "",
      log.isPHIAccess ? "Yes" : "No",
      log.phiType || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return csv;
  }

  // Return JSON format
  return JSON.stringify(logs, null, 2);
}

/**
 * Track data changes for audit purposes
 */
export function trackChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>,
): {
  before: Record<string, any>;
  after: Record<string, any>;
  fields: string[];
} {
  const changes: {
    before: Record<string, any>;
    after: Record<string, any>;
    fields: string[];
  } = {
    before: {},
    after: {},
    fields: [],
  };

  // Compare all fields
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    // Skip sensitive fields
    if (
      key === "password" ||
      key === "mfaSecret" ||
      key === "mfaBackupCodes" ||
      key === "updatedAt"
    ) {
      continue;
    }

    const oldValue = oldData[key];
    const newValue = newData[key];

    // Check if value changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.before[key] = oldValue;
      changes.after[key] = newValue;
      changes.fields.push(key);
    }
  }

  return changes;
}

/**
 * Clean up old audit logs (respecting retention period)
 */
export async function cleanupAuditLogs() {
  const result = await prisma.auditLog.deleteMany({
    where: {
      retainUntil: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get recent security events
 */
export async function getSecurityEvents({
  organizationId,
  severity,
  resolved,
  limit = 50,
}: {
  organizationId?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resolved?: boolean;
  limit?: number;
}) {
  const where: any = {};

  if (organizationId) where.organizationId = organizationId;
  if (severity) where.severity = severity;
  if (resolved !== undefined) where.resolved = resolved;

  return await prisma.securityEvent.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

/**
 * Create a security event
 */
export async function createSecurityEvent({
  type,
  severity,
  userId,
  organizationId,
  ipAddress,
  userAgent,
  description,
  metadata,
}: {
  type: any; // SecurityEventType
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  metadata?: any;
}) {
  return await prisma.securityEvent.create({
    data: {
      type,
      severity,
      userId,
      organizationId,
      ipAddress,
      userAgent,
      description,
      metadata: metadata || {},
    },
  });
}

/**
 * Resolve a security event
 */
export async function resolveSecurityEvent({
  id,
  resolvedBy,
  resolution,
}: {
  id: string;
  resolvedBy: string;
  resolution: string;
}) {
  return await prisma.securityEvent.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      resolution,
    },
  });
}

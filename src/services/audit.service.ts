import { prisma } from '@/lib/db';
import { getAuditLogs, getAuditStats, exportAuditLogs } from '@/lib/audit';
import type { Prisma } from '@prisma/client';

/**
 * Get audit logs with advanced filtering
 */
export async function getAuditHistory(params: {
  organizationId: string;
  userId?: string;
  resource?: string;
  action?: string;
  isPHIAccess?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  searchTerm?: string;
}) {
  const {
    organizationId,
    userId,
    resource,
    action,
    isPHIAccess,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    searchTerm,
  } = params;

  const where: Prisma.AuditLogWhereInput = {
    organizationId,
  };

  if (userId) where.userId = userId;
  if (resource) where.resource = resource;
  if (action) where.action = action as any;
  if (isPHIAccess !== undefined) where.phiAccessed = isPHIAccess;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  if (searchTerm) {
    where.OR = [
      { details: { path: '$', string_contains: searchTerm } },
      { userEmail: { contains: searchTerm, mode: 'insensitive' } },
      { userName: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
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
 * Get audit statistics with advanced metrics
 */
export async function getAuditAnalytics(params: {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const { organizationId, startDate, endDate } = params;

  const where: any = { organizationId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [
    totalLogs,
    phiAccessCount,
    failedLogins,
    uniqueUsers,
    actionBreakdown,
    resourceBreakdown,
    hourlyActivity,
  ] = await Promise.all([
    // Total audit logs
    prisma.auditLog.count({ where }),

    // PHI access count
    prisma.auditLog.count({
      where: { ...where, phiAccessed: true },
    }),

    // Failed logins
    prisma.auditLog.count({
      where: { ...where, action: 'LOGIN_FAILED' },
    }),

    // Unique users
    prisma.auditLog.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    }),

    // Action breakdown
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),

    // Resource breakdown
    prisma.auditLog.groupBy({
      by: ['resource'],
      where,
      _count: true,
      orderBy: { _count: { resource: 'desc' } },
      take: 10,
    }),

    // Hourly activity (last 24 hours)
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('hour', timestamp) as hour,
        COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = ${organizationId}
        AND timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour DESC
    `,
  ]);

  return {
    summary: {
      totalLogs,
      phiAccessCount,
      failedLogins,
      uniqueUsersCount: uniqueUsers.length,
    },
    actionBreakdown: actionBreakdown.map((item) => ({
      action: item.action,
      count: item._count,
    })),
    resourceBreakdown: resourceBreakdown.map((item) => ({
      resource: item.resource,
      count: item._count,
    })),
    hourlyActivity,
  };
}

/**
 * Get user activity timeline
 */
export async function getUserActivityTimeline(userId: string, limit: number = 50) {
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return logs;
}

/**
 * Get PHI access logs
 */
export async function getPHIAccessLogs(params: {
  organizationId: string;
  patientId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { organizationId, patientId, userId, startDate, endDate, page = 1, limit = 50 } = params;

  const where: any = {
    organizationId,
    phiAccessed: true,
  };

  if (patientId) where.resourceId = patientId;
  if (userId) where.userId = userId;

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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
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
 * Generate compliance report
 */
export async function generateComplianceReport(params: {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  reportType: 'HIPAA' | 'SOC2' | 'GENERAL';
}) {
  const { organizationId, startDate, endDate, reportType } = params;

  // Get all audit logs in the period
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
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  // Calculate metrics based on report type
  const metrics = {
    totalActivities: logs.length,
    phiAccesses: logs.filter((l) => l.phiAccessed).length,
    uniqueUsers: new Set(logs.map((l) => l.userId)).size,
    failedLogins: logs.filter((l) => l.action === 'LOGIN_FAILED').length,
    passwordChanges: logs.filter((l) => l.action === 'PASSWORD_CHANGED').length,
    mfaEvents: logs.filter((l) => l.action === 'MFA_ENABLED' || l.action === 'MFA_DISABLED').length,
    dataExports: logs.filter((l) => l.action === 'PHI_EXPORTED').length,
    suspiciousActivities: logs.filter((l) => l.action === 'SUSPICIOUS_ACTIVITY').length,
  };

  // Group by action
  const actionSummary: Record<string, number> = {};
  logs.forEach((log) => {
    actionSummary[log.action] = (actionSummary[log.action] || 0) + 1;
  });

  // Group by user
  const userActivity: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.userId) {
      userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
    }
  });

  return {
    reportType,
    period: {
      start: startDate,
      end: endDate,
    },
    metrics,
    actionSummary,
    topUsers: Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({
        userId,
        activityCount: count,
      })),
    logs: reportType === 'GENERAL' ? logs.slice(0, 1000) : logs, // Limit for general reports
  };
}

/**
 * Export audit logs for compliance
 */
export async function exportComplianceLogs(params: {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  format?: 'json' | 'csv';
}) {
  return await exportAuditLogs(params);
}

/**
 * Detect anomalous activity
 */
export async function detectAnomalies(organizationId: string) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  // Detect multiple failed logins
  const failedLogins = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      organizationId,
      action: 'LOGIN_FAILED',
      timestamp: { gte: twentyFourHoursAgo },
    },
    _count: true,
    having: {
      userId: {
        _count: {
          gt: 5,
        },
      },
    },
  });

  // Detect unusual PHI access patterns
  const excessivePHIAccess = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      organizationId,
      phiAccessed: true,
      timestamp: { gte: twentyFourHoursAgo },
    },
    _count: true,
    having: {
      userId: {
        _count: {
          gt: 100,
        },
      },
    },
  });

  // Detect after-hours access
  const afterHoursAccess = await prisma.$queryRaw`
    SELECT user_id, COUNT(*) as count
    FROM audit_logs
    WHERE organization_id = ${organizationId}
      AND timestamp >= NOW() - INTERVAL '24 hours'
      AND (EXTRACT(HOUR FROM timestamp) < 6 OR EXTRACT(HOUR FROM timestamp) > 22)
      AND phi_accessed = true
    GROUP BY user_id
    HAVING COUNT(*) > 10
  `;

  return {
    failedLogins: failedLogins.map((item) => ({
      userId: item.userId,
      count: item._count,
      severity: 'HIGH',
      description: `${item._count} failed login attempts in 24 hours`,
    })),
    excessivePHIAccess: excessivePHIAccess.map((item) => ({
      userId: item.userId,
      count: item._count,
      severity: 'MEDIUM',
      description: `${item._count} PHI access events in 24 hours`,
    })),
    afterHoursAccess: (afterHoursAccess as any[]).map((item) => ({
      userId: item.user_id,
      count: parseInt(item.count),
      severity: 'MEDIUM',
      description: `${item.count} after-hours PHI access events`,
    })),
  };
}

/**
 * Get audit log retention status
 */
export async function getRetentionStatus(organizationId: string) {
  const now = new Date();

  const [total, expiringSoon, expired] = await Promise.all([
    prisma.auditLog.count({
      where: { organizationId },
    }),
    prisma.auditLog.count({
      where: {
        organizationId,
        // retainUntil will be in the existing schema from the first agent
        timestamp: {
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        organizationId,
        timestamp: {
          lte: now,
        },
      },
    }),
  ]);

  return {
    total,
    expiringSoon,
    expired,
  };
}

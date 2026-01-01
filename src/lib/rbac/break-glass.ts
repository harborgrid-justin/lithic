/**
 * Break-the-Glass Emergency Access System
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit, logPHIAccess } from "@/lib/audit";
import {
  BreakGlassRequest,
  BreakGlassStatus,
  BreakGlassReason,
  EmergencyType,
  InitiateBreakGlassDto,
  BreakGlassAccessLog,
  NotificationChannel,
  BreakGlassReviewStatus,
  BreakGlassViolation,
  ViolationType,
  ViolationSeverity,
} from "@/types/rbac";

// ============================================================================
// Break-Glass Access Management
// ============================================================================

export class BreakGlassControl {
  /**
   * Initiate break-glass emergency access
   */
  static async initiateAccess(
    userId: string,
    data: InitiateBreakGlassDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<BreakGlassRequest> {
    // Validate patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate expiration (default: 1 hour, max: 24 hours)
    const durationMinutes = Math.min(data.duration || 60, 24 * 60);
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create break-glass request
    const request = await prisma.breakGlassRequest.create({
      data: {
        userId,
        patientId: data.patientId,
        resource: data.resource,
        action: data.action,
        reason: data.reason,
        justification: data.justification,
        emergencyType: data.emergencyType,
        expiresAt,
        status: "ACTIVE",
        accessLog: [],
        notificationsSent: [],
        organizationId: user.organizationId,
      },
    });

    // Log the break-glass initiation
    await logAudit({
      userId,
      action: "EMERGENCY_ACCESS",
      resource: "BreakGlass",
      resourceId: request.id,
      description: `Initiated break-glass access: ${data.reason}`,
      metadata: {
        patientId: data.patientId,
        resource: data.resource,
        action: data.action,
        emergencyType: data.emergencyType,
        justification: data.justification,
      },
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
      isPHIAccess: true,
    });

    // Send immediate notifications
    await this.sendNotifications(request, user, "initiated");

    // Schedule automatic review
    await this.scheduleReview(request.id);

    return request as BreakGlassRequest;
  }

  /**
   * Log break-glass access action
   */
  static async logAccess(
    requestId: string,
    resource: string,
    action: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    phiAccessed: string[],
    details: Record<string, any>,
  ): Promise<void> {
    const request = await prisma.breakGlassRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Break-glass request not found");
    }

    if (request.status !== "ACTIVE") {
      throw new Error("Break-glass access is not active");
    }

    if (new Date() > request.expiresAt) {
      throw new Error("Break-glass access has expired");
    }

    // Create access log entry
    const logEntry: BreakGlassAccessLog = {
      timestamp: new Date(),
      resource,
      action,
      resourceId,
      ipAddress,
      userAgent,
      details,
      phiAccessed,
    };

    // Update request with new log entry
    const currentLog = (request.accessLog as BreakGlassAccessLog[]) || [];
    await prisma.breakGlassRequest.update({
      where: { id: requestId },
      data: {
        accessLog: [...currentLog, logEntry],
      },
    });

    // Log PHI access
    await logPHIAccess({
      userId: request.userId,
      resource,
      resourceId,
      phiType: phiAccessed.join(","),
      description: `Break-glass PHI access: ${request.reason}`,
      metadata: {
        breakGlassId: requestId,
        emergencyType: request.emergencyType,
      },
      ipAddress,
      userAgent,
      organizationId: request.organizationId,
    });
  }

  /**
   * Revoke break-glass access
   */
  static async revokeAccess(
    requestId: string,
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    const request = await prisma.breakGlassRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Break-glass request not found");
    }

    await prisma.breakGlassRequest.update({
      where: { id: requestId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy,
      },
    });

    // Log revocation
    await logAudit({
      userId: revokedBy,
      action: "UPDATE",
      resource: "BreakGlass",
      resourceId: requestId,
      description: `Revoked break-glass access: ${reason || "No reason provided"}`,
      metadata: {
        originalUserId: request.userId,
        patientId: request.patientId,
        accessDuration: Date.now() - request.createdAt.getTime(),
      },
      organizationId: request.organizationId,
    });

    // Send notification
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (user) {
      await this.sendNotifications(
        request as BreakGlassRequest,
        user,
        "revoked",
      );
    }
  }

  /**
   * Review break-glass access
   */
  static async reviewAccess(
    requestId: string,
    reviewedBy: string,
    status: BreakGlassReviewStatus,
    findings: string,
    violations?: BreakGlassViolation[],
  ): Promise<any> {
    const request = await prisma.breakGlassRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Break-glass request not found");
    }

    const audit = await prisma.breakGlassAudit.create({
      data: {
        breakGlassRequestId: requestId,
        reviewedBy,
        reviewStatus: status,
        findings,
        violations: violations || [],
        followUpRequired:
          status === "REQUIRES_INVESTIGATION" || status === "VIOLATION",
        organizationId: request.organizationId,
      },
    });

    // Update request status
    await prisma.breakGlassRequest.update({
      where: { id: requestId },
      data: {
        status:
          status === "VIOLATION" || status === "REQUIRES_INVESTIGATION"
            ? "UNDER_REVIEW"
            : request.status,
      },
    });

    // Log review
    await logAudit({
      userId: reviewedBy,
      action: "UPDATE",
      resource: "BreakGlassAudit",
      resourceId: audit.id,
      description: `Reviewed break-glass access: ${status}`,
      metadata: {
        breakGlassRequestId: requestId,
        reviewStatus: status,
        violationCount: violations?.length || 0,
      },
      organizationId: request.organizationId,
    });

    // If violations found, escalate
    if (status === "VIOLATION" && violations && violations.length > 0) {
      await this.escalateViolations(request, violations, reviewedBy);
    }

    return audit;
  }

  /**
   * Get active break-glass requests for user
   */
  static async getActiveRequests(userId: string): Promise<BreakGlassRequest[]> {
    const requests = await prisma.breakGlassRequest.findMany({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
          },
        },
      },
    });

    return requests as BreakGlassRequest[];
  }

  /**
   * Get break-glass history
   */
  static async getHistory(filters: {
    organizationId: string;
    userId?: string;
    patientId?: string;
    status?: BreakGlassStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ requests: any[]; total: number }> {
    const where: any = {
      organizationId: filters.organizationId,
    };

    if (filters.userId) where.userId = filters.userId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [requests, total] = await Promise.all([
      prisma.breakGlassRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              mrn: true,
            },
          },
          audits: {
            select: {
              reviewStatus: true,
              reviewedAt: true,
              reviewedBy: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.breakGlassRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Get statistics
   */
  static async getStatistics(
    organizationId: string,
    days: number = 30,
  ): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalRequests,
      activeRequests,
      revokedRequests,
      violationCount,
      reviewedCount,
      topReasons,
    ] = await Promise.all([
      prisma.breakGlassRequest.count({
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.breakGlassRequest.count({
        where: {
          organizationId,
          status: "ACTIVE",
          expiresAt: { gte: new Date() },
        },
      }),
      prisma.breakGlassRequest.count({
        where: {
          organizationId,
          status: "REVOKED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.breakGlassAudit.count({
        where: {
          organizationId,
          reviewStatus: "VIOLATION",
          createdAt: { gte: startDate },
        },
      }),
      prisma.breakGlassAudit.count({
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.breakGlassRequest.groupBy({
        by: ["reason"],
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { reason: "desc" } },
        take: 5,
      }),
    ]);

    return {
      totalRequests,
      activeRequests,
      revokedRequests,
      violationCount,
      reviewedCount,
      violationRate:
        reviewedCount > 0 ? (violationCount / reviewedCount) * 100 : 0,
      topReasons: topReasons.map((r) => ({
        reason: r.reason,
        count: r._count,
      })),
    };
  }

  /**
   * Cleanup expired requests
   */
  static async cleanupExpiredRequests(): Promise<number> {
    const result = await prisma.breakGlassRequest.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return result.count;
  }

  /**
   * Send notifications for break-glass events
   */
  private static async sendNotifications(
    request: BreakGlassRequest,
    user: any,
    event: "initiated" | "revoked",
  ): Promise<void> {
    // Get notification recipients (privacy officers, security team, supervisors)
    const recipients = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        OR: [
          { role: { name: { in: ["SUPER_ADMIN", "PRIVACY_OFFICER"] } } },
          { id: user.managerId || "" },
        ],
        status: "ACTIVE",
      },
    });

    const notifications = [];

    for (const recipient of recipients) {
      // In production, send actual notifications via email, SMS, Slack, etc.
      notifications.push({
        timestamp: new Date(),
        recipient: recipient.email,
        channel: NotificationChannel.EMAIL,
        status: "SENT",
        message: `Break-glass ${event}: ${user.name} accessed patient ${request.patientId} - Reason: ${request.reason}`,
      });
    }

    // Update request with notification log
    const currentNotifications = (request.notificationsSent as any[]) || [];
    await prisma.breakGlassRequest.update({
      where: { id: request.id },
      data: {
        notificationsSent: [...currentNotifications, ...notifications],
      },
    });
  }

  /**
   * Schedule automatic review
   */
  private static async scheduleReview(requestId: string): Promise<void> {
    // In production, schedule a job to review after access expires
    // For now, just log
    await logAudit({
      action: "CREATE",
      resource: "BreakGlassReview",
      resourceId: requestId,
      description: "Scheduled automatic break-glass access review",
    });
  }

  /**
   * Escalate violations
   */
  private static async escalateViolations(
    request: any,
    violations: BreakGlassViolation[],
    reviewedBy: string,
  ): Promise<void> {
    // Get escalation recipients
    const recipients = await prisma.user.findMany({
      where: {
        organizationId: request.organizationId,
        role: {
          name: { in: ["SUPER_ADMIN", "PRIVACY_OFFICER", "SECURITY_OFFICER"] },
        },
        status: "ACTIVE",
      },
    });

    const criticalViolations = violations.filter(
      (v) => v.severity === ViolationSeverity.CRITICAL,
    );

    // Create security incident if critical violations found
    if (criticalViolations.length > 0) {
      await prisma.securityEvent.create({
        data: {
          type: "POLICY_VIOLATION",
          severity: "CRITICAL",
          description: `Critical break-glass violations detected`,
          metadata: {
            breakGlassRequestId: request.id,
            userId: request.userId,
            violations: criticalViolations,
          },
          userId: request.userId,
          organizationId: request.organizationId,
        },
      });
    }

    // Log escalation
    await logAudit({
      userId: reviewedBy,
      action: "CREATE",
      resource: "SecurityIncident",
      resourceId: request.id,
      description: `Escalated break-glass violations`,
      metadata: {
        violationCount: violations.length,
        criticalCount: criticalViolations.length,
      },
      organizationId: request.organizationId,
    });
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

export async function initiateBreakGlass(
  userId: string,
  data: InitiateBreakGlassDto,
  ipAddress?: string,
  userAgent?: string,
): Promise<BreakGlassRequest> {
  return BreakGlassControl.initiateAccess(userId, data, ipAddress, userAgent);
}

export async function logBreakGlassAccess(
  requestId: string,
  resource: string,
  action: string,
  resourceId: string,
  ipAddress: string,
  userAgent: string,
  phiAccessed: string[],
  details: Record<string, any>,
): Promise<void> {
  return BreakGlassControl.logAccess(
    requestId,
    resource,
    action,
    resourceId,
    ipAddress,
    userAgent,
    phiAccessed,
    details,
  );
}

export async function revokeBreakGlass(
  requestId: string,
  revokedBy: string,
  reason?: string,
): Promise<void> {
  return BreakGlassControl.revokeAccess(requestId, revokedBy, reason);
}

export async function reviewBreakGlass(
  requestId: string,
  reviewedBy: string,
  status: BreakGlassReviewStatus,
  findings: string,
  violations?: BreakGlassViolation[],
): Promise<any> {
  return BreakGlassControl.reviewAccess(
    requestId,
    reviewedBy,
    status,
    findings,
    violations,
  );
}

export async function getActiveBreakGlassRequests(
  userId: string,
): Promise<BreakGlassRequest[]> {
  return BreakGlassControl.getActiveRequests(userId);
}

export async function getBreakGlassHistory(filters: {
  organizationId: string;
  userId?: string;
  patientId?: string;
  status?: BreakGlassStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{ requests: any[]; total: number }> {
  return BreakGlassControl.getHistory(filters);
}

export async function getBreakGlassStatistics(
  organizationId: string,
  days?: number,
): Promise<any> {
  return BreakGlassControl.getStatistics(organizationId, days);
}

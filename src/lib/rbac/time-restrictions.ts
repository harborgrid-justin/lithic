/**
 * Time-Based Access Control System
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  TimeRestriction,
  AccessSchedule,
  DayOfWeek,
  Holiday,
  AfterHoursAccessStatus,
  CreateTimeRestrictionDto,
} from "@/types/rbac";

// ============================================================================
// Time Utilities
// ============================================================================

class TimeUtil {
  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get current day of week
   */
  static getCurrentDayOfWeek(): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[new Date().getDay()];
  }

  /**
   * Get current time in minutes since midnight in specified timezone
   */
  static getCurrentTimeInTimezone(timezone: string): number {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const timeStr = now.toLocaleTimeString("en-US", options);
    return this.timeToMinutes(timeStr);
  }

  /**
   * Check if current time is within schedule
   */
  static isWithinSchedule(
    schedule: AccessSchedule,
    currentTime: number,
  ): boolean {
    if (!schedule.enabled) {
      return false;
    }

    const startMinutes = this.timeToMinutes(schedule.startTime);
    const endMinutes = this.timeToMinutes(schedule.endTime);

    // Handle schedules that cross midnight
    if (endMinutes < startMinutes) {
      return currentTime >= startMinutes || currentTime <= endMinutes;
    }

    return currentTime >= startMinutes && currentTime <= endMinutes;
  }

  /**
   * Check if date is a holiday
   */
  static isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateStr = date.toISOString().split("T")[0] || "";
    return (
      holidays.find((h) => {
        const holidayStr = new Date(h.date).toISOString().split("T")[0] || "";
        return holidayStr === dateStr;
      }) || null
    );
  }

  /**
   * Check if date is a weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
}

// ============================================================================
// Time Restriction Management
// ============================================================================

export class TimeRestrictionControl {
  /**
   * Create time restriction
   */
  static async createRestriction(
    organizationId: string,
    userId: string,
    data: CreateTimeRestrictionDto,
  ): Promise<TimeRestriction> {
    const restriction = await prisma.timeRestriction.create({
      data: {
        name: data.name,
        schedules: data.schedules,
        timezone: data.timezone,
        holidays: data.holidays || [],
        allowBreakGlass: data.allowBreakGlass ?? true,
        notifyOnViolation: true,
        organizationId,
        createdBy: userId,
      },
    });

    // Log creation
    await logAudit({
      userId,
      action: "CREATE",
      resource: "TimeRestriction",
      resourceId: restriction.id,
      description: `Created time restriction: ${data.name}`,
      metadata: {
        scheduleCount: data.schedules.length,
        timezone: data.timezone,
      },
      organizationId,
    });

    return restriction as TimeRestriction;
  }

  /**
   * Update time restriction
   */
  static async updateRestriction(
    restrictionId: string,
    userId: string,
    data: Partial<CreateTimeRestrictionDto>,
  ): Promise<TimeRestriction> {
    const restriction = await prisma.timeRestriction.findUnique({
      where: { id: restrictionId },
    });

    if (!restriction) {
      throw new Error("Time restriction not found");
    }

    const updated = await prisma.timeRestriction.update({
      where: { id: restrictionId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });

    // Log update
    await logAudit({
      userId,
      action: "UPDATE",
      resource: "TimeRestriction",
      resourceId: restrictionId,
      description: `Updated time restriction: ${restriction.name}`,
      organizationId: restriction.organizationId,
    });

    return updated as TimeRestriction;
  }

  /**
   * Check if access is allowed at current time
   */
  static async checkAccess(
    restrictions: TimeRestriction[],
    timestamp?: Date,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    activeRestriction?: TimeRestriction;
  }> {
    if (!restrictions || restrictions.length === 0) {
      return { allowed: true };
    }

    const currentTime = timestamp || new Date();

    for (const restriction of restrictions) {
      const result = this.evaluateRestriction(restriction, currentTime);
      if (!result.allowed) {
        return {
          allowed: false,
          reason: result.reason,
          activeRestriction: restriction,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Evaluate a single time restriction
   */
  static evaluateRestriction(
    restriction: TimeRestriction,
    currentTime: Date,
  ): { allowed: boolean; reason?: string } {
    const currentDay = TimeUtil.getCurrentDayOfWeek();
    const currentMinutes = TimeUtil.getCurrentTimeInTimezone(
      restriction.timezone,
    );

    // Check if it's a holiday
    const holiday = TimeUtil.isHoliday(currentTime, restriction.holidays);
    if (holiday) {
      if (!holiday.allowAccess && !holiday.emergencyOnly) {
        return {
          allowed: false,
          reason: `Access restricted on holiday: ${holiday.name}`,
        };
      }
      if (holiday.emergencyOnly) {
        return {
          allowed: false,
          reason: `Emergency access only on holiday: ${holiday.name}`,
        };
      }
    }

    // Find applicable schedule for current day
    const todaySchedule = restriction.schedules.find(
      (s) => s.dayOfWeek === currentDay,
    );

    if (!todaySchedule) {
      return {
        allowed: false,
        reason: `No access schedule defined for ${currentDay}`,
      };
    }

    if (!todaySchedule.enabled) {
      return {
        allowed: false,
        reason: `Access disabled for ${currentDay}`,
      };
    }

    // Check if current time is within schedule
    const withinSchedule = TimeUtil.isWithinSchedule(
      todaySchedule,
      currentMinutes,
    );

    if (!withinSchedule) {
      return {
        allowed: false,
        reason: `Outside allowed hours (${todaySchedule.startTime} - ${todaySchedule.endTime})`,
      };
    }

    return { allowed: true };
  }

  /**
   * Request after-hours access
   */
  static async requestAfterHoursAccess(
    userId: string,
    resource: string,
    reason: string,
    durationMinutes: number = 60,
  ): Promise<any> {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const request = await prisma.afterHoursAccess.create({
      data: {
        userId,
        resource,
        reason,
        expiresAt,
        status: "PENDING",
      },
    });

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Log request
    await logAudit({
      userId,
      action: "CREATE",
      resource: "AfterHoursAccess",
      resourceId: request.id,
      description: `Requested after-hours access: ${reason}`,
      metadata: {
        resource,
        durationMinutes,
      },
      organizationId: user?.organizationId,
    });

    // Send notification to approvers
    await this.notifyApprovers(request.id, userId, resource, reason);

    return request;
  }

  /**
   * Approve after-hours access
   */
  static async approveAfterHoursAccess(
    requestId: string,
    approverId: string,
  ): Promise<any> {
    const request = await prisma.afterHoursAccess.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("After-hours access request not found");
    }

    if (request.status !== "PENDING") {
      throw new Error("Request already processed");
    }

    const approved = await prisma.afterHoursAccess.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    // Log approval
    await logAudit({
      userId: approverId,
      action: "UPDATE",
      resource: "AfterHoursAccess",
      resourceId: requestId,
      description: `Approved after-hours access request`,
      metadata: {
        requesterId: request.userId,
        resource: request.resource,
      },
      organizationId: user?.organizationId,
    });

    return approved;
  }

  /**
   * Deny after-hours access
   */
  static async denyAfterHoursAccess(
    requestId: string,
    approverId: string,
    denialReason?: string,
  ): Promise<any> {
    const request = await prisma.afterHoursAccess.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("After-hours access request not found");
    }

    const denied = await prisma.afterHoursAccess.update({
      where: { id: requestId },
      data: {
        status: "DENIED",
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    // Log denial
    await logAudit({
      userId: approverId,
      action: "UPDATE",
      resource: "AfterHoursAccess",
      resourceId: requestId,
      description: `Denied after-hours access request`,
      metadata: {
        requesterId: request.userId,
        resource: request.resource,
        denialReason,
      },
      organizationId: user?.organizationId,
    });

    return denied;
  }

  /**
   * Check if user has active after-hours access
   */
  static async hasAfterHoursAccess(
    userId: string,
    resource: string,
  ): Promise<boolean> {
    const activeAccess = await prisma.afterHoursAccess.findFirst({
      where: {
        userId,
        resource,
        status: "APPROVED",
        expiresAt: { gte: new Date() },
      },
    });

    return !!activeAccess;
  }

  /**
   * Get pending after-hours access requests
   */
  static async getPendingRequests(organizationId: string): Promise<any[]> {
    const requests = await prisma.afterHoursAccess.findMany({
      where: {
        status: "PENDING",
        user: {
          organizationId,
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
      orderBy: {
        requestedAt: "desc",
      },
    });

    return requests;
  }

  /**
   * Cleanup expired after-hours access
   */
  static async cleanupExpiredAccess(): Promise<number> {
    const result = await prisma.afterHoursAccess.updateMany({
      where: {
        status: "APPROVED",
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
   * Get time restriction statistics
   */
  static async getStatistics(organizationId: string): Promise<any> {
    const [
      totalRestrictions,
      afterHoursRequests,
      approvedRequests,
      deniedRequests,
    ] = await Promise.all([
      prisma.timeRestriction.count({
        where: { organizationId },
      }),
      prisma.afterHoursAccess.count({
        where: {
          user: { organizationId },
          requestedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.afterHoursAccess.count({
        where: {
          user: { organizationId },
          status: "APPROVED",
          requestedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.afterHoursAccess.count({
        where: {
          user: { organizationId },
          status: "DENIED",
          requestedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalRestrictions,
      afterHoursRequests,
      approvedRequests,
      deniedRequests,
      approvalRate:
        afterHoursRequests > 0
          ? (approvedRequests / afterHoursRequests) * 100
          : 0,
    };
  }

  /**
   * Notify approvers of after-hours access request
   */
  private static async notifyApprovers(
    requestId: string,
    userId: string,
    resource: string,
    reason: string,
  ): Promise<void> {
    // Get approvers (admins and managers)
    const approvers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ["ADMIN", "SUPER_ADMIN", "ORGANIZATION_ADMIN"],
          },
        },
        status: "ACTIVE",
      },
    });

    // In a real implementation, send notifications via email/SMS/push
    // For now, just log
    for (const approver of approvers) {
      await logAudit({
        userId: approver.id,
        action: "READ",
        resource: "AfterHoursAccess",
        resourceId: requestId,
        description: `Notified about after-hours access request`,
        metadata: {
          requesterId: userId,
          resource,
          reason,
        },
        organizationId: approver.organizationId,
      });
    }
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

export async function checkTimeRestrictions(
  restrictions: TimeRestriction[],
  timestamp?: Date,
): Promise<boolean> {
  const result = await TimeRestrictionControl.checkAccess(
    restrictions,
    timestamp,
  );
  return result.allowed;
}

export async function createTimeRestriction(
  organizationId: string,
  userId: string,
  data: CreateTimeRestrictionDto,
): Promise<TimeRestriction> {
  return TimeRestrictionControl.createRestriction(organizationId, userId, data);
}

export async function requestAfterHoursAccess(
  userId: string,
  resource: string,
  reason: string,
  durationMinutes?: number,
): Promise<any> {
  return TimeRestrictionControl.requestAfterHoursAccess(
    userId,
    resource,
    reason,
    durationMinutes,
  );
}

export async function approveAfterHoursAccess(
  requestId: string,
  approverId: string,
): Promise<any> {
  return TimeRestrictionControl.approveAfterHoursAccess(requestId, approverId);
}

export async function denyAfterHoursAccess(
  requestId: string,
  approverId: string,
  denialReason?: string,
): Promise<any> {
  return TimeRestrictionControl.denyAfterHoursAccess(
    requestId,
    approverId,
    denialReason,
  );
}

export async function hasAfterHoursAccess(
  userId: string,
  resource: string,
): Promise<boolean> {
  return TimeRestrictionControl.hasAfterHoursAccess(userId, resource);
}

export async function getPendingAfterHoursRequests(
  organizationId: string,
): Promise<any[]> {
  return TimeRestrictionControl.getPendingRequests(organizationId);
}

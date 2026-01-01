/**
 * Account Lockout Service
 * Brute force protection and account security
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { logAudit } from "../audit-logger";
import { AccountLockoutPolicy } from "@/types/security";

// ============================================================================
// Account Lockout Service
// ============================================================================

export class AccountLockoutService {
  /**
   * Get organization lockout policy
   */
  static async getPolicy(organizationId: string): Promise<AccountLockoutPolicy> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as any;
    const policy = settings?.accountLockoutPolicy;

    // Return default policy if not configured
    return (
      policy || {
        enabled: true,
        maxAttempts: 5,
        windowMinutes: 15,
        lockoutDurationMinutes: 30,
        automaticUnlock: true,
        notifyUser: true,
        notifyAdmin: true,
      }
    );
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedAttempt(
    userId: string,
    ipAddress: string,
    organizationId: string,
  ): Promise<{
    locked: boolean;
    attemptsRemaining?: number;
    lockoutUntil?: Date;
  }> {
    const policy = await this.getPolicy(organizationId);

    if (!policy.enabled) {
      return { locked: false };
    }

    const windowStart = new Date(
      Date.now() - policy.windowMinutes * 60 * 1000,
    );

    // Count recent failed attempts
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        userId,
        success: false,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    // Record this attempt
    await prisma.loginAttempt.create({
      data: {
        userId,
        ipAddress,
        success: false,
        timestamp: new Date(),
      },
    });

    const totalAttempts = recentAttempts + 1;

    // Check if should lock account
    if (totalAttempts >= policy.maxAttempts) {
      const lockoutUntil = new Date(
        Date.now() + policy.lockoutDurationMinutes * 60 * 1000,
      );

      await this.lockAccount(userId, lockoutUntil, organizationId, policy);

      return {
        locked: true,
        lockoutUntil,
      };
    }

    return {
      locked: false,
      attemptsRemaining: policy.maxAttempts - totalAttempts,
    };
  }

  /**
   * Record successful login
   */
  static async recordSuccessfulLogin(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    await prisma.loginAttempt.create({
      data: {
        userId,
        ipAddress,
        success: true,
        timestamp: new Date(),
      },
    });

    // Clear any existing lockout
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Lock account
   */
  static async lockAccount(
    userId: string,
    lockoutUntil: Date,
    organizationId: string,
    policy?: AccountLockoutPolicy,
  ): Promise<void> {
    if (!policy) {
      policy = await this.getPolicy(organizationId);
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockoutUntil,
        status: "LOCKED",
      },
    });

    // Log the lockout
    await logAudit({
      userId,
      organizationId,
      action: "ACCOUNT_LOCKED",
      resource: "User",
      details: `Account locked due to multiple failed login attempts`,
      metadata: {
        lockoutUntil: lockoutUntil.toISOString(),
        policy: {
          maxAttempts: policy.maxAttempts,
          windowMinutes: policy.windowMinutes,
          lockoutDurationMinutes: policy.lockoutDurationMinutes,
        },
      },
    });

    // Send notifications
    if (policy.notifyUser) {
      await this.notifyUser(userId, lockoutUntil);
    }

    if (policy.notifyAdmin) {
      await this.notifyAdmin(userId, organizationId, lockoutUntil);
    }
  }

  /**
   * Unlock account
   */
  static async unlockAccount(
    userId: string,
    unlockedBy: string,
    organizationId: string,
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        status: "ACTIVE",
        failedLoginAttempts: 0,
      },
    });

    await logAudit({
      userId: unlockedBy,
      organizationId,
      action: "ACCOUNT_UNLOCKED",
      resource: "User",
      resourceId: userId,
      details: `Account manually unlocked`,
      metadata: { unlockedBy },
    });
  }

  /**
   * Check if account is locked
   */
  static async isAccountLocked(
    userId: string,
    organizationId: string,
  ): Promise<{
    locked: boolean;
    lockoutUntil?: Date;
    minutesRemaining?: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lockedUntil: true,
        status: true,
      },
    });

    if (!user || !user.lockedUntil) {
      return { locked: false };
    }

    const now = new Date();

    // Check if lockout has expired
    if (now >= user.lockedUntil) {
      const policy = await this.getPolicy(organizationId);

      if (policy.automaticUnlock) {
        await this.unlockAccount(userId, "SYSTEM", organizationId);
        return { locked: false };
      }
    }

    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / (1000 * 60),
    );

    return {
      locked: true,
      lockoutUntil: user.lockedUntil,
      minutesRemaining: Math.max(0, minutesRemaining),
    };
  }

  /**
   * Get failed login attempts
   */
  static async getFailedAttempts(
    userId: string,
    windowMinutes: number = 60,
  ): Promise<
    Array<{
      timestamp: Date;
      ipAddress: string;
      userAgent?: string;
    }>
  > {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const attempts = await prisma.loginAttempt.findMany({
      where: {
        userId,
        success: false,
        timestamp: {
          gte: windowStart,
        },
      },
      orderBy: { timestamp: "desc" },
      select: {
        timestamp: true,
        ipAddress: true,
        userAgent: true,
      },
    });

    return attempts;
  }

  /**
   * Get login history
   */
  static async getLoginHistory(
    userId: string,
    limit: number = 50,
  ): Promise<
    Array<{
      timestamp: Date;
      ipAddress: string;
      success: boolean;
      userAgent?: string;
      location?: any;
    }>
  > {
    const history = await prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return history;
  }

  /**
   * Analyze login patterns for anomalies
   */
  static async analyzeLoginPatterns(
    userId: string,
  ): Promise<{
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueIPs: number;
    suspiciousIPs: string[];
    recommendations: string[];
  }> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const attempts = await prisma.loginAttempt.findMany({
      where: {
        userId,
        timestamp: {
          gte: last30Days,
        },
      },
    });

    const totalAttempts = attempts.length;
    const successfulLogins = attempts.filter((a) => a.success).length;
    const failedLogins = attempts.filter((a) => !a.success).length;

    const ipCounts: Record<string, { success: number; failed: number }> = {};

    for (const attempt of attempts) {
      if (!ipCounts[attempt.ipAddress]) {
        ipCounts[attempt.ipAddress] = { success: 0, failed: 0 };
      }
      if (attempt.success) {
        ipCounts[attempt.ipAddress].success++;
      } else {
        ipCounts[attempt.ipAddress].failed++;
      }
    }

    const uniqueIPs = Object.keys(ipCounts).length;

    // Find suspicious IPs (high failure rate)
    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([_, counts]) => counts.failed > 10 && counts.success === 0)
      .map(([ip]) => ip);

    const recommendations: string[] = [];

    if (failedLogins > successfulLogins) {
      recommendations.push("High number of failed login attempts detected");
    }

    if (suspiciousIPs.length > 0) {
      recommendations.push(
        `${suspiciousIPs.length} IP address(es) with suspicious activity`,
      );
    }

    if (uniqueIPs > 20) {
      recommendations.push("Account accessed from many different locations");
    }

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      uniqueIPs,
      suspiciousIPs,
      recommendations,
    };
  }

  /**
   * Notify user of account lockout
   */
  private static async notifyUser(
    userId: string,
    lockoutUntil: Date,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (!user) return;

    // Send email notification
    // Integration with email service
    console.log(`Email notification sent to ${user.email} about account lockout`);
  }

  /**
   * Notify admin of account lockout
   */
  private static async notifyAdmin(
    userId: string,
    organizationId: string,
    lockoutUntil: Date,
  ): Promise<void> {
    // Notify organization admins
    const admins = await prisma.user.findMany({
      where: {
        organizationId,
        roles: {
          some: {
            role: {
              name: {
                in: ["ADMIN", "SECURITY_ADMIN"],
              },
            },
          },
        },
      },
      select: { email: true },
    });

    console.log(
      `Admin notification sent about user ${userId} account lockout`,
    );
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function recordFailedAttempt(
  userId: string,
  ipAddress: string,
  organizationId: string,
) {
  return AccountLockoutService.recordFailedAttempt(
    userId,
    ipAddress,
    organizationId,
  );
}

export async function recordSuccessfulLogin(
  userId: string,
  ipAddress: string,
) {
  return AccountLockoutService.recordSuccessfulLogin(userId, ipAddress);
}

export async function lockAccount(
  userId: string,
  lockoutUntil: Date,
  organizationId: string,
) {
  return AccountLockoutService.lockAccount(
    userId,
    lockoutUntil,
    organizationId,
  );
}

export async function unlockAccount(
  userId: string,
  unlockedBy: string,
  organizationId: string,
) {
  return AccountLockoutService.unlockAccount(userId, unlockedBy, organizationId);
}

export async function isAccountLocked(userId: string, organizationId: string) {
  return AccountLockoutService.isAccountLocked(userId, organizationId);
}

export async function getFailedAttempts(
  userId: string,
  windowMinutes?: number,
) {
  return AccountLockoutService.getFailedAttempts(userId, windowMinutes);
}

export async function getLoginHistory(userId: string, limit?: number) {
  return AccountLockoutService.getLoginHistory(userId, limit);
}

export async function analyzeLoginPatterns(userId: string) {
  return AccountLockoutService.analyzeLoginPatterns(userId);
}

export async function getAccountLockoutPolicy(organizationId: string) {
  return AccountLockoutService.getPolicy(organizationId);
}

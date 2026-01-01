/**
 * Secure Session Management Service
 * Advanced session handling with device tracking and risk scoring
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import { logAudit } from "../audit-logger";
import { SessionInfo, SessionStatus, DeviceInfo } from "@/types/security";

// ============================================================================
// Session Manager
// ============================================================================

export class SessionManager {
  private static readonly ACCESS_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes
  private static readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly MAX_CONCURRENT_SESSIONS = 5;
  private static readonly SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Create new session
   */
  static async createSession(params: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo: DeviceInfo;
    location?: any;
    mfaVerified?: boolean;
  }): Promise<SessionInfo> {
    const sessionId = this.generateSessionId();
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const now = new Date();

    // Calculate risk score
    const riskScore = await this.calculateRiskScore(params);

    // Check concurrent sessions
    await this.enforceConcurrentSessionLimit(params.userId);

    const session = await prisma.session.create({
      data: {
        userId: params.userId,
        sessionId,
        accessToken,
        refreshToken,
        expiresAt: new Date(now.getTime() + this.ACCESS_TOKEN_TTL),
        refreshExpiresAt: new Date(now.getTime() + this.REFRESH_TOKEN_TTL),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        device: params.deviceInfo as any,
        location: params.location as any,
        mfaVerified: params.mfaVerified || false,
        riskScore,
        lastActivityAt: now,
        status: SessionStatus.ACTIVE,
      },
    });

    await logAudit({
      userId: params.userId,
      organizationId: "",
      sessionId,
      action: "SESSION_CREATED",
      resource: "Session",
      details: "New session created",
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceInfo: params.deviceInfo,
      metadata: {
        riskScore,
        mfaVerified: params.mfaVerified,
      },
    });

    return session as SessionInfo;
  }

  /**
   * Validate session and refresh if needed
   */
  static async validateSession(
    sessionId: string,
  ): Promise<{ valid: boolean; session?: SessionInfo; refreshed?: boolean }> {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return { valid: false };
    }

    const now = new Date();

    // Check if session is active
    if (session.status !== SessionStatus.ACTIVE) {
      return { valid: false };
    }

    // Check if refresh token expired
    if (now > session.refreshExpiresAt) {
      await this.revokeSession(sessionId, "Refresh token expired");
      return { valid: false };
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActivityAt.getTime();
    if (idleTime > this.SESSION_IDLE_TIMEOUT) {
      await this.revokeSession(sessionId, "Session idle timeout");
      return { valid: false };
    }

    // Refresh access token if needed
    let refreshed = false;
    if (now > session.expiresAt) {
      const newAccessToken = this.generateToken();
      await prisma.session.update({
        where: { sessionId },
        data: {
          accessToken: newAccessToken,
          expiresAt: new Date(now.getTime() + this.ACCESS_TOKEN_TTL),
          lastActivityAt: now,
        },
      });
      refreshed = true;
    } else {
      // Update last activity
      await prisma.session.update({
        where: { sessionId },
        data: { lastActivityAt: now },
      });
    }

    return {
      valid: true,
      session: session as SessionInfo,
      refreshed,
    };
  }

  /**
   * Revoke session
   */
  static async revokeSession(
    sessionId: string,
    reason: string,
  ): Promise<void> {
    const session = await prisma.session.update({
      where: { sessionId },
      data: {
        status: SessionStatus.REVOKED,
        logoutAt: new Date(),
        logoutReason: reason,
      },
    });

    await logAudit({
      userId: session.userId,
      organizationId: "",
      sessionId,
      action: "SESSION_REVOKED",
      resource: "Session",
      details: `Session revoked: ${reason}`,
      metadata: { reason },
    });
  }

  /**
   * Revoke all user sessions
   */
  static async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const where: any = {
      userId,
      status: SessionStatus.ACTIVE,
    };

    if (exceptSessionId) {
      where.sessionId = { not: exceptSessionId };
    }

    const result = await prisma.session.updateMany({
      where,
      data: {
        status: SessionStatus.REVOKED,
        logoutAt: new Date(),
        logoutReason: "Revoked by user",
      },
    });

    await logAudit({
      userId,
      organizationId: "",
      action: "ALL_SESSIONS_REVOKED",
      resource: "Session",
      details: `${result.count} sessions revoked`,
      metadata: { count: result.count },
    });

    return result.count;
  }

  /**
   * Get active sessions for user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      orderBy: { lastActivityAt: "desc" },
    });

    return sessions as SessionInfo[];
  }

  /**
   * Mark session as suspicious
   */
  static async markSuspicious(
    sessionId: string,
    reason: string,
  ): Promise<void> {
    await prisma.session.update({
      where: { sessionId },
      data: {
        status: SessionStatus.SUSPICIOUS,
        metadata: {
          suspiciousReason: reason,
          suspiciousAt: new Date(),
        },
      },
    });

    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (session) {
      await logAudit({
        userId: session.userId,
        organizationId: "",
        sessionId,
        action: "SESSION_SUSPICIOUS",
        resource: "Session",
        details: `Session marked suspicious: ${reason}`,
        metadata: { reason },
      });
    }
  }

  /**
   * Calculate session risk score
   */
  private static async calculateRiskScore(params: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo: DeviceInfo;
    location?: any;
  }): Promise<number> {
    let riskScore = 0;

    // Check if device is trusted
    if (!params.deviceInfo.trusted) {
      riskScore += 30;
    }

    // Check if IP is from known location
    const knownIPs = await prisma.session.findMany({
      where: {
        userId: params.userId,
        ipAddress: params.ipAddress,
        status: SessionStatus.ACTIVE,
      },
      take: 1,
    });

    if (knownIPs.length === 0) {
      riskScore += 20;
    }

    // Check for unusual location
    if (params.location) {
      const recentSessions = await prisma.session.findMany({
        where: {
          userId: params.userId,
          status: SessionStatus.ACTIVE,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const differentLocations = recentSessions.filter((s) => {
        const loc = s.location as any;
        return loc && loc.country !== params.location.country;
      });

      if (differentLocations.length > 0) {
        riskScore += 25;
      }
    }

    // Check time of access
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Enforce concurrent session limit
   */
  private static async enforceConcurrentSessionLimit(
    userId: string,
  ): Promise<void> {
    const activeSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      orderBy: { lastActivityAt: "asc" },
    });

    if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      // Revoke oldest sessions
      const sessionsToRevoke = activeSessions.slice(
        0,
        activeSessions.length - this.MAX_CONCURRENT_SESSIONS + 1,
      );

      for (const session of sessionsToRevoke) {
        await this.revokeSession(
          session.sessionId,
          "Concurrent session limit exceeded",
        );
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.updateMany({
      where: {
        refreshExpiresAt: {
          lt: new Date(),
        },
        status: SessionStatus.ACTIVE,
      },
      data: {
        status: SessionStatus.EXPIRED,
        logoutAt: new Date(),
        logoutReason: "Session expired",
      },
    });

    return result.count;
  }

  /**
   * Helper: Generate session ID
   */
  private static generateSessionId(): string {
    return `sess_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Helper: Generate token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

// Schedule cleanup job
if (typeof window === "undefined") {
  setInterval(
    () => {
      SessionManager.cleanupExpiredSessions().catch(console.error);
    },
    60 * 60 * 1000,
  ); // Every hour
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function createSession(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  location?: any;
  mfaVerified?: boolean;
}) {
  return SessionManager.createSession(params);
}

export async function validateSession(sessionId: string) {
  return SessionManager.validateSession(sessionId);
}

export async function revokeSession(sessionId: string, reason: string) {
  return SessionManager.revokeSession(sessionId, reason);
}

export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
) {
  return SessionManager.revokeAllUserSessions(userId, exceptSessionId);
}

export async function getUserSessions(userId: string) {
  return SessionManager.getUserSessions(userId);
}

export async function markSessionSuspicious(sessionId: string, reason: string) {
  return SessionManager.markSuspicious(sessionId, reason);
}

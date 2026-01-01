import { prisma } from "./db";
import { generateToken } from "./encryption";
import { logAudit } from "./audit";

export interface SessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: string;
}

/**
 * Create a new session
 */
export async function createSession(data: SessionData) {
  const sessionToken = generateToken(64);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const session = await prisma.session.create({
    data: {
      sessionId: sessionToken,
      userId: data.userId,
      accessToken: generateToken(64),
      refreshToken: generateToken(64),
      expiresAt,
      refreshExpiresAt: new Date(
        expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      ),
      ipAddress: data.ipAddress || "unknown",
      userAgent: data.userAgent || "unknown",
      device: {
        id: data.deviceId || generateToken(16),
        userAgent: data.userAgent || "unknown",
      },
      location: data.location ? JSON.parse(data.location) : null,
      lastActivityAt: new Date(),
      status: "active",
    },
  });

  return session;
}

/**
 * Get session by token
 */
export async function getSession(sessionToken: string) {
  return await prisma.session.findUnique({
    where: { sessionId: sessionToken },
    include: {
      user: {
        include: {
          organization: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Validate session
 */
export async function validateSession(sessionToken: string): Promise<boolean> {
  const session = await getSession(sessionToken);

  if (!session) {
    return false;
  }

  // Check if session is active
  if (session.status !== "active") {
    return false;
  }

  // Check if session has expired
  if (new Date(session.expiresAt) < new Date()) {
    await revokeSession(session.id, "Session expired");
    return false;
  }

  // Check if session has been inactive too long
  const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
  const lastActivity = new Date(session.lastActivityAt);
  const timeSinceActivity = Date.now() - lastActivity.getTime();

  if (timeSinceActivity > inactivityTimeout) {
    await revokeSession(session.id, "Session inactive timeout");
    return false;
  }

  // Update last activity
  await updateSessionActivity(session.id);

  return true;
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
  return await prisma.session.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string, reason?: string) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: reason,
    },
  });

  // Log session revocation
  await logAudit({
    userId: session.userId,
    action: "SESSION_REVOKED",
    resource: "Session",
    resourceId: sessionId,
    description: `Session revoked: ${reason || "No reason provided"}`,
    metadata: { sessionId, reason },
  });

  return session;
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(
  userId: string,
  reason?: string,
  exceptSessionId?: string,
) {
  const where: any = {
    userId,
    status: "active",
  };

  if (exceptSessionId) {
    where.id = { not: exceptSessionId };
  }

  const result = await prisma.session.updateMany({
    where,
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: reason || "All sessions revoked",
    },
  });

  // Log action
  await logAudit({
    userId,
    action: "SESSION_REVOKED",
    resource: "Session",
    description: `All user sessions revoked: ${reason || "No reason provided"}`,
    metadata: { userId, reason, count: result.count },
  });

  return result;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return await prisma.session.findMany({
    where: {
      userId,
      status: "active",
      expiresAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      lastActivityAt: "desc",
    },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.session.updateMany({
    where: {
      status: "active",
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "expired",
      logoutAt: new Date(),
      logoutReason: "Session expired",
    },
  });

  return result.count;
}

/**
 * Get session statistics
 */
export async function getSessionStats(organizationId?: string) {
  const where: any = {
    status: "active",
    expiresAt: {
      gte: new Date(),
    },
  };

  if (organizationId) {
    where.user = {
      organizationId,
    };
  }

  const [activeSessions, totalSessions, uniqueUsers] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.count({
      where: organizationId ? { user: { organizationId } } : {},
    }),
    prisma.session.findMany({
      where,
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  return {
    activeSessions,
    totalSessions,
    activeUsers: uniqueUsers.length,
  };
}

/**
 * Detect suspicious session activity
 */
export async function detectSuspiciousActivity(userId: string): Promise<{
  suspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  const sessions = await getUserSessions(userId);

  // Check for multiple concurrent sessions from different locations
  if (sessions.length > 5) {
    reasons.push(`High number of concurrent sessions: ${sessions.length}`);
  }

  // Check for sessions from different countries
  const locations = sessions
    .map((s) => {
      try {
        return s.location
          ? typeof s.location === "string"
            ? JSON.parse(s.location)
            : s.location
          : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const countries = new Set(
    locations.map((l: any) => l?.country).filter(Boolean),
  );
  if (countries.size > 2) {
    reasons.push(
      `Sessions from multiple countries: ${Array.from(countries).join(", ")}`,
    );
  }

  // Check for rapid session creation
  const recentSessions = sessions.filter((s) => {
    const createdAt = new Date(s.createdAt);
    return Date.now() - createdAt.getTime() < 5 * 60 * 1000; // Last 5 minutes
  });

  if (recentSessions.length > 3) {
    reasons.push(
      `Rapid session creation: ${recentSessions.length} in 5 minutes`,
    );
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Get session device information
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Simple user agent parsing (consider using a library like ua-parser-js for production)
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Detect browser
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  // Detect OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  // Detect device type
  if (userAgent.includes("Mobile")) device = "Mobile";
  else if (userAgent.includes("Tablet")) device = "Tablet";

  return { browser, os, device };
}

/**
 * Refresh session token
 */
export async function refreshSession(refreshToken: string) {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (!session || session.status !== "active") {
    throw new Error("Invalid refresh token");
  }

  if (new Date(session.refreshExpiresAt) < new Date()) {
    await revokeSession(session.id, "Refresh token expired");
    throw new Error("Refresh token expired");
  }

  // Generate new tokens
  const newAccessToken = generateToken(64);
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 30);

  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      accessToken: newAccessToken,
      expiresAt: newExpiresAt,
      lastActivityAt: new Date(),
    },
  });

  return updatedSession;
}

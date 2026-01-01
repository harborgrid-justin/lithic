import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { parseUserAgent } from "@/lib/session";

/**
 * Advanced Session Manager
 * Multi-device tracking, concurrent session limits, activity monitoring, and emergency access
 */

export interface SessionConfig {
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  location?: GeoLocation;
  loginMethod?: "password" | "sso" | "mfa" | "emergency";
  ssoProvider?: string;
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface SessionInfo {
  id: string;
  sessionId: string;
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  location?: GeoLocation;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
  isTrusted: boolean;
}

export interface SecurityAlert {
  type:
    | "SUSPICIOUS_LOGIN"
    | "NEW_DEVICE"
    | "UNUSUAL_LOCATION"
    | "MULTIPLE_SESSIONS";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  metadata: any;
}

const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_MAX_AGE_DAYS = 30;
const REFRESH_TOKEN_MAX_AGE_DAYS = 60;

/**
 * Create new session with device tracking
 */
export async function createManagedSession(
  config: SessionConfig,
): Promise<{ sessionId: string; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({
    where: { id: config.userId },
    select: {
      id: true,
      organizationId: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "active") {
    throw new Error("User account is not active");
  }

  // Parse device information
  const deviceInfo = parseUserAgent(config.userAgent);
  const deviceId =
    config.deviceId || generateDeviceId(config.userAgent, config.ipAddress);

  // Check concurrent session limit
  const activeSessions = await getActiveSessionCount(config.userId);
  if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
    // Revoke oldest session
    await revokeOldestSession(config.userId);
  }

  // Generate tokens
  const sessionId = generateToken(32);
  const accessToken = generateToken(64);
  const refreshToken = generateToken(64);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );
  const refreshExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: config.userId,
      sessionId,
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      ipAddress: config.ipAddress,
      userAgent: config.userAgent,
      device: {
        id: deviceId,
        name: generateDeviceName(deviceInfo),
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        type: deviceInfo.device,
        userAgent: config.userAgent,
      },
      location: config.location || null,
      lastActivityAt: now,
      status: "active",
      loginMethod: config.loginMethod || "password",
      ssoProvider: config.ssoProvider,
    },
  });

  // Check for security alerts
  const alerts = await detectSecurityAlerts(config.userId, {
    ipAddress: config.ipAddress,
    location: config.location,
    deviceId,
  });

  // Log alerts
  for (const alert of alerts) {
    await createSecurityAlert(config.userId, user.organizationId, alert);
  }

  // Log session creation
  await logAudit({
    userId: config.userId,
    action: "SESSION_CREATED",
    resource: "Session",
    resourceId: session.id,
    description: `New session created from ${deviceInfo.device} (${deviceInfo.browser} on ${deviceInfo.os})`,
    metadata: {
      sessionId,
      deviceId,
      deviceName: generateDeviceName(deviceInfo),
      ipAddress: config.ipAddress,
      location: config.location,
      loginMethod: config.loginMethod,
      alerts: alerts.length,
    },
    ipAddress: config.ipAddress,
    userAgent: config.userAgent,
    organizationId: user.organizationId,
  });

  return { sessionId, accessToken, refreshToken };
}

/**
 * Get active sessions for user
 */
export async function getUserActiveSessions(
  userId: string,
  currentSessionId?: string,
): Promise<SessionInfo[]> {
  const sessions = await prisma.session.findMany({
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

  return sessions.map((session) => {
    const device = session.device as any;
    const location = session.location as any;

    return {
      id: session.id,
      sessionId: session.sessionId,
      deviceId: device?.id || "unknown",
      deviceName: device?.name || "Unknown Device",
      browser: device?.browser || "Unknown",
      os: device?.os || "Unknown",
      deviceType: device?.type || "Desktop",
      ipAddress: session.ipAddress,
      location: location || undefined,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === currentSessionId,
      isTrusted: isTrustedDevice(device?.id, userId),
    };
  });
}

/**
 * Revoke session by ID
 */
export async function revokeSessionById(
  userId: string,
  sessionId: string,
  reason: string = "User requested",
): Promise<void> {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      user: {
        select: { organizationId: true },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: reason,
    },
  });

  await logAudit({
    userId,
    action: "SESSION_REVOKED",
    resource: "Session",
    resourceId: sessionId,
    description: `Session revoked: ${reason}`,
    metadata: { sessionId, reason },
    organizationId: session.user.organizationId,
  });
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentSessionId: string,
  reason: string = "User requested logout of all other devices",
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const result = await prisma.session.updateMany({
    where: {
      userId,
      sessionId: { not: currentSessionId },
      status: "active",
    },
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: reason,
    },
  });

  await logAudit({
    userId,
    action: "SESSION_REVOKED",
    resource: "Session",
    description: `All other sessions revoked: ${reason}`,
    metadata: { currentSessionId, count: result.count, reason },
    organizationId: user.organizationId,
  });

  return result.count;
}

/**
 * Update session activity
 */
export async function updateSessionActivity(
  sessionId: string,
  ipAddress?: string,
): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { sessionId },
  });

  if (!session || session.status !== "active") {
    return;
  }

  // Check for IP address change
  if (ipAddress && ipAddress !== session.ipAddress) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    await logAudit({
      userId: session.userId,
      action: "SESSION_IP_CHANGED",
      resource: "Session",
      resourceId: session.id,
      description: `Session IP address changed from ${session.ipAddress} to ${ipAddress}`,
      metadata: {
        oldIpAddress: session.ipAddress,
        newIpAddress: ipAddress,
      },
      organizationId: user?.organizationId || "",
    });
  }

  await prisma.session.update({
    where: { sessionId },
    data: {
      lastActivityAt: new Date(),
      ipAddress: ipAddress || session.ipAddress,
    },
  });
}

/**
 * Validate session and check for timeout
 */
export async function validateManagedSession(
  sessionId: string,
): Promise<{ valid: boolean; reason?: string; session?: any }> {
  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: {
      user: true,
    },
  });

  if (!session) {
    return { valid: false, reason: "Session not found" };
  }

  if (session.status !== "active") {
    return { valid: false, reason: `Session is ${session.status}` };
  }

  if (new Date() >= session.expiresAt) {
    await prisma.session.update({
      where: { sessionId },
      data: {
        status: "expired",
        logoutAt: new Date(),
        logoutReason: "Session expired",
      },
    });

    return { valid: false, reason: "Session expired" };
  }

  // Check activity timeout
  const inactivityTimeout = SESSION_TIMEOUT_MINUTES * 60 * 1000;
  const lastActivity = new Date(session.lastActivityAt);
  const timeSinceActivity = Date.now() - lastActivity.getTime();

  if (timeSinceActivity > inactivityTimeout) {
    await prisma.session.update({
      where: { sessionId },
      data: {
        status: "expired",
        logoutAt: new Date(),
        logoutReason: "Inactivity timeout",
      },
    });

    return { valid: false, reason: "Inactivity timeout" };
  }

  // Check user status
  if (session.user.status !== "active") {
    await prisma.session.update({
      where: { sessionId },
      data: {
        status: "revoked",
        logoutAt: new Date(),
        logoutReason: `User account is ${session.user.status}`,
      },
    });

    return { valid: false, reason: `User account is ${session.user.status}` };
  }

  return { valid: true, session };
}

/**
 * Refresh session tokens
 */
export async function refreshSessionTokens(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (!session || session.status !== "active") {
    throw new Error("Invalid refresh token");
  }

  if (new Date() >= session.refreshExpiresAt) {
    await prisma.session.update({
      where: { refreshToken },
      data: {
        status: "expired",
        logoutAt: new Date(),
        logoutReason: "Refresh token expired",
      },
    });

    throw new Error("Refresh token expired");
  }

  // Generate new tokens
  const newAccessToken = generateToken(64);
  const newRefreshToken = generateToken(64);
  const newExpiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.update({
    where: { refreshToken },
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      lastActivityAt: new Date(),
    },
  });

  const expiresIn = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  };
}

/**
 * Detect security alerts for new session
 */
async function detectSecurityAlerts(
  userId: string,
  context: {
    ipAddress: string;
    location?: GeoLocation;
    deviceId: string;
  },
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];

  // Check for new device
  const deviceExists = await prisma.session.findFirst({
    where: {
      userId,
      device: {
        path: ["id"],
        equals: context.deviceId,
      },
    },
  });

  if (!deviceExists) {
    alerts.push({
      type: "NEW_DEVICE",
      severity: "MEDIUM",
      message: "Login from new device detected",
      metadata: { deviceId: context.deviceId },
    });
  }

  // Check for unusual location
  if (context.location?.country) {
    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      take: 10,
    });

    const countries = new Set(
      recentSessions
        .map((s) => {
          const loc = s.location as any;
          return loc?.country;
        })
        .filter(Boolean),
    );

    if (!countries.has(context.location.country) && countries.size > 0) {
      alerts.push({
        type: "UNUSUAL_LOCATION",
        severity: "HIGH",
        message: `Login from unusual location: ${context.location.country}`,
        metadata: { location: context.location },
      });
    }
  }

  // Check for multiple concurrent sessions
  const activeSessionCount = await getActiveSessionCount(userId);
  if (activeSessionCount >= MAX_CONCURRENT_SESSIONS - 1) {
    alerts.push({
      type: "MULTIPLE_SESSIONS",
      severity: "MEDIUM",
      message: "High number of concurrent sessions detected",
      metadata: { count: activeSessionCount + 1 },
    });
  }

  return alerts;
}

/**
 * Create security alert
 */
async function createSecurityAlert(
  userId: string,
  organizationId: string,
  alert: SecurityAlert,
): Promise<void> {
  await prisma.securityEvent.create({
    data: {
      type: alert.type,
      severity: alert.severity,
      userId,
      organizationId,
      description: alert.message,
      metadata: alert.metadata,
      resolved: false,
    },
  });

  await logAudit({
    userId,
    action: "SECURITY_ALERT",
    resource: "SecurityEvent",
    description: alert.message,
    metadata: {
      alertType: alert.type,
      severity: alert.severity,
      ...alert.metadata,
    },
    organizationId,
  });
}

/**
 * Helper functions
 */

function generateDeviceId(userAgent: string, ipAddress: string): string {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(`${userAgent}:${ipAddress}`)
    .digest("hex")
    .substring(0, 32);
}

function generateDeviceName(deviceInfo: {
  browser: string;
  os: string;
  device: string;
}): string {
  return `${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`;
}

async function getActiveSessionCount(userId: string): Promise<number> {
  return await prisma.session.count({
    where: {
      userId,
      status: "active",
      expiresAt: {
        gte: new Date(),
      },
    },
  });
}

async function revokeOldestSession(userId: string): Promise<void> {
  const oldestSession = await prisma.session.findFirst({
    where: {
      userId,
      status: "active",
    },
    orderBy: {
      lastActivityAt: "asc",
    },
  });

  if (oldestSession) {
    await prisma.session.update({
      where: { id: oldestSession.id },
      data: {
        status: "revoked",
        logoutAt: new Date(),
        logoutReason: "Concurrent session limit reached",
      },
    });
  }
}

function isTrustedDevice(deviceId: string, userId: string): boolean {
  // Implement trust logic based on device history
  // For now, return false
  return false;
}

/**
 * Trust a device
 */
export async function trustDevice(
  userId: string,
  deviceId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.trustedDevice.create({
    data: {
      userId,
      deviceId,
      trustedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  await logAudit({
    userId,
    action: "DEVICE_TRUSTED",
    resource: "TrustedDevice",
    resourceId: deviceId,
    description: "Device marked as trusted",
    metadata: { deviceId },
    organizationId: user.organizationId,
  });
}

/**
 * Revoke device trust
 */
export async function revokeDeviceTrust(
  userId: string,
  deviceId: string,
): Promise<void> {
  await prisma.trustedDevice.deleteMany({
    where: {
      userId,
      deviceId,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  await logAudit({
    userId,
    action: "DEVICE_TRUST_REVOKED",
    resource: "TrustedDevice",
    resourceId: deviceId,
    description: "Device trust revoked",
    metadata: { deviceId },
    organizationId: user?.organizationId || "",
  });
}

/**
 * Get session analytics
 */
export async function getSessionAnalytics(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{
  totalSessions: number;
  activeSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  sessionsByDevice: Record<string, number>;
  sessionsByBrowser: Record<string, number>;
  sessionsByOS: Record<string, number>;
}> {
  const where: any = {
    user: { organizationId },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const sessions = await prisma.session.findMany({
    where,
    select: {
      id: true,
      userId: true,
      status: true,
      device: true,
      createdAt: true,
      lastActivityAt: true,
    },
  });

  const activeSessions = sessions.filter((s) => s.status === "active");
  const uniqueUsers = new Set(sessions.map((s) => s.userId)).size;

  // Calculate average session duration
  let totalDuration = 0;
  for (const session of sessions) {
    const duration =
      new Date(session.lastActivityAt).getTime() -
      new Date(session.createdAt).getTime();
    totalDuration += duration;
  }
  const averageSessionDuration =
    sessions.length > 0 ? totalDuration / sessions.length / 1000 / 60 : 0; // in minutes

  // Group by device, browser, OS
  const sessionsByDevice: Record<string, number> = {};
  const sessionsByBrowser: Record<string, number> = {};
  const sessionsByOS: Record<string, number> = {};

  for (const session of sessions) {
    const device = session.device as any;

    const deviceType = device?.type || "Unknown";
    const browser = device?.browser || "Unknown";
    const os = device?.os || "Unknown";

    sessionsByDevice[deviceType] = (sessionsByDevice[deviceType] || 0) + 1;
    sessionsByBrowser[browser] = (sessionsByBrowser[browser] || 0) + 1;
    sessionsByOS[os] = (sessionsByOS[os] || 0) + 1;
  }

  return {
    totalSessions: sessions.length,
    activeSessions: activeSessions.length,
    uniqueUsers,
    averageSessionDuration: Math.round(averageSessionDuration),
    sessionsByDevice,
    sessionsByBrowser,
    sessionsByOS,
  };
}

/**
 * Enterprise Audit Logging System
 * HIPAA-compliant with tamper-evident storage
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import crypto from "crypto";
import {
  AuditLog,
  AuditAction,
  AuditDetails,
  TamperProofData,
  DeviceInfo,
  GeoLocation,
  DataClassification,
} from "@/types/security";

// ============================================================================
// Interfaces
// ============================================================================

export interface AuditLogEntry {
  userId: string;
  userEmail?: string;
  userName?: string;
  organizationId: string;
  sessionId?: string;
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  resourceType?: string;
  details: string | AuditDetails;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  location?: GeoLocation;
  phiAccessed?: boolean;
  phiFields?: string[];
  success?: boolean;
  errorMessage?: string;
  riskScore?: number;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  organizationId?: string;
  userId?: string;
  userEmail?: string;
  action?: AuditAction | AuditAction[];
  resource?: string;
  resourceId?: string;
  phiAccessed?: boolean;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
  orderBy?: "timestamp" | "action" | "resource";
  orderDirection?: "asc" | "desc";
}

export interface AuditStatistics {
  totalLogs: number;
  phiAccessCount: number;
  failedAccessCount: number;
  uniqueUsers: number;
  activityByAction: Record<string, number>;
  activityByResource: Record<string, number>;
  activityByHour: Record<number, number>;
  topUsers: Array<{ userId: string; count: number }>;
  anomalies: number;
}

// ============================================================================
// Audit Logger
// ============================================================================

export class AuditLogger {
  private static chainHead: string | null = null;
  private static writeQueue: AuditLogEntry[] = [];
  private static isProcessing = false;
  private static batchSize = 100;
  private static flushInterval = 5000; // 5 seconds

  /**
   * Initialize the audit logger
   */
  static async initialize(): Promise<void> {
    // Get the latest audit log to establish chain
    const latest = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" },
      select: { tamperProof: true },
    });

    if (latest && typeof latest.tamperProof === "object") {
      const tamperProof = latest.tamperProof as any;
      this.chainHead = tamperProof.hash;
    } else {
      this.chainHead = this.hashString("GENESIS_BLOCK");
    }

    // Start batch processing
    setInterval(() => this.flushQueue(), this.flushInterval);
  }

  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    // Add to write queue
    this.writeQueue.push(entry);

    // Trigger flush if queue is large
    if (this.writeQueue.length >= this.batchSize) {
      await this.flushQueue();
    }
  }

  /**
   * Flush the write queue
   */
  private static async flushQueue(): Promise<void> {
    if (this.isProcessing || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.writeQueue.splice(0, this.batchSize);

    try {
      await Promise.all(batch.map((entry) => this.writeLog(entry)));
    } catch (error) {
      console.error("Failed to write audit logs:", error);
      // Re-add failed entries to queue
      this.writeQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Write a single log entry
   */
  private static async writeLog(entry: AuditLogEntry): Promise<AuditLog> {
    const timestamp = new Date();

    // Prepare details
    const details =
      typeof entry.details === "string"
        ? { description: entry.details }
        : entry.details;

    // Create tamper-proof data
    const tamperProof = this.createTamperProof(entry, timestamp);

    // Create audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId,
        userEmail: entry.userEmail || "",
        userName: entry.userName || "",
        sessionId: entry.sessionId || "",
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        resourceType: entry.resourceType,
        details: details as any,
        ipAddress: entry.ipAddress || "unknown",
        userAgent: entry.userAgent || "unknown",
        deviceInfo: entry.deviceInfo as any,
        location: entry.location as any,
        timestamp,
        phiAccessed: entry.phiAccessed || false,
        phiFields: entry.phiFields || [],
        success: entry.success !== false,
        errorMessage: entry.errorMessage,
        riskScore: entry.riskScore,
        metadata: entry.metadata as any,
        tamperProof: tamperProof as any,
      },
    });

    // Update chain head
    this.chainHead = tamperProof.hash;

    // Check for anomalies
    await this.checkForAnomalies(auditLog);

    return auditLog as AuditLog;
  }

  /**
   * Create tamper-proof data
   */
  private static createTamperProof(
    entry: AuditLogEntry,
    timestamp: Date,
  ): TamperProofData {
    const data = {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || "",
      timestamp: timestamp.getTime(),
      previousHash: this.chainHead || "",
    };

    const hash = this.hashObject(data);
    const signature = this.signData(hash);

    return {
      hash,
      previousHash: this.chainHead || "",
      chainVerified: true,
      signature,
      timestamp: timestamp.getTime(),
    };
  }

  /**
   * Verify audit log chain integrity
   */
  static async verifyChainIntegrity(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    valid: boolean;
    totalLogs: number;
    verifiedLogs: number;
    brokenChains: Array<{ id: string; reason: string }>;
  }> {
    const where: any = {};
    if (startDate) where.timestamp = { gte: startDate };
    if (endDate) where.timestamp = { ...where.timestamp, lte: endDate };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "asc" },
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        timestamp: true,
        tamperProof: true,
      },
    });

    let previousHash = this.hashString("GENESIS_BLOCK");
    const brokenChains: Array<{ id: string; reason: string }> = [];
    let verifiedLogs = 0;

    for (const log of logs) {
      const tamperProof = log.tamperProof as any;

      // Verify previous hash matches
      if (tamperProof.previousHash !== previousHash) {
        brokenChains.push({
          id: log.id,
          reason: "Previous hash mismatch",
        });
        continue;
      }

      // Verify current hash
      const expectedHash = this.hashObject({
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || "",
        timestamp: new Date(log.timestamp).getTime(),
        previousHash,
      });

      if (tamperProof.hash !== expectedHash) {
        brokenChains.push({
          id: log.id,
          reason: "Hash mismatch - data may be tampered",
        });
        continue;
      }

      // Verify signature
      if (!this.verifySignature(tamperProof.hash, tamperProof.signature)) {
        brokenChains.push({
          id: log.id,
          reason: "Invalid signature",
        });
        continue;
      }

      verifiedLogs++;
      previousHash = tamperProof.hash;
    }

    return {
      valid: brokenChains.length === 0,
      totalLogs: logs.length,
      verifiedLogs,
      brokenChains,
    };
  }

  /**
   * Query audit logs
   */
  static async query(query: AuditQuery): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    const where: any = {};

    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.userId) where.userId = query.userId;
    if (query.userEmail) where.userEmail = { contains: query.userEmail };
    if (query.action) {
      where.action = Array.isArray(query.action)
        ? { in: query.action }
        : query.action;
    }
    if (query.resource) where.resource = query.resource;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.phiAccessed !== undefined)
      where.phiAccessed = query.phiAccessed;
    if (query.success !== undefined) where.success = query.success;
    if (query.ipAddress) where.ipAddress = query.ipAddress;
    if (query.sessionId) where.sessionId = query.sessionId;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    const limit = Math.min(query.limit || 100, 1000);
    const offset = query.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          [query.orderBy || "timestamp"]: query.orderDirection || "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs as AuditLog[],
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AuditStatistics> {
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
        action: true,
        resource: true,
        phiAccessed: true,
        success: true,
        timestamp: true,
      },
    });

    const activityByAction: Record<string, number> = {};
    const activityByResource: Record<string, number> = {};
    const activityByHour: Record<number, number> = {};
    const userCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    let phiAccessCount = 0;
    let failedAccessCount = 0;

    for (const log of logs) {
      // Count by action
      activityByAction[log.action] = (activityByAction[log.action] || 0) + 1;

      // Count by resource
      activityByResource[log.resource] =
        (activityByResource[log.resource] || 0) + 1;

      // Count by hour
      const hour = new Date(log.timestamp).getHours();
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;

      // Count by user
      uniqueUsers.add(log.userId);
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;

      // Count PHI access
      if (log.phiAccessed) phiAccessCount++;

      // Count failures
      if (!log.success) failedAccessCount++;
    }

    // Get top users
    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      totalLogs: logs.length,
      phiAccessCount,
      failedAccessCount,
      uniqueUsers: uniqueUsers.size,
      activityByAction,
      activityByResource,
      activityByHour,
      topUsers,
      anomalies: 0, // Would be calculated by anomaly detection
    };
  }

  /**
   * Export audit logs
   */
  static async export(
    query: AuditQuery,
    format: "json" | "csv" = "json",
  ): Promise<string> {
    const { logs } = await this.query({ ...query, limit: 10000 });

    if (format === "csv") {
      return this.exportAsCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export as CSV
   */
  private static exportAsCSV(logs: AuditLog[]): string {
    const headers = [
      "Timestamp",
      "User ID",
      "User Email",
      "Action",
      "Resource",
      "Resource ID",
      "PHI Accessed",
      "Success",
      "IP Address",
      "Details",
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.userId,
      log.userEmail,
      log.action,
      log.resource,
      log.resourceId || "",
      log.phiAccessed ? "Yes" : "No",
      log.success ? "Yes" : "No",
      log.ipAddress,
      typeof log.details === "object"
        ? (log.details as AuditDetails).description
        : "",
    ]);

    return [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
  }

  /**
   * Check for anomalies
   */
  private static async checkForAnomalies(log: AuditLog): Promise<void> {
    // Check for suspicious patterns
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId: log.userId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    // Check for unusual PHI access volume
    if (log.phiAccessed) {
      const phiAccessCount = recentLogs.filter((l) => l.phiAccessed).length;
      if (phiAccessCount > 50) {
        await this.createAnomaly({
          userId: log.userId,
          type: "HIGH_PHI_ACCESS_VOLUME",
          description: `User accessed PHI ${phiAccessCount} times in the last hour`,
          severity: "HIGH",
          relatedLogId: log.id,
        });
      }
    }

    // Check for failed login attempts
    if (
      log.action === AuditAction.LOGIN_FAILED ||
      log.action === AuditAction.MFA_FAILED
    ) {
      const failedAttempts = recentLogs.filter(
        (l) =>
          l.action === AuditAction.LOGIN_FAILED ||
          l.action === AuditAction.MFA_FAILED,
      ).length;

      if (failedAttempts > 5) {
        await this.createAnomaly({
          userId: log.userId,
          type: "BRUTE_FORCE_ATTEMPT",
          description: `${failedAttempts} failed login attempts in the last hour`,
          severity: "CRITICAL",
          relatedLogId: log.id,
        });
      }
    }

    // Check for unusual time/location
    // This would integrate with ML-based anomaly detection
  }

  /**
   * Create anomaly record
   */
  private static async createAnomaly(params: {
    userId: string;
    type: string;
    description: string;
    severity: string;
    relatedLogId: string;
  }): Promise<void> {
    // This would create a SecurityThreat or Anomaly record
    console.warn("Anomaly detected:", params);

    // Log the anomaly
    await this.log({
      userId: params.userId,
      organizationId: "", // Would be filled from context
      action: "ANOMALY_DETECTED" as AuditAction,
      resource: "Security",
      details: params.description,
      metadata: {
        type: params.type,
        severity: params.severity,
        relatedLogId: params.relatedLogId,
      },
    });
  }

  /**
   * Helper: Hash a string
   */
  private static hashString(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Helper: Hash an object
   */
  private static hashObject(data: any): string {
    return this.hashString(JSON.stringify(data));
  }

  /**
   * Helper: Sign data
   */
  private static signData(data: string): string {
    const secret = process.env.AUDIT_SIGNING_KEY || process.env.NEXTAUTH_SECRET!;
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  /**
   * Helper: Verify signature
   */
  private static verifySignature(data: string, signature: string): boolean {
    const expectedSignature = this.signData(data);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }
}

// Initialize on module load
if (typeof window === "undefined") {
  AuditLogger.initialize().catch(console.error);
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  return AuditLogger.log(entry);
}

export async function queryAuditLogs(query: AuditQuery) {
  return AuditLogger.query(query);
}

export async function getAuditStatistics(
  organizationId: string,
  startDate: Date,
  endDate: Date,
) {
  return AuditLogger.getStatistics(organizationId, startDate, endDate);
}

export async function verifyAuditIntegrity(startDate?: Date, endDate?: Date) {
  return AuditLogger.verifyChainIntegrity(startDate, endDate);
}

export async function exportAuditLogs(
  query: AuditQuery,
  format: "json" | "csv" = "json",
) {
  return AuditLogger.export(query, format);
}

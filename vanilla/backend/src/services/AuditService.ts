import { Pool } from "pg";
import encryptionService from "./EncryptionService";

/**
 * AuditService - HIPAA-compliant audit logging service
 * Implements comprehensive audit trail for all PHI access and system events
 */

export interface AuditLogEntry {
  id?: string;
  timestamp?: Date;
  userId: string;
  userEmail?: string;
  organizationId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  status: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  phiAccessed?: boolean;
  sessionId?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export enum AuditAction {
  // Authentication
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  MFA_ENABLED = "MFA_ENABLED",
  MFA_DISABLED = "MFA_DISABLED",
  MFA_VERIFIED = "MFA_VERIFIED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  PASSWORD_RESET = "PASSWORD_RESET",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_ACTIVATED = "USER_ACTIVATED",
  USER_DEACTIVATED = "USER_DEACTIVATED",

  // Role & Permission
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  ROLE_REVOKED = "ROLE_REVOKED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",

  // PHI Access
  PHI_ACCESSED = "PHI_ACCESSED",
  PHI_CREATED = "PHI_CREATED",
  PHI_UPDATED = "PHI_UPDATED",
  PHI_DELETED = "PHI_DELETED",
  PHI_EXPORTED = "PHI_EXPORTED",
  PHI_PRINTED = "PHI_PRINTED",

  // Patient Data
  PATIENT_VIEWED = "PATIENT_VIEWED",
  PATIENT_CREATED = "PATIENT_CREATED",
  PATIENT_UPDATED = "PATIENT_UPDATED",
  PATIENT_DELETED = "PATIENT_DELETED",

  // System
  SYSTEM_CONFIG_CHANGED = "SYSTEM_CONFIG_CHANGED",
  BACKUP_CREATED = "BACKUP_CREATED",
  BACKUP_RESTORED = "BACKUP_RESTORED",
  ENCRYPTION_KEY_ROTATED = "ENCRYPTION_KEY_ROTATED",

  // Security
  UNAUTHORIZED_ACCESS_ATTEMPT = "UNAUTHORIZED_ACCESS_ATTEMPT",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  SECURITY_BREACH = "SECURITY_BREACH",
}

export enum ResourceType {
  USER = "USER",
  ROLE = "ROLE",
  PERMISSION = "PERMISSION",
  PATIENT = "PATIENT",
  APPOINTMENT = "APPOINTMENT",
  MEDICAL_RECORD = "MEDICAL_RECORD",
  BILLING = "BILLING",
  PRESCRIPTION = "PRESCRIPTION",
  LAB_RESULT = "LAB_RESULT",
  ORGANIZATION = "ORGANIZATION",
  SYSTEM = "SYSTEM",
  SESSION = "SESSION",
}

export class AuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.initializeAuditTable();
  }

  /**
   * Initialize audit log table
   */
  private async initializeAuditTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        organization_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        status VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSONB,
        phi_accessed BOOLEAN DEFAULT FALSE,
        session_id VARCHAR(255),
        severity VARCHAR(20) DEFAULT 'low',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_phi ON audit_logs(phi_accessed);
      CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      console.error("Failed to initialize audit table:", error);
    }
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        user_id, user_email, organization_id, action, resource_type,
        resource_id, status, ip_address, user_agent, details,
        phi_accessed, session_id, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
      entry.userId,
      entry.userEmail,
      entry.organizationId,
      entry.action,
      entry.resourceType,
      entry.resourceId,
      entry.status,
      entry.ipAddress,
      entry.userAgent,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.phiAccessed || false,
      entry.sessionId,
      entry.severity || "low",
    ];

    try {
      await this.pool.query(query, values);

      // Alert on critical events
      if (entry.severity === "critical" || entry.status === "failure") {
        this.alertOnCriticalEvent(entry);
      }
    } catch (error) {
      // Audit logging failures should not break application flow
      // Log to console or external monitoring system
      console.error("Audit log failed:", error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filters: {
    userId?: string;
    organizationId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    phiAccessed?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    const values: any[] = [];
    let paramCount = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramCount++}`;
      values.push(filters.userId);
    }

    if (filters.organizationId) {
      query += ` AND organization_id = $${paramCount++}`;
      values.push(filters.organizationId);
    }

    if (filters.action) {
      query += ` AND action = $${paramCount++}`;
      values.push(filters.action);
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramCount++}`;
      values.push(filters.resourceType);
    }

    if (filters.phiAccessed !== undefined) {
      query += ` AND phi_accessed = $${paramCount++}`;
      values.push(filters.phiAccessed);
    }

    if (filters.startDate) {
      query += ` AND timestamp >= $${paramCount++}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND timestamp <= $${paramCount++}`;
      values.push(filters.endDate);
    }

    query += " ORDER BY timestamp DESC";

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(filters.offset);
    }

    const result = await this.pool.query(query, values);
    return result.rows.map(this.mapRowToEntry);
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(organizationId?: string): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN phi_accessed = true THEN 1 END) as phi_access_events,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT DATE(timestamp)) as active_days
      FROM audit_logs
    `;

    const values: any[] = [];
    if (organizationId) {
      query += " WHERE organization_id = $1";
      values.push(organizationId);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent PHI access by user
   */
  async getPHIAccessByUser(
    userId: string,
    limit: number = 50,
  ): Promise<AuditLogEntry[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1 AND phi_accessed = true
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows.map(this.mapRowToEntry);
  }

  /**
   * Get failed login attempts
   */
  async getFailedLoginAttempts(
    ipAddress?: string,
    timeWindow: number = 3600000, // 1 hour in milliseconds
  ): Promise<number> {
    const since = new Date(Date.now() - timeWindow);
    let query = `
      SELECT COUNT(*) FROM audit_logs
      WHERE action = $1 AND status = 'failure' AND timestamp >= $2
    `;

    const values: any[] = [AuditAction.LOGIN_FAILED, since];

    if (ipAddress) {
      query += " AND ip_address = $3";
      values.push(ipAddress);
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    organizationId?: string;
    format?: "json" | "csv";
  }): Promise<string> {
    const logs = await this.getLogs({
      startDate: filters.startDate,
      endDate: filters.endDate,
      organizationId: filters.organizationId,
      limit: 100000, // Max export limit
    });

    if (filters.format === "csv") {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Alert on critical security events
   */
  private alertOnCriticalEvent(entry: AuditLogEntry): void {
    // Implement alerting mechanism (email, Slack, PagerDuty, etc.)
    console.error("CRITICAL AUDIT EVENT:", {
      action: entry.action,
      userId: entry.userId,
      resourceType: entry.resourceType,
      status: entry.status,
      timestamp: new Date().toISOString(),
    });

    // In production, integrate with:
    // - SIEM systems (Splunk, ELK Stack)
    // - Alerting services (PagerDuty, OpsGenie)
    // - Email notifications
    // - Webhook integrations
  }

  /**
   * Convert logs to CSV format
   */
  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      "ID",
      "Timestamp",
      "User ID",
      "User Email",
      "Organization ID",
      "Action",
      "Resource Type",
      "Resource ID",
      "Status",
      "IP Address",
      "PHI Accessed",
      "Severity",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.timestamp?.toISOString(),
      log.userId,
      log.userEmail,
      log.organizationId,
      log.action,
      log.resourceType,
      log.resourceId,
      log.status,
      log.ipAddress,
      log.phiAccessed,
      log.severity,
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")),
    ].join("\n");
  }

  /**
   * Map database row to AuditLogEntry
   */
  private mapRowToEntry(row: any): AuditLogEntry {
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      userEmail: row.user_email,
      organizationId: row.organization_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      status: row.status,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      details: row.details,
      phiAccessed: row.phi_accessed,
      sessionId: row.session_id,
      severity: row.severity,
    };
  }
}

import { PatientHistory } from '@/types/patient';

export interface AuditLogEntry {
  resourceType: 'patient' | 'insurance' | 'document' | 'appointment' | 'user';
  resourceId: string;
  action: AuditAction;
  actor: AuditActor;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'merge'
  | 'access'
  | 'search'
  | 'print'
  | 'download';

export interface AuditActor {
  userId: string;
  username: string;
  role: string;
  email?: string;
}

export class AuditLogger {
  /**
   * Log a HIPAA-compliant audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const auditEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      _auditVersion: '1.0',
    };

    // In production, this would:
    // 1. Write to a secure, append-only audit log database
    // 2. Encrypt sensitive data
    // 3. Send to SIEM system
    // 4. Ensure tamper-proof storage
    
    console.log('[AUDIT]', JSON.stringify(auditEntry));
    
    // Store in database (implementation depends on your backend)
    await this.persistAuditLog(auditEntry);
  }

  /**
   * Log patient access
   */
  async logPatientAccess(
    patientId: string,
    actor: AuditActor,
    context: { ipAddress?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.log({
      resourceType: 'patient',
      resourceId: patientId,
      action: 'access',
      actor,
      timestamp: new Date().toISOString(),
      ...context,
      metadata: {
        reason: 'Patient record accessed',
      },
    });
  }

  /**
   * Log patient data modification
   */
  async logPatientModification(
    patientId: string,
    action: 'create' | 'update' | 'delete',
    actor: AuditActor,
    changes: Record<string, any>,
    context: { ipAddress?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    // Sanitize changes to remove sensitive data from logs
    const sanitizedChanges = this.sanitizeChanges(changes);

    await this.log({
      resourceType: 'patient',
      resourceId: patientId,
      action,
      actor,
      changes: sanitizedChanges,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Log data export
   */
  async logDataExport(
    resourceType: AuditLogEntry['resourceType'],
    resourceIds: string[],
    actor: AuditActor,
    exportFormat: string,
    context: { ipAddress?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.log({
      resourceType,
      resourceId: resourceIds.join(','),
      action: 'export',
      actor,
      timestamp: new Date().toISOString(),
      ...context,
      metadata: {
        format: exportFormat,
        recordCount: resourceIds.length,
      },
    });
  }

  /**
   * Log patient search
   */
  async logPatientSearch(
    searchCriteria: Record<string, any>,
    resultCount: number,
    actor: AuditActor,
    context: { ipAddress?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.log({
      resourceType: 'patient',
      resourceId: 'search',
      action: 'search',
      actor,
      timestamp: new Date().toISOString(),
      ...context,
      metadata: {
        criteria: searchCriteria,
        resultCount,
      },
    });
  }

  /**
   * Sanitize changes to remove sensitive fields
   */
  private sanitizeChanges(changes: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['ssn', 'password', 'token', 'creditCard'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(changes)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Persist audit log to database
   * In production, this would write to a secure audit database
   */
  private async persistAuditLog(entry: any): Promise<void> {
    // TODO: Implement actual database persistence
    // This could be:
    // - A dedicated audit table in your database
    // - A separate audit database
    // - A cloud logging service (AWS CloudWatch, Azure Monitor, etc.)
    // - A SIEM system
    
    // For now, we'll just log to console
    // In production, replace with actual implementation
  }

  /**
   * Convert audit log to PatientHistory format
   */
  static toPatientHistory(entry: AuditLogEntry, patientId: string): PatientHistory {
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      patientId,
      action: entry.action + ' by ' + entry.actor.username,
      changes: entry.changes,
      performedBy: entry.actor.userId,
      performedAt: entry.timestamp,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: entry.metadata,
    };
  }
}

export const auditLogger = new AuditLogger();

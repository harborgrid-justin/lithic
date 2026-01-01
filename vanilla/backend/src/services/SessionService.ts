import { Pool } from 'pg';
import crypto from 'crypto';
import { AuditService, AuditAction, ResourceType } from './AuditService';

/**
 * SessionService - Secure session management with automatic timeout
 * Implements HIPAA-compliant session handling with activity tracking
 */

export interface Session {
  id: string;
  userId: string;
  userEmail: string;
  organizationId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export class SessionService {
  private pool: Pool;
  private auditService: AuditService;
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly absoluteTimeout = 12 * 60 * 60 * 1000; // 12 hours
  private readonly maxConcurrentSessions = 3;

  constructor(pool: Pool, auditService: AuditService) {
    this.pool = pool;
    this.auditService = auditService;
    this.initializeSessionTable();
    this.startSessionCleanup();
  }

  /**
   * Initialize session table
   */
  private async initializeSessionTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        device_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_session_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_session_active ON sessions(is_active);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to initialize session table:', error);
    }
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    userEmail: string,
    organizationId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<Session> {
    // Check concurrent session limit
    await this.enforceConcurrentSessionLimit(userId);

    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.absoluteTimeout);
    const deviceInfo = this.parseUserAgent(userAgent);

    const query = `
      INSERT INTO sessions (
        id, user_id, user_email, organization_id, ip_address,
        user_agent, device_info, created_at, last_activity_at, expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      sessionId,
      userId,
      userEmail,
      organizationId,
      ipAddress,
      userAgent,
      JSON.stringify(deviceInfo),
      now,
      now,
      expiresAt,
      true,
    ];

    const result = await this.pool.query(query, values);
    const session = this.mapRowToSession(result.rows[0]);

    // Audit log
    await this.auditService.log({
      userId,
      userEmail,
      organizationId,
      action: AuditAction.LOGIN,
      resourceType: ResourceType.SESSION,
      resourceId: sessionId,
      status: 'success',
      ipAddress,
      userAgent,
      sessionId,
      severity: 'low',
    });

    return session;
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId: string, ipAddress: string): Promise<Session | null> {
    const query = `
      SELECT * FROM sessions
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const session = this.mapRowToSession(result.rows[0]);

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await this.invalidateSession(sessionId, 'Session expired');
      return null;
    }

    // Check inactivity timeout
    const inactivityTime = Date.now() - session.lastActivityAt.getTime();
    if (inactivityTime > this.sessionTimeout) {
      await this.invalidateSession(sessionId, 'Session timeout due to inactivity');
      return null;
    }

    // Validate IP address (optional, can be disabled for mobile users)
    // if (session.ipAddress !== ipAddress) {
    //   await this.invalidateSession(sessionId, 'IP address mismatch');
    //   return null;
    // }

    // Update last activity
    await this.updateLastActivity(sessionId);

    return session;
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    const query = `
      UPDATE sessions
      SET last_activity_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [sessionId]);
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string, reason?: string): Promise<void> {
    const query = `
      UPDATE sessions
      SET is_active = false
      WHERE id = $1
      RETURNING user_id, user_email, organization_id
    `;

    const result = await this.pool.query(query, [sessionId]);

    if (result.rows.length > 0) {
      const { user_id, user_email, organization_id } = result.rows[0];

      // Audit log
      await this.auditService.log({
        userId: user_id,
        userEmail: user_email,
        organizationId: organization_id,
        action: AuditAction.LOGOUT,
        resourceType: ResourceType.SESSION,
        resourceId: sessionId,
        status: 'success',
        details: { reason },
        sessionId,
        severity: 'low',
      });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    let query = `
      UPDATE sessions
      SET is_active = false
      WHERE user_id = $1 AND is_active = true
    `;

    const values: any[] = [userId];

    if (exceptSessionId) {
      query += ' AND id != $2';
      values.push(exceptSessionId);
    }

    const result = await this.pool.query(query, values);
    return result.rowCount || 0;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const query = `
      SELECT * FROM sessions
      WHERE user_id = $1 AND is_active = true
      ORDER BY last_activity_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.map(this.mapRowToSession);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const query = `
      SELECT * FROM sessions
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length >= this.maxConcurrentSessions) {
      // Invalidate oldest session
      const oldestSession = sessions[sessions.length - 1];
      await this.invalidateSession(
        oldestSession.id,
        'Maximum concurrent sessions exceeded'
      );
    }
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const query = `
      UPDATE sessions
      SET is_active = false
      WHERE is_active = true AND (
        expires_at < CURRENT_TIMESTAMP OR
        last_activity_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes'
      )
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Start automatic session cleanup
   */
  private startSessionCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpiredSessions();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired sessions`);
        }
      } catch (error) {
        console.error('Session cleanup failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): any {
    // Basic user agent parsing (in production, use a library like ua-parser-js)
    const deviceInfo: any = {};

    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

    if (userAgent.includes('Mobile')) deviceInfo.device = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceInfo.device = 'Tablet';
    else deviceInfo.device = 'Desktop';

    return deviceInfo;
  }

  /**
   * Map database row to Session
   */
  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      organizationId: row.organization_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      lastActivityAt: row.last_activity_at,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      deviceInfo: row.device_info,
    };
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(organizationId?: string): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(EXTRACT(EPOCH FROM (last_activity_at - created_at))) as avg_session_duration
      FROM sessions
    `;

    const values: any[] = [];
    if (organizationId) {
      query += ' WHERE organization_id = $1';
      values.push(organizationId);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}

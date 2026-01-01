import { Pool } from 'pg';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { AuditService, AuditAction, ResourceType } from './AuditService';
import encryptionService from './EncryptionService';

/**
 * MFAService - Multi-Factor Authentication using TOTP (Time-based One-Time Password)
 * Implements RFC 6238 TOTP for enhanced security
 */

export interface MFAConfig {
  userId: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  createdAt?: Date;
  lastUsedAt?: Date;
}

export class MFAService {
  private pool: Pool;
  private auditService: AuditService;
  private readonly appName = 'Lithic Healthcare';
  private readonly backupCodeCount = 10;

  constructor(pool: Pool, auditService: AuditService) {
    this.pool = pool;
    this.auditService = auditService;
    this.initializeMFATable();

    // Configure TOTP settings
    authenticator.options = {
      window: 1, // Allow 1 step (30 seconds) before and after
      step: 30, // 30-second time step
    };
  }

  /**
   * Initialize MFA configuration table
   */
  private async initializeMFATable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mfa_configs (
        user_id VARCHAR(255) PRIMARY KEY,
        secret_encrypted TEXT NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        backup_codes_encrypted TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mfa_user_id ON mfa_configs(user_id);
      CREATE INDEX IF NOT EXISTS idx_mfa_enabled ON mfa_configs(enabled);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to initialize MFA table:', error);
    }
  }

  /**
   * Setup MFA for a user (generate secret and QR code)
   */
  async setupMFA(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Encrypt sensitive data
    const encryptedSecret = encryptionService.encrypt(secret);
    const encryptedBackupCodes = encryptionService.encrypt(JSON.stringify(backupCodes));

    // Store in database (but don't enable yet)
    const query = `
      INSERT INTO mfa_configs (user_id, secret_encrypted, backup_codes_encrypted, enabled)
      VALUES ($1, $2, $3, false)
      ON CONFLICT (user_id)
      DO UPDATE SET
        secret_encrypted = $2,
        backup_codes_encrypted = $3,
        enabled = false,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.pool.query(query, [userId, encryptedSecret, encryptedBackupCodes]);

    // Generate QR code
    const otpauth = authenticator.keyuri(userEmail, this.appName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Enable MFA after user verifies TOTP code
   */
  async enableMFA(
    userId: string,
    userEmail: string,
    organizationId: string,
    token: string
  ): Promise<boolean> {
    // Get MFA config
    const config = await this.getMFAConfig(userId);
    if (!config) {
      throw new Error('MFA not configured. Please setup MFA first.');
    }

    // Verify token
    const isValid = this.verifyToken(config.secret, token);
    if (!isValid) {
      await this.auditService.log({
        userId,
        userEmail,
        organizationId,
        action: AuditAction.MFA_ENABLED,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: 'failure',
        details: { reason: 'Invalid token' },
        severity: 'medium',
      });

      return false;
    }

    // Enable MFA
    const query = `
      UPDATE mfa_configs
      SET enabled = true, last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId]);

    // Audit log
    await this.auditService.log({
      userId,
      userEmail,
      organizationId,
      action: AuditAction.MFA_ENABLED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      status: 'success',
      severity: 'medium',
    });

    return true;
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(
    userId: string,
    userEmail: string,
    organizationId: string,
    token: string
  ): Promise<boolean> {
    // Get MFA config
    const config = await this.getMFAConfig(userId);
    if (!config || !config.enabled) {
      return false;
    }

    // Verify token before disabling
    const isValid =
      this.verifyToken(config.secret, token) || this.verifyBackupCode(userId, token);

    if (!isValid) {
      await this.auditService.log({
        userId,
        userEmail,
        organizationId,
        action: AuditAction.MFA_DISABLED,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: 'failure',
        details: { reason: 'Invalid token' },
        severity: 'high',
      });

      return false;
    }

    // Disable MFA
    const query = `
      UPDATE mfa_configs
      SET enabled = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId]);

    // Audit log
    await this.auditService.log({
      userId,
      userEmail,
      organizationId,
      action: AuditAction.MFA_DISABLED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      status: 'success',
      severity: 'high',
    });

    return true;
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const config = await this.getMFAConfig(userId);

    if (!config || !config.enabled) {
      return false;
    }

    // Try TOTP first
    const totpValid = this.verifyToken(config.secret, token);
    if (totpValid) {
      await this.updateLastUsed(userId);
      return true;
    }

    // Try backup code
    const backupValid = await this.verifyBackupCode(userId, token);
    if (backupValid) {
      await this.updateLastUsed(userId);
      return true;
    }

    return false;
  }

  /**
   * Check if MFA is enabled for user
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const query = `
      SELECT enabled FROM mfa_configs
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].enabled;
  }

  /**
   * Get MFA configuration
   */
  async getMFAConfig(userId: string): Promise<MFAConfig | null> {
    const query = `
      SELECT * FROM mfa_configs
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Decrypt sensitive data
    const secret = encryptionService.decrypt(row.secret_encrypted);
    const backupCodes = row.backup_codes_encrypted
      ? JSON.parse(encryptionService.decrypt(row.backup_codes_encrypted))
      : [];

    return {
      userId: row.user_id,
      secret,
      enabled: row.enabled,
      backupCodes,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    };
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    const encryptedBackupCodes = encryptionService.encrypt(JSON.stringify(backupCodes));

    const query = `
      UPDATE mfa_configs
      SET backup_codes_encrypted = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `;

    await this.pool.query(query, [encryptedBackupCodes, userId]);

    return backupCodes;
  }

  /**
   * Verify TOTP token
   */
  private verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify backup code (one-time use)
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const config = await this.getMFAConfig(userId);
    if (!config || !config.backupCodes) {
      return false;
    }

    const codeIndex = config.backupCodes.indexOf(code);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    config.backupCodes.splice(codeIndex, 1);
    const encryptedBackupCodes = encryptionService.encrypt(
      JSON.stringify(config.backupCodes)
    );

    const query = `
      UPDATE mfa_configs
      SET backup_codes_encrypted = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `;

    await this.pool.query(query, [encryptedBackupCodes, userId]);

    return true;
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(userId: string): Promise<void> {
    const query = `
      UPDATE mfa_configs
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.backupCodeCount; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-');
      codes.push(code);
    }

    return codes;
  }

  /**
   * Get MFA statistics
   */
  async getMFAStatistics(): Promise<{
    totalUsers: number;
    enabledUsers: number;
    enabledPercentage: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_users
      FROM mfa_configs
    `;

    const result = await this.pool.query(query);
    const { total_users, enabled_users } = result.rows[0];

    return {
      totalUsers: parseInt(total_users, 10),
      enabledUsers: parseInt(enabled_users, 10),
      enabledPercentage:
        total_users > 0 ? (enabled_users / total_users) * 100 : 0,
    };
  }
}

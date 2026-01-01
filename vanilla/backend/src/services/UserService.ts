import { Pool } from "pg";
import { AuditService, AuditAction, ResourceType } from "./AuditService";
import encryptionService from "./EncryptionService";
import { RoleService } from "./RoleService";

/**
 * UserService - User management with HIPAA compliance
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles: string[];
  isActive: boolean;
  isMFAEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles?: string[];
  metadata?: Record<string, any>;
}

export class UserService {
  private pool: Pool;
  private auditService: AuditService;
  private roleService: RoleService;

  constructor(
    pool: Pool,
    auditService: AuditService,
    roleService: RoleService,
  ) {
    this.pool = pool;
    this.auditService = auditService;
    this.roleService = roleService;
    this.initializeUserTable();
  }

  /**
   * Initialize user table
   */
  private async initializeUserTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_mfa_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP WITH TIME ZONE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      console.error("Failed to initialize user table:", error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData, createdBy: string): Promise<User> {
    // Hash password
    const passwordHash = await encryptionService.hashPassword(data.password);

    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name,
        organization_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.email.toLowerCase(),
      passwordHash,
      data.firstName,
      data.lastName,
      data.organizationId,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    const result = await this.pool.query(query, values);
    const user = this.mapRowToUser(result.rows[0]);

    // Assign roles
    if (data.roles && data.roles.length > 0) {
      for (const roleName of data.roles) {
        await this.roleService.assignRoleToUser(
          user.id,
          roleName,
          data.organizationId,
          createdBy,
        );
      }
    }

    // Audit log
    await this.auditService.log({
      userId: createdBy,
      organizationId: data.organizationId,
      action: AuditAction.USER_CREATED,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      status: "success",
      details: { email: data.email, roles: data.roles },
      severity: "medium",
    });

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT * FROM users WHERE id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users WHERE email = $1
    `;

    const result = await this.pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updates: Partial<User>,
    updatedBy: string,
  ): Promise<User> {
    const allowedFields = ["first_name", "last_name", "metadata", "is_active"];
    const setters: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = this.camelToSnake(key);
      if (allowedFields.includes(dbKey)) {
        setters.push(`${dbKey} = $${paramCount++}`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
      }
    }

    if (setters.length === 0) {
      throw new Error("No valid fields to update");
    }

    setters.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${setters.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    const user = this.mapRowToUser(result.rows[0]);

    // Audit log
    await this.auditService.log({
      userId: updatedBy,
      organizationId: user.organizationId,
      action: AuditAction.USER_UPDATED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      status: "success",
      details: { updates },
      severity: "low",
    });

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    // Get current password hash
    const query = `SELECT password_hash FROM users WHERE id = $1`;
    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    const currentHash = result.rows[0].password_hash;

    // Verify old password
    const isValid = await encryptionService.verifyPassword(
      oldPassword,
      currentHash,
    );
    if (!isValid) {
      return false;
    }

    // Hash new password
    const newHash = await encryptionService.hashPassword(newPassword);

    // Update password
    const updateQuery = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await this.pool.query(updateQuery, [newHash, userId]);

    // Audit log
    const user = await this.getUserById(userId);
    if (user) {
      await this.auditService.log({
        userId,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: AuditAction.PASSWORD_CHANGED,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: "success",
        severity: "medium",
      });
    }

    return true;
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    resetBy: string,
  ): Promise<boolean> {
    const passwordHash = await encryptionService.hashPassword(newPassword);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await this.pool.query(query, [passwordHash, userId]);

    // Audit log
    const user = await this.getUserById(userId);
    if (user) {
      await this.auditService.log({
        userId: resetBy,
        organizationId: user.organizationId,
        action: AuditAction.PASSWORD_RESET,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: "success",
        details: { targetUserId: userId, targetEmail: user.email },
        severity: "high",
      });
    }

    return true;
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (await this.isAccountLocked(user.id)) {
      return null;
    }

    // Get password hash
    const query = `SELECT password_hash FROM users WHERE id = $1`;
    const result = await this.pool.query(query, [user.id]);
    const passwordHash = result.rows[0].password_hash;

    // Verify password
    const isValid = await encryptionService.verifyPassword(
      password,
      passwordHash,
    );

    if (!isValid) {
      await this.recordFailedLogin(user.id);
      return null;
    }

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);

    return user;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string, deactivatedBy: string): Promise<void> {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);

    // Audit log
    const user = await this.getUserById(userId);
    if (user) {
      await this.auditService.log({
        userId: deactivatedBy,
        organizationId: user.organizationId,
        action: AuditAction.USER_DEACTIVATED,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: "success",
        details: { targetUserId: userId },
        severity: "high",
      });
    }
  }

  /**
   * Activate user
   */
  async activateUser(userId: string, activatedBy: string): Promise<void> {
    const query = `
      UPDATE users
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);

    // Audit log
    const user = await this.getUserById(userId);
    if (user) {
      await this.auditService.log({
        userId: activatedBy,
        organizationId: user.organizationId,
        action: AuditAction.USER_ACTIVATED,
        resourceType: ResourceType.USER,
        resourceId: userId,
        status: "success",
        details: { targetUserId: userId },
        severity: "medium",
      });
    }
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(
    organizationId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<User[]> {
    const query = `
      SELECT * FROM users
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [
      organizationId,
      limit,
      offset,
    ]);
    return result.rows.map(this.mapRowToUser);
  }

  /**
   * Search users
   */
  async searchUsers(
    organizationId: string,
    searchTerm: string,
    limit: number = 50,
  ): Promise<User[]> {
    const query = `
      SELECT * FROM users
      WHERE organization_id = $1
      AND (
        email ILIKE $2 OR
        first_name ILIKE $2 OR
        last_name ILIKE $2
      )
      LIMIT $3
    `;

    const result = await this.pool.query(query, [
      organizationId,
      `%${searchTerm}%`,
      limit,
    ]);
    return result.rows.map(this.mapRowToUser);
  }

  /**
   * Record failed login attempt
   */
  private async recordFailedLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE
          WHEN failed_login_attempts + 1 >= 5
          THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
          ELSE locked_until
        END
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  /**
   * Check if account is locked
   */
  private async isAccountLocked(userId: string): Promise<boolean> {
    const query = `
      SELECT locked_until FROM users WHERE id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return false;
    }

    const lockedUntil = result.rows[0].locked_until;

    if (!lockedUntil) {
      return false;
    }

    return new Date(lockedUntil) > new Date();
  }

  /**
   * Map database row to User
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      organizationId: row.organization_id,
      roles: [],
      isActive: row.is_active,
      isMFAEnabled: row.is_mfa_enabled,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

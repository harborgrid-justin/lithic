import { Pool } from "pg";
import { AuditService, AuditAction, ResourceType } from "./AuditService";

/**
 * RoleService - Role-Based Access Control (RBAC) service
 * Implements granular permission management for healthcare compliance
 */

export interface Role {
  id: string;
  name: string;
  description: string;
  organizationId?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  conditions?: Record<string, any>;
}

export enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  PRINT = "PRINT",
  MANAGE = "MANAGE",
}

// Predefined system roles for healthcare
export const SystemRoles = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  PHYSICIAN: "PHYSICIAN",
  NURSE: "NURSE",
  MEDICAL_ASSISTANT: "MEDICAL_ASSISTANT",
  RECEPTIONIST: "RECEPTIONIST",
  BILLING_SPECIALIST: "BILLING_SPECIALIST",
  LAB_TECHNICIAN: "LAB_TECHNICIAN",
  PHARMACIST: "PHARMACIST",
  PATIENT: "PATIENT",
  AUDITOR: "AUDITOR",
};

export class RoleService {
  private pool: Pool;
  private auditService: AuditService;

  constructor(pool: Pool, auditService: AuditService) {
    this.pool = pool;
    this.auditService = auditService;
    this.initializeRBACTables();
  }

  /**
   * Initialize RBAC tables
   */
  private async initializeRBACTables(): Promise<void> {
    const createTablesQuery = `
      -- Roles table
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        organization_id VARCHAR(255),
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, organization_id)
      );

      -- Permissions table
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        conditions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
      );

      -- Role-Permission mapping
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      );

      -- User-Role mapping
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(255) NOT NULL,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        organization_id VARCHAR(255) NOT NULL,
        assigned_by VARCHAR(255),
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
      );

      CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);
    `;

    try {
      await this.pool.query(createTablesQuery);
      await this.seedSystemRoles();
    } catch (error) {
      console.error("Failed to initialize RBAC tables:", error);
    }
  }

  /**
   * Seed default system roles and permissions
   */
  private async seedSystemRoles(): Promise<void> {
    const systemRolesData = [
      {
        name: SystemRoles.SUPER_ADMIN,
        description: "Full system access across all organizations",
        permissions: ["*:*"], // All permissions
      },
      {
        name: SystemRoles.ORG_ADMIN,
        description: "Organization administrator with full org access",
        permissions: [
          "USERS:*",
          "ROLES:*",
          "PATIENTS:*",
          "APPOINTMENTS:*",
          "BILLING:*",
          "REPORTS:*",
          "SETTINGS:*",
        ],
      },
      {
        name: SystemRoles.PHYSICIAN,
        description: "Licensed physician with full patient care access",
        permissions: [
          "PATIENTS:READ",
          "PATIENTS:UPDATE",
          "PATIENTS:CREATE",
          "MEDICAL_RECORDS:*",
          "PRESCRIPTIONS:*",
          "LAB_RESULTS:READ",
          "APPOINTMENTS:*",
          "BILLING:READ",
        ],
      },
      {
        name: SystemRoles.NURSE,
        description: "Nursing staff with patient care access",
        permissions: [
          "PATIENTS:READ",
          "PATIENTS:UPDATE",
          "MEDICAL_RECORDS:READ",
          "MEDICAL_RECORDS:UPDATE",
          "APPOINTMENTS:READ",
          "APPOINTMENTS:UPDATE",
          "LAB_RESULTS:READ",
        ],
      },
      {
        name: SystemRoles.MEDICAL_ASSISTANT,
        description: "Medical assistant with limited clinical access",
        permissions: [
          "PATIENTS:READ",
          "PATIENTS:UPDATE",
          "APPOINTMENTS:*",
          "MEDICAL_RECORDS:READ",
        ],
      },
      {
        name: SystemRoles.RECEPTIONIST,
        description: "Front desk staff with scheduling access",
        permissions: [
          "PATIENTS:READ",
          "PATIENTS:CREATE",
          "PATIENTS:UPDATE",
          "APPOINTMENTS:*",
          "BILLING:READ",
        ],
      },
      {
        name: SystemRoles.BILLING_SPECIALIST,
        description: "Billing department with financial access",
        permissions: [
          "PATIENTS:READ",
          "BILLING:*",
          "INSURANCE:*",
          "REPORTS:READ",
        ],
      },
      {
        name: SystemRoles.LAB_TECHNICIAN,
        description: "Laboratory staff with test result access",
        permissions: ["PATIENTS:READ", "LAB_RESULTS:*", "LAB_ORDERS:READ"],
      },
      {
        name: SystemRoles.PHARMACIST,
        description: "Pharmacy staff with prescription access",
        permissions: [
          "PATIENTS:READ",
          "PRESCRIPTIONS:READ",
          "PRESCRIPTIONS:UPDATE",
        ],
      },
      {
        name: SystemRoles.PATIENT,
        description: "Patient with access to own records",
        permissions: [
          "PATIENT_PORTAL:READ",
          "APPOINTMENTS:READ",
          "APPOINTMENTS:CREATE",
          "MEDICAL_RECORDS:READ",
          "BILLING:READ",
        ],
      },
      {
        name: SystemRoles.AUDITOR,
        description: "Compliance auditor with read-only access",
        permissions: [
          "AUDIT_LOGS:READ",
          "PATIENTS:READ",
          "USERS:READ",
          "REPORTS:READ",
        ],
      },
    ];

    for (const roleData of systemRolesData) {
      try {
        // Check if role exists
        const checkQuery = `
          SELECT id FROM roles WHERE name = $1 AND is_system = true
        `;
        const existing = await this.pool.query(checkQuery, [roleData.name]);

        if (existing.rows.length === 0) {
          // Create role
          const roleQuery = `
            INSERT INTO roles (name, description, is_system)
            VALUES ($1, $2, true)
            RETURNING id
          `;
          const roleResult = await this.pool.query(roleQuery, [
            roleData.name,
            roleData.description,
          ]);
          const roleId = roleResult.rows[0].id;

          // Create and assign permissions
          for (const perm of roleData.permissions) {
            const [resource, action] = perm.split(":");
            await this.assignPermissionToRole(roleId, resource, action);
          }
        }
      } catch (error) {
        console.error(`Failed to seed role ${roleData.name}:`, error);
      }
    }
  }

  /**
   * Create a custom role
   */
  async createRole(
    name: string,
    description: string,
    organizationId: string,
    createdBy: string,
  ): Promise<Role> {
    const query = `
      INSERT INTO roles (name, description, organization_id, is_system)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      name,
      description,
      organizationId,
    ]);
    const role = this.mapRowToRole(result.rows[0]);

    // Audit log
    await this.auditService.log({
      userId: createdBy,
      organizationId,
      action: AuditAction.ROLE_ASSIGNED,
      resourceType: ResourceType.ROLE,
      resourceId: role.id,
      status: "success",
      details: { roleName: name },
      severity: "medium",
    });

    return role;
  }

  /**
   * Assign permission to role
   */
  private async assignPermissionToRole(
    roleId: string,
    resource: string,
    action: string,
  ): Promise<void> {
    // Create or get permission
    const permQuery = `
      INSERT INTO permissions (resource, action)
      VALUES ($1, $2)
      ON CONFLICT (resource, action) DO UPDATE SET resource = $1
      RETURNING id
    `;
    const permResult = await this.pool.query(permQuery, [resource, action]);
    const permissionId = permResult.rows[0].id;

    // Link permission to role
    const linkQuery = `
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await this.pool.query(linkQuery, [roleId, permissionId]);
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleName: string,
    organizationId: string,
    assignedBy: string,
  ): Promise<void> {
    // Get role ID
    const roleQuery = `
      SELECT id FROM roles
      WHERE name = $1 AND (organization_id = $2 OR is_system = true)
    `;
    const roleResult = await this.pool.query(roleQuery, [
      roleName,
      organizationId,
    ]);

    if (roleResult.rows.length === 0) {
      throw new Error(`Role ${roleName} not found`);
    }

    const roleId = roleResult.rows[0].id;

    const query = `
      INSERT INTO user_roles (user_id, role_id, organization_id, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;

    await this.pool.query(query, [userId, roleId, organizationId, assignedBy]);

    // Audit log
    await this.auditService.log({
      userId: assignedBy,
      organizationId,
      action: AuditAction.ROLE_ASSIGNED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      status: "success",
      details: { roleName, targetUserId: userId },
      severity: "medium",
    });
  }

  /**
   * Revoke role from user
   */
  async revokeRoleFromUser(
    userId: string,
    roleName: string,
    organizationId: string,
    revokedBy: string,
  ): Promise<void> {
    const query = `
      DELETE FROM user_roles
      WHERE user_id = $1
      AND role_id = (
        SELECT id FROM roles
        WHERE name = $2 AND (organization_id = $3 OR is_system = true)
      )
    `;

    await this.pool.query(query, [userId, roleName, organizationId]);

    // Audit log
    await this.auditService.log({
      userId: revokedBy,
      organizationId,
      action: AuditAction.ROLE_REVOKED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      status: "success",
      details: { roleName, targetUserId: userId },
      severity: "medium",
    });
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const query = `
      SELECT r.* FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    const roles: Role[] = [];

    for (const row of result.rows) {
      const role = this.mapRowToRole(row);
      role.permissions = await this.getRolePermissions(role.id);
      roles.push(role);
    }

    return roles;
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const query = `
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
    `;

    const result = await this.pool.query(query, [roleId]);
    return result.rows.map(this.mapRowToPermission);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: PermissionAction,
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    for (const role of roles) {
      for (const permission of role.permissions) {
        // Check for wildcard permissions
        if (permission.resource === "*" && permission.action === "*") {
          return true;
        }

        // Check for resource wildcard
        if (permission.resource === resource && permission.action === "*") {
          return true;
        }

        // Check for exact match
        if (permission.resource === resource && permission.action === action) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all roles for organization
   */
  async getOrganizationRoles(organizationId: string): Promise<Role[]> {
    const query = `
      SELECT * FROM roles
      WHERE organization_id = $1 OR is_system = true
      ORDER BY is_system DESC, name ASC
    `;

    const result = await this.pool.query(query, [organizationId]);
    const roles: Role[] = [];

    for (const row of result.rows) {
      const role = this.mapRowToRole(row);
      role.permissions = await this.getRolePermissions(role.id);
      roles.push(role);
    }

    return roles;
  }

  /**
   * Map database row to Role
   */
  private mapRowToRole(row: any): Role {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      organizationId: row.organization_id,
      permissions: [],
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map database row to Permission
   */
  private mapRowToPermission(row: any): Permission {
    return {
      id: row.id,
      resource: row.resource,
      action: row.action,
      conditions: row.conditions,
    };
  }
}

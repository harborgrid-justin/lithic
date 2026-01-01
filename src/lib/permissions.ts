import { prisma } from './db';
import type { PermissionScope } from '@prisma/client';

export interface Permission {
  resource: string;
  action: string;
  scope: PermissionScope;
  conditions?: any;
}

export interface PermissionCheck {
  userId: string;
  resource: string;
  action: string;
  resourceId?: string;
  organizationId?: string;
}

/**
 * Check if a user has permission to perform an action on a resource
 */
export async function checkPermission({
  userId,
  resource,
  action,
  resourceId,
  organizationId,
}: PermissionCheck): Promise<boolean> {
  try {
    // Get user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        customPermissions: true,
        accessGrants: {
          where: {
            resource,
            resourceId: resourceId || undefined,
            expiresAt: {
              gte: new Date(),
            },
            revokedAt: null,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Super admin has all permissions
    if (user.role?.name === 'SUPER_ADMIN') {
      return true;
    }

    // Check organization match
    if (organizationId && user.organizationId !== organizationId) {
      return false;
    }

    // Combine role permissions and custom permissions
    const allPermissions = [
      ...(user.role?.permissions || []),
      ...(user.customPermissions || []),
    ];

    // Check if user has the required permission
    const hasPermission = allPermissions.some((permission) => {
      // Check resource and action match
      const resourceMatch =
        permission.resource === resource || permission.resource === '*';
      const actionMatch =
        permission.action === action ||
        permission.action === '*' ||
        permission.action === 'admin';

      if (!resourceMatch || !actionMatch) {
        return false;
      }

      // Check scope
      switch (permission.scope) {
        case 'ALL':
          return true;

        case 'ORGANIZATION':
          return user.organizationId === organizationId;

        case 'DEPARTMENT':
          // TODO: Implement department-level checks
          return true;

        case 'OWN':
          // For OWN scope, the resource must belong to the user
          return resourceId === userId;

        default:
          return false;
      }
    });

    // Check temporary access grants
    const hasAccessGrant = user.accessGrants.length > 0;

    return hasPermission || hasAccessGrant;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
      customPermissions: true,
    },
  });

  if (!user) {
    return [];
  }

  const permissions = [
    ...(user.role?.permissions || []),
    ...(user.customPermissions || []),
  ];

  return permissions.map((p) => ({
    resource: p.resource,
    action: p.action,
    scope: p.scope,
    conditions: p.conditions,
  }));
}

/**
 * Grant temporary access to a resource
 */
export async function grantAccess({
  userId,
  resource,
  resourceId,
  action,
  grantedBy,
  expiresAt,
  reason,
}: {
  userId: string;
  resource: string;
  resourceId: string;
  action: string;
  grantedBy: string;
  expiresAt: Date;
  reason?: string;
}) {
  return await prisma.accessGrant.create({
    data: {
      userId,
      resource,
      resourceId,
      action,
      grantedBy,
      expiresAt,
      reason,
    },
  });
}

/**
 * Revoke access grant
 */
export async function revokeAccess(grantId: string) {
  return await prisma.accessGrant.update({
    where: { id: grantId },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Check if user has any of the specified roles
 */
export async function hasRole(userId: string, roles: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  });

  if (!user || !user.role) {
    return false;
  }

  return roles.includes(user.role.name);
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, ['ADMIN', 'SUPER_ADMIN']);
}

/**
 * Get permission matrix for an organization
 */
export async function getPermissionMatrix(organizationId: string) {
  const roles = await prisma.role.findMany({
    where: { organizationId },
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
  });

  // Get all unique resources and actions
  const allPermissions = roles.flatMap((role) => role.permissions);
  const resources = [...new Set(allPermissions.map((p) => p.resource))];
  const actions = [...new Set(allPermissions.map((p) => p.action))];

  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        scope: p.scope,
      })),
    })),
    resources,
    actions,
  };
}

/**
 * Create a new role with permissions
 */
export async function createRole({
  name,
  description,
  organizationId,
  permissions,
}: {
  name: string;
  description?: string;
  organizationId: string;
  permissions: Array<{
    resource: string;
    action: string;
    scope: PermissionScope;
    conditions?: any;
  }>;
}) {
  return await prisma.role.create({
    data: {
      name,
      description,
      organizationId,
      permissions: {
        create: permissions,
      },
    },
    include: {
      permissions: true,
    },
  });
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  roleId: string,
  permissions: Array<{
    resource: string;
    action: string;
    scope: PermissionScope;
    conditions?: any;
  }>
) {
  // Delete existing permissions
  await prisma.permission.deleteMany({
    where: { roleId },
  });

  // Create new permissions
  return await prisma.role.update({
    where: { id: roleId },
    data: {
      permissions: {
        create: permissions,
      },
    },
    include: {
      permissions: true,
    },
  });
}

/**
 * Assign role to user
 */
export async function assignRole(userId: string, roleId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });
}

/**
 * Default system roles
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    description: 'Full system access',
    permissions: [
      { resource: '*', action: '*', scope: 'ALL' as PermissionScope },
    ],
  },
  ADMIN: {
    name: 'ADMIN',
    description: 'Organization administrator',
    permissions: [
      { resource: '*', action: '*', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
  PHYSICIAN: {
    name: 'PHYSICIAN',
    description: 'Licensed physician',
    permissions: [
      { resource: 'patient', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'patient', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'appointment', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'appointment', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'clinical', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'clinical', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'prescription', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
  NURSE: {
    name: 'NURSE',
    description: 'Registered nurse',
    permissions: [
      { resource: 'patient', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'patient', action: 'write', scope: 'DEPARTMENT' as PermissionScope },
      { resource: 'appointment', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'vitals', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'clinical', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
  FRONT_DESK: {
    name: 'FRONT_DESK',
    description: 'Front desk staff',
    permissions: [
      { resource: 'patient', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'patient', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'appointment', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'appointment', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'billing', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
  BILLING: {
    name: 'BILLING',
    description: 'Billing staff',
    permissions: [
      { resource: 'patient', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'billing', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'billing', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'insurance', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'insurance', action: 'write', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
  VIEWER: {
    name: 'VIEWER',
    description: 'Read-only access',
    permissions: [
      { resource: 'patient', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'appointment', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
      { resource: 'reports', action: 'read', scope: 'ORGANIZATION' as PermissionScope },
    ],
  },
};

/**
 * Initialize system roles for an organization
 */
export async function initializeSystemRoles(organizationId: string) {
  const roles = Object.values(SYSTEM_ROLES);

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: roleData.name,
        },
      },
      update: {},
      create: {
        name: roleData.name,
        description: roleData.description,
        organizationId,
        isSystem: true,
        permissions: {
          create: roleData.permissions,
        },
      },
    });
  }
}

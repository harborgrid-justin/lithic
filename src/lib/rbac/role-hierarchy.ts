/**
 * Role Hierarchy Management System
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  RoleNode,
  RoleConflict,
  RolePermission,
  CreateRoleDto,
  PermissionScope,
} from "@/types/rbac";

// ============================================================================
// Role Hierarchy Operations
// ============================================================================

export class RoleHierarchy {
  /**
   * Build complete role hierarchy tree
   */
  static async buildHierarchy(organizationId: string): Promise<RoleNode[]> {
    const roles = await prisma.role.findMany({
      where: { organizationId },
      include: {
        permissions: true,
        parentRole: true,
        childRoles: true,
      },
    });

    // Build tree structure
    const roleMap = new Map<string, RoleNode>();
    const rootRoles: RoleNode[] = [];

    // First pass: create all nodes
    for (const role of roles) {
      const node: RoleNode = {
        id: role.id,
        name: role.name,
        description: role.description || "",
        level: 0,
        children: [],
        permissions: role.permissions.map(this.mapPermission),
        inheritedPermissions: [],
      };
      roleMap.set(role.id, node);
    }

    // Second pass: build relationships and calculate levels
    for (const role of roles) {
      const node = roleMap.get(role.id)!;

      if (role.parentRoleId) {
        const parent = roleMap.get(role.parentRoleId);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;

          // Inherit permissions if enabled
          if (role.inheritPermissions) {
            node.inheritedPermissions = this.getInheritedPermissions(
              parent,
              roleMap,
            );
          }
        }
      } else {
        rootRoles.push(node);
      }
    }

    return rootRoles;
  }

  /**
   * Get all permissions for a role including inherited ones
   */
  static async resolveRolePermissions(
    roleId: string,
  ): Promise<RolePermission[]> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        parentRole: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      return [];
    }

    const permissions = new Map<string, RolePermission>();

    // Add own permissions
    for (const perm of role.permissions) {
      const key = `${perm.resource}:${perm.action}`;
      permissions.set(key, this.mapPermission(perm));
    }

    // Add inherited permissions if enabled
    if (role.inheritPermissions && role.parentRole) {
      const inheritedPerms = await this.resolveRolePermissions(
        role.parentRoleId!,
      );
      for (const perm of inheritedPerms) {
        const key = `${perm.resource}:${perm.action}`;
        if (!permissions.has(key)) {
          permissions.set(key, { ...perm, inherited: true });
        }
      }
    }

    return Array.from(permissions.values());
  }

  /**
   * Create a new role with hierarchy
   */
  static async createRole(
    organizationId: string,
    userId: string,
    data: CreateRoleDto,
  ): Promise<any> {
    // Validate parent role exists
    if (data.parentRoleId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: data.parentRoleId },
      });

      if (!parentRole || parentRole.organizationId !== organizationId) {
        throw new Error("Invalid parent role");
      }

      // Check for circular dependency
      const wouldCreateCircular = await this.wouldCreateCircularDependency(
        data.parentRoleId,
        organizationId,
      );

      if (wouldCreateCircular) {
        throw new Error("Would create circular role hierarchy");
      }
    }

    // Calculate level
    const level = data.parentRoleId
      ? await this.calculateRoleLevel(data.parentRoleId)
      : 0;

    // Create role
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId,
        parentRoleId: data.parentRoleId,
        inheritPermissions: data.inheritPermissions ?? true,
        level,
        createdBy: userId,
        updatedBy: userId,
        permissions: {
          create: data.permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope,
            conditions: p.conditions || {},
            organizationId,
          })),
        },
      },
      include: {
        permissions: true,
        parentRole: true,
      },
    });

    // Log role creation
    await logAudit({
      userId,
      action: "CREATE",
      resource: "Role",
      resourceId: role.id,
      description: `Created role: ${role.name}`,
      metadata: {
        parentRoleId: data.parentRoleId,
        permissionCount: data.permissions.length,
      },
      organizationId,
    });

    return role;
  }

  /**
   * Update role hierarchy
   */
  static async updateRoleParent(
    roleId: string,
    newParentId: string | null,
    userId: string,
  ): Promise<any> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Check for circular dependency
    if (newParentId) {
      const wouldCreateCircular = await this.wouldCreateCircularDependency(
        newParentId,
        role.organizationId,
        roleId,
      );

      if (wouldCreateCircular) {
        throw new Error("Would create circular role hierarchy");
      }
    }

    // Calculate new level
    const newLevel = newParentId
      ? await this.calculateRoleLevel(newParentId)
      : 0;

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        parentRoleId: newParentId,
        level: newLevel,
        updatedBy: userId,
      },
      include: {
        permissions: true,
        parentRole: true,
        childRoles: true,
      },
    });

    // Update levels for all descendants
    await this.updateDescendantLevels(roleId, newLevel);

    // Log hierarchy change
    await logAudit({
      userId,
      action: "UPDATE",
      resource: "Role",
      resourceId: roleId,
      description: `Updated role hierarchy: ${role.name}`,
      metadata: {
        oldParentId: role.parentRoleId,
        newParentId,
        oldLevel: role.level,
        newLevel,
      },
      organizationId: role.organizationId,
    });

    return updatedRole;
  }

  /**
   * Detect conflicts in role hierarchy
   */
  static async detectConflicts(
    organizationId: string,
  ): Promise<RoleConflict[]> {
    const conflicts: RoleConflict[] = [];
    const roles = await prisma.role.findMany({
      where: { organizationId },
      include: { permissions: true },
    });

    // Check for circular dependencies
    for (const role of roles) {
      if (role.parentRoleId) {
        const hasCircular = await this.hasCircularDependency(role.id);
        if (hasCircular) {
          conflicts.push({
            roleId: role.id,
            conflictingRoleId: role.parentRoleId,
            conflictType: "HIERARCHY_CIRCULAR",
            description: "Circular dependency detected in role hierarchy",
            severity: "CRITICAL",
          });
        }
      }
    }

    // Check for permission overlaps
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const role1 = roles[i];
        const role2 = roles[j];

        // Skip if one is ancestor of the other
        if (await this.isAncestor(role1.id, role2.id)) {
          continue;
        }

        const overlaps = this.findPermissionOverlaps(
          role1.permissions,
          role2.permissions,
        );

        if (overlaps.length > 5) {
          conflicts.push({
            roleId: role1.id,
            conflictingRoleId: role2.id,
            conflictType: "PERMISSION_OVERLAP",
            description: `${overlaps.length} overlapping permissions found`,
            severity: "MEDIUM",
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get role path (all ancestors)
   */
  static async getRolePath(roleId: string): Promise<string[]> {
    const path: string[] = [roleId];
    let currentRoleId: string | null = roleId;

    while (currentRoleId) {
      const role = await prisma.role.findUnique({
        where: { id: currentRoleId },
        select: { parentRoleId: true },
      });

      if (role?.parentRoleId) {
        path.unshift(role.parentRoleId);
        currentRoleId = role.parentRoleId;
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Get all descendant roles
   */
  static async getDescendants(roleId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [roleId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.role.findMany({
        where: { parentRoleId: currentId },
        select: { id: true },
      });

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  /**
   * Check if role1 is ancestor of role2
   */
  static async isAncestor(role1Id: string, role2Id: string): Promise<boolean> {
    const path = await this.getRolePath(role2Id);
    return path.includes(role1Id);
  }

  /**
   * Merge permissions from multiple roles
   */
  static mergePermissions(
    permissionSets: RolePermission[][],
  ): RolePermission[] {
    const merged = new Map<string, RolePermission>();

    for (const permissions of permissionSets) {
      for (const perm of permissions) {
        const key = `${perm.resource}:${perm.action}`;
        const existing = merged.get(key);

        if (!existing) {
          merged.set(key, perm);
        } else {
          // Keep the most permissive scope
          const newScope = this.mostPermissiveScope(existing.scope, perm.scope);
          merged.set(key, { ...perm, scope: newScope });
        }
      }
    }

    return Array.from(merged.values());
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private static mapPermission(perm: any): RolePermission {
    return {
      id: perm.id,
      resource: perm.resource,
      action: perm.action,
      scope: perm.scope,
      conditions: perm.conditions,
      inherited: false,
      effectiveFrom: perm.createdAt,
      effectiveUntil: null,
    };
  }

  private static getInheritedPermissions(
    parent: RoleNode,
    roleMap: Map<string, RoleNode>,
  ): RolePermission[] {
    const inherited: RolePermission[] = [...parent.permissions];

    // Recursively get inherited permissions
    if (parent.inheritedPermissions.length > 0) {
      inherited.push(...parent.inheritedPermissions);
    }

    return inherited.map((p) => ({ ...p, inherited: true }));
  }

  private static async calculateRoleLevel(roleId: string): Promise<number> {
    const path = await this.getRolePath(roleId);
    return path.length;
  }

  private static async wouldCreateCircularDependency(
    parentId: string,
    organizationId: string,
    childId?: string,
  ): Promise<boolean> {
    if (!childId) return false;

    const path = await this.getRolePath(parentId);
    return path.includes(childId);
  }

  private static async hasCircularDependency(roleId: string): Promise<boolean> {
    const visited = new Set<string>();
    let currentRoleId: string | null = roleId;

    while (currentRoleId) {
      if (visited.has(currentRoleId)) {
        return true;
      }

      visited.add(currentRoleId);

      const role = await prisma.role.findUnique({
        where: { id: currentRoleId },
        select: { parentRoleId: true },
      });

      currentRoleId = role?.parentRoleId || null;
    }

    return false;
  }

  private static async updateDescendantLevels(
    roleId: string,
    parentLevel: number,
  ): Promise<void> {
    const children = await prisma.role.findMany({
      where: { parentRoleId: roleId },
    });

    for (const child of children) {
      const newLevel = parentLevel + 1;
      await prisma.role.update({
        where: { id: child.id },
        data: { level: newLevel },
      });

      // Recursively update descendants
      await this.updateDescendantLevels(child.id, newLevel);
    }
  }

  private static findPermissionOverlaps(perms1: any[], perms2: any[]): any[] {
    const overlaps: any[] = [];

    for (const p1 of perms1) {
      for (const p2 of perms2) {
        if (p1.resource === p2.resource && p1.action === p2.action) {
          overlaps.push({ perm1: p1, perm2: p2 });
        }
      }
    }

    return overlaps;
  }

  private static mostPermissiveScope(
    scope1: PermissionScope,
    scope2: PermissionScope,
  ): PermissionScope {
    const scopeOrder = [
      PermissionScope.OWN,
      PermissionScope.ASSIGNED,
      PermissionScope.TEAM,
      PermissionScope.DEPARTMENT,
      PermissionScope.LOCATION,
      PermissionScope.ORGANIZATION,
      PermissionScope.ALL,
    ];

    const index1 = scopeOrder.indexOf(scope1);
    const index2 = scopeOrder.indexOf(scope2);

    return index1 > index2 ? scope1 : scope2;
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

export async function resolveRolePermissions(
  roleId: string,
): Promise<RolePermission[]> {
  return RoleHierarchy.resolveRolePermissions(roleId);
}

export async function buildRoleHierarchy(
  organizationId: string,
): Promise<RoleNode[]> {
  return RoleHierarchy.buildHierarchy(organizationId);
}

export async function createRoleWithHierarchy(
  organizationId: string,
  userId: string,
  data: CreateRoleDto,
): Promise<any> {
  return RoleHierarchy.createRole(organizationId, userId, data);
}

export async function detectRoleConflicts(
  organizationId: string,
): Promise<RoleConflict[]> {
  return RoleHierarchy.detectConflicts(organizationId);
}

export async function getRoleDescendants(roleId: string): Promise<string[]> {
  return RoleHierarchy.getDescendants(roleId);
}

export async function isRoleAncestor(
  ancestorId: string,
  descendantId: string,
): Promise<boolean> {
  return RoleHierarchy.isAncestor(ancestorId, descendantId);
}

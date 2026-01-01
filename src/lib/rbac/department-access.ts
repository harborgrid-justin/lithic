/**
 * Department-Level Access Control System
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  DepartmentAccessLevel,
  GrantDepartmentAccessDto,
  CrossDepartmentRule,
} from "@/types/rbac";

// ============================================================================
// Department Access Management
// ============================================================================

export class DepartmentAccessControl {
  /**
   * Grant department access to a user
   */
  static async grantAccess(
    userId: string,
    grantedBy: string,
    data: GrantDepartmentAccessDto,
  ): Promise<any> {
    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Create or update department access
    const access = await prisma.departmentAccess.upsert({
      where: {
        userId_departmentId: {
          userId,
          departmentId: data.departmentId,
        },
      },
      create: {
        userId,
        departmentId: data.departmentId,
        accessLevel: data.accessLevel,
        canCrossDepartment: data.canCrossDepartment ?? false,
        allowedDepartments: data.allowedDepartments || [],
        grantedBy,
        expiresAt: data.expiresAt,
      },
      update: {
        accessLevel: data.accessLevel,
        canCrossDepartment: data.canCrossDepartment ?? false,
        allowedDepartments: data.allowedDepartments || [],
        grantedBy,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      },
    });

    // Log access grant
    await logAudit({
      userId: grantedBy,
      action: "UPDATE",
      resource: "DepartmentAccess",
      resourceId: access.id,
      description: `Granted department access to user`,
      metadata: {
        targetUserId: userId,
        departmentId: data.departmentId,
        accessLevel: data.accessLevel,
      },
      organizationId: department.organizationId,
    });

    return access;
  }

  /**
   * Revoke department access
   */
  static async revokeAccess(
    userId: string,
    departmentId: string,
    revokedBy: string,
  ): Promise<void> {
    const access = await prisma.departmentAccess.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    });

    if (!access) {
      throw new Error("Department access not found");
    }

    await prisma.departmentAccess.delete({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    });

    // Log access revocation
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    await logAudit({
      userId: revokedBy,
      action: "DELETE",
      resource: "DepartmentAccess",
      resourceId: access.id,
      description: `Revoked department access from user`,
      metadata: {
        targetUserId: userId,
        departmentId,
      },
      organizationId: department?.organizationId,
    });
  }

  /**
   * Check if user has access to a department
   */
  static async hasAccess(
    userId: string,
    departmentId: string,
    requiredLevel?: DepartmentAccessLevel,
  ): Promise<boolean> {
    const access = await prisma.departmentAccess.findFirst({
      where: {
        userId,
        OR: [
          { departmentId },
          {
            canCrossDepartment: true,
            allowedDepartments: {
              has: departmentId,
            },
          },
        ],
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });

    if (!access) {
      return false;
    }

    if (!requiredLevel) {
      return true;
    }

    // Check access level hierarchy
    const levelOrder = [
      DepartmentAccessLevel.NONE,
      DepartmentAccessLevel.LIMITED,
      DepartmentAccessLevel.READ_ONLY,
      DepartmentAccessLevel.FULL,
    ];

    const currentLevelIndex = levelOrder.indexOf(access.accessLevel);
    const requiredLevelIndex = levelOrder.indexOf(requiredLevel);

    return currentLevelIndex >= requiredLevelIndex;
  }

  /**
   * Get user's department access list
   */
  static async getUserDepartments(userId: string): Promise<any[]> {
    const accessList = await prisma.departmentAccess.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        department: true,
      },
    });

    return accessList.map((access) => ({
      departmentId: access.departmentId,
      departmentName: access.department.name,
      departmentCode: access.department.code,
      accessLevel: access.accessLevel,
      canCrossDepartment: access.canCrossDepartment,
      allowedDepartments: access.allowedDepartments,
      expiresAt: access.expiresAt,
    }));
  }

  /**
   * Get all users with access to a department
   */
  static async getDepartmentUsers(departmentId: string): Promise<any[]> {
    const accessList = await prisma.departmentAccess.findMany({
      where: {
        OR: [
          { departmentId },
          {
            canCrossDepartment: true,
            allowedDepartments: {
              has: departmentId,
            },
          },
        ],
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return accessList.map((access) => ({
      userId: access.userId,
      userName: access.user.name,
      userEmail: access.user.email,
      userRole: access.user.role?.name,
      accessLevel: access.accessLevel,
      expiresAt: access.expiresAt,
    }));
  }

  /**
   * Create cross-department access rule
   */
  static async createCrossDepartmentRule(
    data: Omit<CrossDepartmentRule, "id">,
    createdBy: string,
  ): Promise<CrossDepartmentRule> {
    const rule = await prisma.crossDepartmentRule.create({
      data: {
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
        allowedResources: data.allowedResources,
        requiresApproval: data.requiresApproval,
        autoExpireMinutes: data.autoExpireMinutes,
        reason: data.reason,
        createdBy,
      },
    });

    // Log rule creation
    const fromDept = await prisma.department.findUnique({
      where: { id: data.fromDepartmentId },
    });

    await logAudit({
      userId: createdBy,
      action: "CREATE",
      resource: "CrossDepartmentRule",
      resourceId: rule.id,
      description: `Created cross-department access rule`,
      metadata: {
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
        allowedResources: data.allowedResources,
      },
      organizationId: fromDept?.organizationId,
    });

    return rule as CrossDepartmentRule;
  }

  /**
   * Check if cross-department access is allowed
   */
  static async checkCrossDepartmentAccess(
    fromDepartmentId: string,
    toDepartmentId: string,
    resource: string,
  ): Promise<{
    allowed: boolean;
    requiresApproval: boolean;
    autoExpireMinutes: number | null;
  }> {
    const rule = await prisma.crossDepartmentRule.findFirst({
      where: {
        fromDepartmentId,
        toDepartmentId,
        allowedResources: {
          has: resource,
        },
      },
    });

    if (!rule) {
      return {
        allowed: false,
        requiresApproval: false,
        autoExpireMinutes: null,
      };
    }

    return {
      allowed: true,
      requiresApproval: rule.requiresApproval,
      autoExpireMinutes: rule.autoExpireMinutes,
    };
  }

  /**
   * Request cross-department access
   */
  static async requestCrossDepartmentAccess(
    userId: string,
    fromDepartmentId: string,
    toDepartmentId: string,
    resource: string,
    reason: string,
  ): Promise<any> {
    // Check if rule exists
    const accessCheck = await this.checkCrossDepartmentAccess(
      fromDepartmentId,
      toDepartmentId,
      resource,
    );

    if (!accessCheck.allowed) {
      throw new Error("Cross-department access not allowed for this resource");
    }

    // Create access request
    const request = await prisma.crossDepartmentAccessRequest.create({
      data: {
        userId,
        fromDepartmentId,
        toDepartmentId,
        resource,
        reason,
        status: accessCheck.requiresApproval ? "PENDING" : "APPROVED",
        autoExpireAt: accessCheck.autoExpireMinutes
          ? new Date(Date.now() + accessCheck.autoExpireMinutes * 60 * 1000)
          : null,
      },
    });

    // If no approval required, grant access immediately
    if (!accessCheck.requiresApproval) {
      await this.approveCrossDepartmentAccess(request.id, "SYSTEM");
    }

    // Log request
    const fromDept = await prisma.department.findUnique({
      where: { id: fromDepartmentId },
    });

    await logAudit({
      userId,
      action: "CREATE",
      resource: "CrossDepartmentAccessRequest",
      resourceId: request.id,
      description: `Requested cross-department access`,
      metadata: {
        fromDepartmentId,
        toDepartmentId,
        resource,
        requiresApproval: accessCheck.requiresApproval,
      },
      organizationId: fromDept?.organizationId,
    });

    return request;
  }

  /**
   * Approve cross-department access request
   */
  static async approveCrossDepartmentAccess(
    requestId: string,
    approvedBy: string,
  ): Promise<void> {
    const request = await prisma.crossDepartmentAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Access request not found");
    }

    // Update request status
    await prisma.crossDepartmentAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Grant temporary access
    const existingAccess = await prisma.departmentAccess.findUnique({
      where: {
        userId_departmentId: {
          userId: request.userId,
          departmentId: request.toDepartmentId,
        },
      },
    });

    if (existingAccess) {
      // Update allowed departments
      await prisma.departmentAccess.update({
        where: {
          userId_departmentId: {
            userId: request.userId,
            departmentId: request.toDepartmentId,
          },
        },
        data: {
          canCrossDepartment: true,
          allowedDepartments: [
            ...existingAccess.allowedDepartments,
            request.toDepartmentId,
          ],
        },
      });
    } else {
      // Create new access
      await prisma.departmentAccess.create({
        data: {
          userId: request.userId,
          departmentId: request.fromDepartmentId,
          accessLevel: DepartmentAccessLevel.LIMITED,
          canCrossDepartment: true,
          allowedDepartments: [request.toDepartmentId],
          grantedBy: approvedBy,
          expiresAt: request.autoExpireAt,
        },
      });
    }

    // Log approval
    const dept = await prisma.department.findUnique({
      where: { id: request.toDepartmentId },
    });

    await logAudit({
      userId: approvedBy,
      action: "UPDATE",
      resource: "CrossDepartmentAccessRequest",
      resourceId: requestId,
      description: `Approved cross-department access request`,
      metadata: {
        requestUserId: request.userId,
        fromDepartmentId: request.fromDepartmentId,
        toDepartmentId: request.toDepartmentId,
      },
      organizationId: dept?.organizationId,
    });
  }

  /**
   * Get department hierarchy
   */
  static async getDepartmentHierarchy(organizationId: string): Promise<any[]> {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        parentDepartment: true,
        childDepartments: true,
        location: true,
      },
    });

    // Build tree structure
    const deptMap = new Map();
    const rootDepts: any[] = [];

    for (const dept of departments) {
      deptMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        locationId: dept.locationId,
        locationName: dept.location?.name,
        managerId: dept.managerId,
        status: dept.status,
        children: [],
      });
    }

    for (const dept of departments) {
      const node = deptMap.get(dept.id);
      if (dept.parentDepartmentId) {
        const parent = deptMap.get(dept.parentDepartmentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootDepts.push(node);
      }
    }

    return rootDepts;
  }

  /**
   * Cleanup expired access grants
   */
  static async cleanupExpiredAccess(): Promise<number> {
    const result = await prisma.departmentAccess.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

export async function checkDepartmentAccess(
  userId: string,
  departmentId: string,
  allowedDepartments?: string[],
): Promise<boolean> {
  // If no specific departments required, any access is OK
  if (!allowedDepartments || allowedDepartments.length === 0) {
    return true;
  }

  // Check if user has access to any of the allowed departments
  for (const deptId of allowedDepartments) {
    const hasAccess = await DepartmentAccessControl.hasAccess(userId, deptId);
    if (hasAccess) {
      return true;
    }
  }

  return false;
}

export async function grantDepartmentAccess(
  userId: string,
  grantedBy: string,
  data: GrantDepartmentAccessDto,
): Promise<any> {
  return DepartmentAccessControl.grantAccess(userId, grantedBy, data);
}

export async function revokeDepartmentAccess(
  userId: string,
  departmentId: string,
  revokedBy: string,
): Promise<void> {
  return DepartmentAccessControl.revokeAccess(userId, departmentId, revokedBy);
}

export async function getUserDepartments(userId: string): Promise<any[]> {
  return DepartmentAccessControl.getUserDepartments(userId);
}

export async function getDepartmentUsers(departmentId: string): Promise<any[]> {
  return DepartmentAccessControl.getDepartmentUsers(departmentId);
}

export async function createCrossDepartmentRule(
  data: Omit<CrossDepartmentRule, "id">,
  createdBy: string,
): Promise<CrossDepartmentRule> {
  return DepartmentAccessControl.createCrossDepartmentRule(data, createdBy);
}

export async function requestCrossDepartmentAccess(
  userId: string,
  fromDepartmentId: string,
  toDepartmentId: string,
  resource: string,
  reason: string,
): Promise<any> {
  return DepartmentAccessControl.requestCrossDepartmentAccess(
    userId,
    fromDepartmentId,
    toDepartmentId,
    resource,
    reason,
  );
}

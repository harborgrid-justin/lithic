/**
 * Core Permission Evaluation Engine
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  PermissionContext,
  PermissionEvaluationResult,
  PermissionScope,
  PermissionAction,
  PolicyEffect,
  EvaluatedCondition,
} from "@/types/rbac";
import { checkDepartmentAccess } from "./department-access";
import { checkLocationAccess } from "./location-access";
import { checkTimeRestrictions } from "./time-restrictions";
import { resolveRolePermissions } from "./role-hierarchy";

// ============================================================================
// Permission Cache
// ============================================================================

interface CacheEntry {
  result: PermissionEvaluationResult;
  expiresAt: number;
}

class PermissionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  generateKey(context: PermissionContext): string {
    return `${context.userId}:${context.resource}:${context.action}:${
      context.resourceId || ""
    }:${context.departmentId || ""}:${context.locationId || ""}`;
  }

  get(key: string): PermissionEvaluationResult | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.result;
  }

  set(key: string, result: PermissionEvaluationResult): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.TTL,
    });
  }

  invalidate(userId: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const permissionCache = new PermissionCache();

// Run cleanup every 5 minutes
setInterval(() => permissionCache.cleanup(), 5 * 60 * 1000);

// ============================================================================
// Core Permission Engine
// ============================================================================

export class PermissionEngine {
  /**
   * Main entry point for permission evaluation
   */
  static async evaluate(
    context: PermissionContext,
  ): Promise<PermissionEvaluationResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = permissionCache.generateKey(context);
    const cached = permissionCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        cacheKey,
        evaluationTime: Date.now() - startTime,
      };
    }

    try {
      // Load user with all access data
      const user = await this.loadUserContext(context.userId);
      if (!user) {
        return this.denyAccess("User not found", cacheKey, startTime);
      }

      // Check if user is active
      if (user.status !== "ACTIVE") {
        return this.denyAccess(
          `User account is ${user.status}`,
          cacheKey,
          startTime,
        );
      }

      // Super admin bypass
      if (user.role?.name === "SUPER_ADMIN") {
        return this.allowAccess("Super admin access", [], cacheKey, startTime);
      }

      // Evaluate in order of precedence
      const evaluationSteps = [
        () => this.checkExplicitDeny(context, user),
        () => this.checkBreakGlassAccess(context, user),
        () => this.checkRolePermissions(context, user),
        () => this.checkCustomPermissions(context, user),
        () => this.checkTemporaryGrants(context, user),
        () => this.checkPolicies(context, user),
      ];

      for (const step of evaluationSteps) {
        const result = await step();
        if (result) {
          // Cache successful evaluations
          if (result.allowed) {
            permissionCache.set(cacheKey, result);
          }
          return {
            ...result,
            cacheKey,
            evaluationTime: Date.now() - startTime,
          };
        }
      }

      // Default deny
      const denialResult = this.denyAccess(
        "No matching permission found",
        cacheKey,
        startTime,
      );

      // Log access denial
      await this.logAccessAttempt(context, denialResult, user);

      return denialResult;
    } catch (error) {
      console.error("Permission evaluation error:", error);
      return this.denyAccess(
        "Permission evaluation failed",
        cacheKey,
        startTime,
      );
    }
  }

  /**
   * Batch evaluate multiple permissions
   */
  static async evaluateBatch(
    contexts: PermissionContext[],
  ): Promise<PermissionEvaluationResult[]> {
    return Promise.all(contexts.map((ctx) => this.evaluate(ctx)));
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
  ): Promise<boolean> {
    const results = await Promise.all(
      permissions.map((perm) =>
        this.evaluate({
          userId,
          organizationId: "", // Will be filled from user context
          resource: perm.resource,
          action: perm.action,
        }),
      ),
    );

    return results.some((r) => r.allowed);
  }

  /**
   * Check if user has all specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissions: Array<{ resource: string; action: string }>,
  ): Promise<boolean> {
    const results = await Promise.all(
      permissions.map((perm) =>
        this.evaluate({
          userId,
          organizationId: "",
          resource: perm.resource,
          action: perm.action,
        }),
      ),
    );

    return results.every((r) => r.allowed);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static async loadUserContext(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        customPermissions: true,
        departmentAccess: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        },
        locationAccess: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
          },
        },
        breakGlassRequests: {
          where: {
            status: "ACTIVE",
            expiresAt: { gte: new Date() },
          },
        },
      },
    });
  }

  private static async checkExplicitDeny(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    // Check for explicit deny policies
    const denyPolicies = await prisma.accessPolicy.findMany({
      where: {
        organizationId: context.organizationId,
        enabled: true,
        effect: "DENY",
        rules: {
          some: {
            resource: {
              in: [context.resource, "*"],
            },
            actions: {
              hasSome: [context.action, "*"],
            },
          },
        },
      },
    });

    for (const policy of denyPolicies) {
      const matches = await this.evaluatePolicy(policy, context, user);
      if (matches) {
        return {
          allowed: false,
          reason: `Denied by policy: ${policy.name}`,
          deniedBy: policy.id,
          matchedPolicies: [policy.id],
          conditions: [],
        };
      }
    }

    return null;
  }

  private static async checkBreakGlassAccess(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    const activeBreakGlass = user.breakGlassRequests?.find(
      (bg: any) =>
        bg.resource === context.resource &&
        bg.action === context.action &&
        bg.status === "ACTIVE",
    );

    if (activeBreakGlass) {
      // Log break-glass access
      await logAudit({
        userId: user.id,
        action: "EMERGENCY_ACCESS",
        resource: context.resource,
        resourceId: context.resourceId,
        description: `Break-glass access: ${activeBreakGlass.reason}`,
        metadata: {
          breakGlassId: activeBreakGlass.id,
          justification: activeBreakGlass.justification,
        },
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        isPHIAccess: true,
      });

      return {
        allowed: true,
        reason: "Break-glass emergency access granted",
        matchedPolicies: [`break-glass:${activeBreakGlass.id}`],
        conditions: [
          {
            type: "break-glass",
            satisfied: true,
            details: `Emergency access expires at ${activeBreakGlass.expiresAt}`,
          },
        ],
      };
    }

    return null;
  }

  private static async checkRolePermissions(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    if (!user.role) {
      return null;
    }

    // Get all permissions including inherited ones
    const allPermissions = await resolveRolePermissions(user.role.id);

    for (const permission of allPermissions) {
      if (this.matchesPermission(permission, context)) {
        // Evaluate conditions
        const conditions = await this.evaluateConditions(
          permission,
          context,
          user,
        );

        const allConditionsSatisfied = conditions.every((c) => c.satisfied);

        if (allConditionsSatisfied) {
          return {
            allowed: true,
            reason: `Granted by role: ${user.role.name}`,
            matchedPolicies: [`role:${user.role.id}`],
            conditions,
          };
        }
      }
    }

    return null;
  }

  private static async checkCustomPermissions(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    const customPermissions = user.customPermissions || [];

    for (const permission of customPermissions) {
      if (this.matchesPermission(permission, context)) {
        const conditions = await this.evaluateConditions(
          permission,
          context,
          user,
        );

        const allConditionsSatisfied = conditions.every((c) => c.satisfied);

        if (allConditionsSatisfied) {
          return {
            allowed: true,
            reason: "Granted by custom permission",
            matchedPolicies: [`custom:${permission.id}`],
            conditions,
          };
        }
      }
    }

    return null;
  }

  private static async checkTemporaryGrants(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    const activeGrants = await prisma.accessGrant.findMany({
      where: {
        userId: user.id,
        resource: context.resource,
        resourceId: context.resourceId,
        action: context.action,
        expiresAt: { gte: new Date() },
        revokedAt: null,
      },
    });

    if (activeGrants.length > 0) {
      const grant = activeGrants[0];
      return {
        allowed: true,
        reason: `Temporary access grant: ${grant.reason || "No reason provided"}`,
        matchedPolicies: [`grant:${grant.id}`],
        conditions: [
          {
            type: "temporary-grant",
            satisfied: true,
            details: `Access expires at ${grant.expiresAt}`,
          },
        ],
      };
    }

    return null;
  }

  private static async checkPolicies(
    context: PermissionContext,
    user: any,
  ): Promise<PermissionEvaluationResult | null> {
    const policies = await prisma.accessPolicy.findMany({
      where: {
        organizationId: context.organizationId,
        enabled: true,
        effect: { in: ["ALLOW", "REQUIRE_MFA", "REQUIRE_APPROVAL"] },
      },
      orderBy: { priority: "asc" },
    });

    for (const policy of policies) {
      const matches = await this.evaluatePolicy(policy, context, user);
      if (matches) {
        return {
          allowed: policy.effect === "ALLOW",
          reason: `Matched policy: ${policy.name}`,
          matchedPolicies: [policy.id],
          requiresMFA: policy.effect === "REQUIRE_MFA",
          requiresApproval: policy.effect === "REQUIRE_APPROVAL",
          conditions: [],
        };
      }
    }

    return null;
  }

  private static matchesPermission(
    permission: any,
    context: PermissionContext,
  ): boolean {
    // Check resource match
    const resourceMatch =
      permission.resource === context.resource ||
      permission.resource === "*" ||
      context.resource.startsWith(permission.resource.replace(".*", ""));

    // Check action match
    const actionMatch =
      permission.action === context.action ||
      permission.action === "*" ||
      permission.action === "admin";

    return resourceMatch && actionMatch;
  }

  private static async evaluateConditions(
    permission: any,
    context: PermissionContext,
    user: any,
  ): Promise<EvaluatedCondition[]> {
    const conditions: EvaluatedCondition[] = [];

    // Scope check
    const scopeCheck = await this.checkScope(permission.scope, context, user);
    conditions.push(scopeCheck);

    if (!permission.conditions) {
      return conditions;
    }

    // Department restrictions
    if (permission.conditions.departments) {
      const deptCheck = await checkDepartmentAccess(
        user.id,
        context.departmentId || user.departmentId,
        permission.conditions.departments,
      );
      conditions.push({
        type: "department",
        satisfied: deptCheck,
        details: deptCheck
          ? "Department access allowed"
          : "Department access denied",
      });
    }

    // Location restrictions
    if (permission.conditions.locations) {
      const locCheck = await checkLocationAccess(
        user.id,
        context.locationId || user.locationId,
        context.ipAddress,
        permission.conditions.locations,
      );
      conditions.push({
        type: "location",
        satisfied: locCheck,
        details: locCheck
          ? "Location access allowed"
          : "Location access denied",
      });
    }

    // Time restrictions
    if (permission.conditions.timeRestrictions) {
      const timeCheck = await checkTimeRestrictions(
        permission.conditions.timeRestrictions,
        context.timestamp || new Date(),
      );
      conditions.push({
        type: "time",
        satisfied: timeCheck,
        details: timeCheck
          ? "Within allowed time window"
          : "Outside allowed time window",
      });
    }

    return conditions;
  }

  private static async checkScope(
    scope: PermissionScope,
    context: PermissionContext,
    user: any,
  ): Promise<EvaluatedCondition> {
    switch (scope) {
      case PermissionScope.ALL:
        return {
          type: "scope",
          satisfied: true,
          details: "All scope - no restrictions",
        };

      case PermissionScope.ORGANIZATION:
        const orgMatch = user.organizationId === context.organizationId;
        return {
          type: "scope",
          satisfied: orgMatch,
          details: orgMatch
            ? "Organization scope matched"
            : "Organization scope mismatch",
        };

      case PermissionScope.DEPARTMENT:
        return {
          type: "scope",
          satisfied: true,
          details: "Department scope - requires department check",
        };

      case PermissionScope.LOCATION:
        return {
          type: "scope",
          satisfied: true,
          details: "Location scope - requires location check",
        };

      case PermissionScope.OWN:
        const isOwn = context.resourceId === user.id;
        return {
          type: "scope",
          satisfied: isOwn,
          details: isOwn
            ? "Own scope - user owns resource"
            : "Own scope - user does not own resource",
        };

      default:
        return {
          type: "scope",
          satisfied: false,
          details: "Unknown scope",
        };
    }
  }

  private static async evaluatePolicy(
    policy: any,
    context: PermissionContext,
    user: any,
  ): Promise<boolean> {
    // Simple policy evaluation - can be extended with complex rule engine
    for (const rule of policy.rules) {
      const resourceMatch =
        rule.resource === context.resource ||
        rule.resource === "*" ||
        context.resource.startsWith(rule.resource.replace(".*", ""));

      const actionMatch =
        rule.actions.includes(context.action) || rule.actions.includes("*");

      if (resourceMatch && actionMatch) {
        return true;
      }
    }

    return false;
  }

  private static async logAccessAttempt(
    context: PermissionContext,
    result: PermissionEvaluationResult,
    user: any,
  ): Promise<void> {
    await logAudit({
      userId: context.userId,
      action: result.allowed ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      resource: context.resource,
      resourceId: context.resourceId,
      description: result.reason,
      metadata: {
        action: context.action,
        matchedPolicies: result.matchedPolicies,
        conditions: result.conditions,
      },
      organizationId: context.organizationId,
      ipAddress: context.ipAddress,
    });
  }

  private static allowAccess(
    reason: string,
    matchedPolicies: string[],
    cacheKey: string,
    startTime: number,
  ): PermissionEvaluationResult {
    return {
      allowed: true,
      reason,
      matchedPolicies,
      conditions: [],
      cacheKey,
      evaluationTime: Date.now() - startTime,
    };
  }

  private static denyAccess(
    reason: string,
    cacheKey: string,
    startTime: number,
  ): PermissionEvaluationResult {
    return {
      allowed: false,
      reason,
      matchedPolicies: [],
      conditions: [],
      cacheKey,
      evaluationTime: Date.now() - startTime,
    };
  }

  /**
   * Invalidate cache for a user
   */
  static invalidateCache(userId: string): void {
    permissionCache.invalidate(userId);
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    permissionCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return permissionCache.getStats();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function checkPermission(
  context: PermissionContext,
): Promise<boolean> {
  const result = await PermissionEngine.evaluate(context);
  return result.allowed;
}

export async function requirePermission(
  context: PermissionContext,
): Promise<PermissionEvaluationResult> {
  const result = await PermissionEngine.evaluate(context);
  if (!result.allowed) {
    throw new Error(`Permission denied: ${result.reason}`);
  }
  return result;
}

export async function checkMultiplePermissions(
  userId: string,
  permissions: Array<{ resource: string; action: string }>,
): Promise<Record<string, boolean>> {
  const results = await Promise.all(
    permissions.map(async (perm) => {
      const result = await PermissionEngine.evaluate({
        userId,
        organizationId: "",
        resource: perm.resource,
        action: perm.action,
      });
      return [perm.resource, result.allowed] as const;
    }),
  );

  return Object.fromEntries(results);
}

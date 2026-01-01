/**
 * Enterprise Access Control Engine
 * Supports RBAC, ABAC, and Hybrid access control models
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  AccessControlMode,
  AccessControlPolicy,
  PermissionEffect,
  PolicyCondition,
  ConditionType,
  ConditionOperator,
  BreakGlassAccess,
  BreakGlassStatus,
} from "@/types/security";

// ============================================================================
// Interfaces
// ============================================================================

export interface AccessContext {
  userId: string;
  organizationId: string;
  resource: string;
  resourceId?: string;
  action: string;
  attributes?: Record<string, any>;
  environment?: EnvironmentContext;
  sessionId?: string;
}

export interface EnvironmentContext {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  timestamp?: Date;
  mfaVerified?: boolean;
  riskScore?: number;
  timeOfDay?: number;
  dayOfWeek?: number;
  departmentId?: string;
  locationId?: string;
}

export interface AccessDecision {
  allowed: boolean;
  effect: PermissionEffect;
  reason: string;
  matchedPolicies: string[];
  evaluatedConditions: EvaluatedCondition[];
  requiresMFA?: boolean;
  requiresApproval?: boolean;
  approvalWorkflow?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface EvaluatedCondition {
  type: string;
  satisfied: boolean;
  details: string;
  value?: any;
}

// ============================================================================
// Access Control Engine
// ============================================================================

export class AccessControlEngine {
  /**
   * Main access control evaluation
   */
  static async evaluate(context: AccessContext): Promise<AccessDecision> {
    const startTime = Date.now();

    try {
      // Load user and policies
      const [user, policies] = await Promise.all([
        this.loadUserContext(context.userId),
        this.loadApplicablePolicies(context),
      ]);

      if (!user) {
        return this.deny("User not found");
      }

      if (user.status !== "ACTIVE") {
        return this.deny(`Account is ${user.status}`);
      }

      // Check for active break-glass access
      const breakGlass = await this.checkBreakGlass(context, user);
      if (breakGlass.allowed) {
        await this.logAccess(context, breakGlass, Date.now() - startTime);
        return breakGlass;
      }

      // Super admin override
      if (user.role?.name === "SUPER_ADMIN") {
        const decision = this.allow("Super admin access", ["super-admin"]);
        await this.logAccess(context, decision, Date.now() - startTime);
        return decision;
      }

      // Evaluate RBAC first
      const rbacDecision = await this.evaluateRBAC(context, user);
      if (rbacDecision.effect === PermissionEffect.DENY) {
        await this.logAccess(context, rbacDecision, Date.now() - startTime);
        return rbacDecision;
      }

      // Evaluate ABAC policies
      const abacDecision = await this.evaluateABAC(context, user, policies);
      if (abacDecision.effect === PermissionEffect.DENY) {
        await this.logAccess(context, abacDecision, Date.now() - startTime);
        return abacDecision;
      }

      // Combine decisions
      const finalDecision = this.combineDecisions(rbacDecision, abacDecision);
      await this.logAccess(context, finalDecision, Date.now() - startTime);

      return finalDecision;
    } catch (error) {
      console.error("Access control evaluation error:", error);
      return this.deny("Access evaluation failed");
    }
  }

  /**
   * RBAC Evaluation
   */
  private static async evaluateRBAC(
    context: AccessContext,
    user: any,
  ): Promise<AccessDecision> {
    if (!user.role) {
      return this.deny("No role assigned");
    }

    // Get role permissions including inherited
    const permissions = await this.getRolePermissions(user.role.id);

    // Check if any permission matches
    for (const permission of permissions) {
      if (this.matchesPermission(permission, context)) {
        // Evaluate permission conditions
        const conditions = await this.evaluatePermissionConditions(
          permission,
          context,
          user,
        );

        if (conditions.every((c) => c.satisfied)) {
          return {
            allowed: true,
            effect: PermissionEffect.ALLOW,
            reason: `Granted by role: ${user.role.name}`,
            matchedPolicies: [`role:${user.role.id}`],
            evaluatedConditions: conditions,
          };
        }
      }
    }

    return {
      allowed: false,
      effect: PermissionEffect.DENY,
      reason: "No matching role permission",
      matchedPolicies: [],
      evaluatedConditions: [],
    };
  }

  /**
   * ABAC Evaluation
   */
  private static async evaluateABAC(
    context: AccessContext,
    user: any,
    policies: any[],
  ): Promise<AccessDecision> {
    // Sort by priority
    const sortedPolicies = policies.sort((a, b) => a.priority - b.priority);

    for (const policy of sortedPolicies) {
      const evaluation = await this.evaluatePolicy(policy, context, user);

      if (evaluation.matches) {
        // DENY always wins
        if (policy.effect === PermissionEffect.DENY) {
          return {
            allowed: false,
            effect: PermissionEffect.DENY,
            reason: `Denied by policy: ${policy.name}`,
            matchedPolicies: [policy.id],
            evaluatedConditions: evaluation.conditions,
          };
        }

        // ALLOW or conditional
        if (evaluation.allConditionsMet) {
          return {
            allowed: policy.effect === PermissionEffect.ALLOW,
            effect: policy.effect,
            reason: `Matched policy: ${policy.name}`,
            matchedPolicies: [policy.id],
            evaluatedConditions: evaluation.conditions,
            requiresMFA: policy.effect === PermissionEffect.REQUIRE_MFA,
            requiresApproval:
              policy.effect === PermissionEffect.REQUIRE_APPROVAL,
          };
        }
      }
    }

    return {
      allowed: false,
      effect: PermissionEffect.DENY,
      reason: "No matching ABAC policy",
      matchedPolicies: [],
      evaluatedConditions: [],
    };
  }

  /**
   * Evaluate a single policy
   */
  private static async evaluatePolicy(
    policy: any,
    context: AccessContext,
    user: any,
  ): Promise<{ matches: boolean; allConditionsMet: boolean; conditions: EvaluatedCondition[] }> {
    const conditions: EvaluatedCondition[] = [];
    let matches = false;

    // Check if policy applies to this resource/action
    for (const rule of policy.rules) {
      const resourceMatch =
        rule.resource === context.resource ||
        rule.resource === "*" ||
        context.resource.startsWith(rule.resource.replace(".*", ""));

      const actionMatch =
        rule.actions.includes(context.action) ||
        rule.actions.includes("*");

      if (resourceMatch && actionMatch) {
        matches = true;
        break;
      }
    }

    if (!matches) {
      return { matches: false, allConditionsMet: false, conditions: [] };
    }

    // Evaluate conditions
    for (const condition of policy.conditions || []) {
      const evaluated = await this.evaluateCondition(condition, context, user);
      conditions.push(evaluated);
    }

    const allConditionsMet = conditions.every((c) => c.satisfied);

    return { matches, allConditionsMet, conditions };
  }

  /**
   * Evaluate a single condition
   */
  private static async evaluateCondition(
    condition: PolicyCondition,
    context: AccessContext,
    user: any,
  ): Promise<EvaluatedCondition> {
    switch (condition.type) {
      case ConditionType.TIME_BASED:
        return this.evaluateTimeCondition(condition, context);

      case ConditionType.LOCATION_BASED:
        return this.evaluateLocationCondition(condition, context, user);

      case ConditionType.DEPARTMENT_BASED:
        return this.evaluateDepartmentCondition(condition, context, user);

      case ConditionType.IP_BASED:
        return this.evaluateIPCondition(condition, context);

      case ConditionType.DEVICE_BASED:
        return this.evaluateDeviceCondition(condition, context);

      case ConditionType.RISK_SCORE:
        return this.evaluateRiskScoreCondition(condition, context);

      case ConditionType.MFA_VERIFIED:
        return this.evaluateMFACondition(condition, context);

      case ConditionType.RELATIONSHIP:
        return this.evaluateRelationshipCondition(
          condition,
          context,
          user,
        );

      default:
        return {
          type: "unknown",
          satisfied: false,
          details: `Unknown condition type: ${condition.type}`,
        };
    }
  }

  /**
   * Time-based condition evaluation
   */
  private static evaluateTimeCondition(
    condition: PolicyCondition,
    context: AccessContext,
  ): EvaluatedCondition {
    const now = context.environment?.timestamp || new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (condition.attributes?.allowedHours) {
      const allowed = condition.attributes.allowedHours as number[];
      const satisfied = allowed.includes(hour);
      return {
        type: "time",
        satisfied,
        details: satisfied
          ? `Access allowed at hour ${hour}`
          : `Access not allowed at hour ${hour}`,
        value: hour,
      };
    }

    if (condition.attributes?.allowedDays) {
      const allowed = condition.attributes.allowedDays as number[];
      const satisfied = allowed.includes(day);
      return {
        type: "time",
        satisfied,
        details: satisfied
          ? `Access allowed on day ${day}`
          : `Access not allowed on day ${day}`,
        value: day,
      };
    }

    return {
      type: "time",
      satisfied: true,
      details: "No time restrictions",
    };
  }

  /**
   * Location-based condition evaluation
   */
  private static evaluateLocationCondition(
    condition: PolicyCondition,
    context: AccessContext,
    user: any,
  ): EvaluatedCondition {
    const userLocation = context.environment?.location;

    if (!userLocation) {
      return {
        type: "location",
        satisfied: false,
        details: "Location unknown",
      };
    }

    if (condition.attributes?.allowedCountries) {
      const allowed = condition.attributes.allowedCountries as string[];
      const satisfied = allowed.includes(userLocation.country || "");
      return {
        type: "location",
        satisfied,
        details: satisfied
          ? `Country ${userLocation.country} allowed`
          : `Country ${userLocation.country} not allowed`,
        value: userLocation.country,
      };
    }

    return {
      type: "location",
      satisfied: true,
      details: "No location restrictions",
    };
  }

  /**
   * Department-based condition evaluation
   */
  private static evaluateDepartmentCondition(
    condition: PolicyCondition,
    context: AccessContext,
    user: any,
  ): EvaluatedCondition {
    const userDepartment =
      context.environment?.departmentId || user.departmentId;

    if (condition.attributes?.allowedDepartments) {
      const allowed = condition.attributes.allowedDepartments as string[];
      const satisfied = allowed.includes(userDepartment);
      return {
        type: "department",
        satisfied,
        details: satisfied
          ? "Department access allowed"
          : "Department access denied",
        value: userDepartment,
      };
    }

    return {
      type: "department",
      satisfied: true,
      details: "No department restrictions",
    };
  }

  /**
   * IP-based condition evaluation
   */
  private static evaluateIPCondition(
    condition: PolicyCondition,
    context: AccessContext,
  ): EvaluatedCondition {
    const ip = context.environment?.ipAddress;

    if (!ip) {
      return {
        type: "ip",
        satisfied: false,
        details: "IP address unknown",
      };
    }

    if (condition.attributes?.allowedIPs) {
      const allowed = condition.attributes.allowedIPs as string[];
      const satisfied = allowed.some((allowedIP) =>
        this.matchesIPPattern(ip, allowedIP),
      );
      return {
        type: "ip",
        satisfied,
        details: satisfied ? `IP ${ip} allowed` : `IP ${ip} not allowed`,
        value: ip,
      };
    }

    if (condition.attributes?.blockedIPs) {
      const blocked = condition.attributes.blockedIPs as string[];
      const satisfied = !blocked.some((blockedIP) =>
        this.matchesIPPattern(ip, blockedIP),
      );
      return {
        type: "ip",
        satisfied,
        details: satisfied ? `IP ${ip} not blocked` : `IP ${ip} blocked`,
        value: ip,
      };
    }

    return {
      type: "ip",
      satisfied: true,
      details: "No IP restrictions",
    };
  }

  /**
   * Device-based condition evaluation
   */
  private static evaluateDeviceCondition(
    condition: PolicyCondition,
    context: AccessContext,
  ): EvaluatedCondition {
    const deviceId = context.environment?.deviceId;

    if (!deviceId) {
      return {
        type: "device",
        satisfied: condition.attributes?.requireTrustedDevice !== true,
        details: "Device unknown",
      };
    }

    if (condition.attributes?.allowedDevices) {
      const allowed = condition.attributes.allowedDevices as string[];
      const satisfied = allowed.includes(deviceId);
      return {
        type: "device",
        satisfied,
        details: satisfied ? "Device allowed" : "Device not allowed",
        value: deviceId,
      };
    }

    return {
      type: "device",
      satisfied: true,
      details: "No device restrictions",
    };
  }

  /**
   * Risk score condition evaluation
   */
  private static evaluateRiskScoreCondition(
    condition: PolicyCondition,
    context: AccessContext,
  ): EvaluatedCondition {
    const riskScore = context.environment?.riskScore || 0;
    const threshold = (condition.value as number) || 50;

    const satisfied =
      condition.operator === ConditionOperator.LESS_THAN
        ? riskScore < threshold
        : riskScore <= threshold;

    return {
      type: "risk",
      satisfied,
      details: satisfied
        ? `Risk score ${riskScore} within acceptable range`
        : `Risk score ${riskScore} exceeds threshold ${threshold}`,
      value: riskScore,
    };
  }

  /**
   * MFA verification condition evaluation
   */
  private static evaluateMFACondition(
    condition: PolicyCondition,
    context: AccessContext,
  ): EvaluatedCondition {
    const mfaVerified = context.environment?.mfaVerified || false;
    const required = condition.value as boolean;

    const satisfied = !required || mfaVerified;

    return {
      type: "mfa",
      satisfied,
      details: satisfied ? "MFA verification satisfied" : "MFA required",
      value: mfaVerified,
    };
  }

  /**
   * Relationship condition evaluation (e.g., patient's provider)
   */
  private static async evaluateRelationshipCondition(
    condition: PolicyCondition,
    context: AccessContext,
    user: any,
  ): Promise<EvaluatedCondition> {
    // This would check database relationships
    // For example: Is this user the patient's primary provider?
    const relationshipType = condition.attributes?.type;

    if (relationshipType === "PRIMARY_PROVIDER") {
      // Check if user is primary provider for the resource (patient)
      const patient = await prisma.patient.findFirst({
        where: {
          id: context.resourceId,
          primaryCareProvider: user.id,
        },
      });

      return {
        type: "relationship",
        satisfied: !!patient,
        details: patient
          ? "User is primary provider"
          : "User is not primary provider",
      };
    }

    return {
      type: "relationship",
      satisfied: true,
      details: "No relationship restrictions",
    };
  }

  /**
   * Break-glass access check
   */
  private static async checkBreakGlass(
    context: AccessContext,
    user: any,
  ): Promise<AccessDecision> {
    const activeBreakGlass = await prisma.breakGlassAccess.findFirst({
      where: {
        userId: user.id,
        resource: context.resource,
        status: BreakGlassStatus.ACTIVE,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (activeBreakGlass) {
      return {
        allowed: true,
        effect: PermissionEffect.ALLOW,
        reason: `Emergency break-glass access: ${activeBreakGlass.reason}`,
        matchedPolicies: [`break-glass:${activeBreakGlass.id}`],
        evaluatedConditions: [
          {
            type: "break-glass",
            satisfied: true,
            details: `Emergency access expires at ${activeBreakGlass.expiresAt}`,
          },
        ],
        expiresAt: activeBreakGlass.expiresAt,
      };
    }

    return this.deny("");
  }

  /**
   * Helper: Load user context
   */
  private static async loadUserContext(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
        organization: true,
      },
    });
  }

  /**
   * Helper: Load applicable policies
   */
  private static async loadApplicablePolicies(context: AccessContext) {
    return prisma.accessPolicy.findMany({
      where: {
        organizationId: context.organizationId,
        enabled: true,
      },
      include: {
        conditions: true,
        rules: true,
      },
      orderBy: {
        priority: "asc",
      },
    });
  }

  /**
   * Helper: Get role permissions including inherited
   */
  private static async getRolePermissions(roleId: string) {
    // This would traverse role hierarchy
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });

    return role?.permissions || [];
  }

  /**
   * Helper: Check if permission matches context
   */
  private static matchesPermission(permission: any, context: AccessContext): boolean {
    const resourceMatch =
      permission.resource === context.resource ||
      permission.resource === "*" ||
      context.resource.startsWith(permission.resource.replace(".*", ""));

    const actionMatch =
      permission.action === context.action ||
      permission.action === "*" ||
      permission.action === "admin";

    return resourceMatch && actionMatch;
  }

  /**
   * Helper: Evaluate permission conditions
   */
  private static async evaluatePermissionConditions(
    permission: any,
    context: AccessContext,
    user: any,
  ): Promise<EvaluatedCondition[]> {
    const conditions: EvaluatedCondition[] = [];

    // Add standard condition checks here
    // Similar to policy condition evaluation

    return conditions;
  }

  /**
   * Helper: Combine RBAC and ABAC decisions
   */
  private static combineDecisions(
    rbac: AccessDecision,
    abac: AccessDecision,
  ): AccessDecision {
    // DENY always wins
    if (rbac.effect === PermissionEffect.DENY || abac.effect === PermissionEffect.DENY) {
      return rbac.effect === PermissionEffect.DENY ? rbac : abac;
    }

    // If both allow, take the more restrictive
    if (rbac.allowed && abac.allowed) {
      if (abac.requiresMFA || abac.requiresApproval) {
        return abac;
      }
      return rbac;
    }

    // If one allows, use that
    if (rbac.allowed) return rbac;
    if (abac.allowed) return abac;

    // Both deny
    return this.deny("Access denied by policy");
  }

  /**
   * Helper: Match IP pattern (supports CIDR)
   */
  private static matchesIPPattern(ip: string, pattern: string): boolean {
    // Simple implementation - would need proper CIDR matching
    if (pattern.includes("/")) {
      // CIDR notation
      return ip.startsWith(pattern.split("/")[0].split(".").slice(0, 3).join("."));
    }
    return ip === pattern || pattern === "*";
  }

  /**
   * Helper: Log access decision
   */
  private static async logAccess(
    context: AccessContext,
    decision: AccessDecision,
    evaluationTime: number,
  ): Promise<void> {
    await logAudit({
      userId: context.userId,
      action: decision.allowed ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      resource: context.resource,
      resourceId: context.resourceId,
      description: decision.reason,
      metadata: {
        action: context.action,
        matchedPolicies: decision.matchedPolicies,
        conditions: decision.evaluatedConditions,
        evaluationTime,
        requiresMFA: decision.requiresMFA,
        requiresApproval: decision.requiresApproval,
      },
      organizationId: context.organizationId,
      ipAddress: context.environment?.ipAddress,
      sessionId: context.sessionId,
    });
  }

  /**
   * Helper: Create allow decision
   */
  private static allow(reason: string, policies: string[]): AccessDecision {
    return {
      allowed: true,
      effect: PermissionEffect.ALLOW,
      reason,
      matchedPolicies: policies,
      evaluatedConditions: [],
    };
  }

  /**
   * Helper: Create deny decision
   */
  private static deny(reason: string): AccessDecision {
    return {
      allowed: false,
      effect: PermissionEffect.DENY,
      reason: reason || "Access denied",
      matchedPolicies: [],
      evaluatedConditions: [],
    };
  }
}

/**
 * Request break-glass emergency access
 */
export async function requestBreakGlassAccess(params: {
  userId: string;
  resource: string;
  resourceId: string;
  action: string;
  reason: string;
  justification: string;
  durationMinutes?: number;
}): Promise<BreakGlassAccess> {
  const expiresAt = new Date(
    Date.now() + (params.durationMinutes || 60) * 60 * 1000,
  );

  const breakGlass = await prisma.breakGlassAccess.create({
    data: {
      userId: params.userId,
      resource: params.resource,
      resourceId: params.resourceId,
      action: params.action,
      reason: params.reason,
      justification: params.justification,
      status: BreakGlassStatus.ACTIVE,
      expiresAt,
      auditTrail: [
        {
          timestamp: new Date(),
          action: "REQUESTED",
          performedBy: params.userId,
          details: params.justification,
        },
      ],
    },
  });

  // Log break-glass activation
  await logAudit({
    userId: params.userId,
    action: "BREAK_GLASS_ACTIVATED",
    resource: params.resource,
    resourceId: params.resourceId,
    description: `Emergency access requested: ${params.reason}`,
    metadata: {
      justification: params.justification,
      expiresAt,
    },
    organizationId: "", // Would be filled from user context
    isPHIAccess: true,
  });

  return breakGlass as BreakGlassAccess;
}

/**
 * Revoke break-glass access
 */
export async function revokeBreakGlassAccess(
  breakGlassId: string,
  revokedBy: string,
  reason: string,
): Promise<void> {
  await prisma.breakGlassAccess.update({
    where: { id: breakGlassId },
    data: {
      status: BreakGlassStatus.REVOKED,
      auditTrail: {
        push: {
          timestamp: new Date(),
          action: "REVOKED",
          performedBy: revokedBy,
          details: reason,
        },
      },
    },
  });

  await logAudit({
    userId: revokedBy,
    action: "BREAK_GLASS_REVOKED",
    resource: "BreakGlassAccess",
    resourceId: breakGlassId,
    description: `Emergency access revoked: ${reason}`,
    metadata: { reason },
    organizationId: "",
  });
}

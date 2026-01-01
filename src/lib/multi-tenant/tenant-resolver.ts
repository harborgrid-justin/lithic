/**
 * Tenant Resolution Service
 * Detects and manages the current tenant context for multi-organization access
 */

import {
  OrganizationContext,
  DataAccessScope,
  Organization,
  Facility,
  Department,
} from "@/types/enterprise";
import { organizationService } from "@/lib/services/organization-service";

export class TenantResolver {
  private currentContext: OrganizationContext | null = null;

  /**
   * Resolve tenant context from user session and optional overrides
   */
  async resolveContext(
    userId: string,
    organizationId?: string,
    facilityId?: string,
    departmentId?: string,
  ): Promise<OrganizationContext> {
    // Get user's primary organization if not specified
    const targetOrgId =
      organizationId || (await this.getUserPrimaryOrganization(userId));

    if (!targetOrgId) {
      throw new Error("Unable to resolve organization context");
    }

    const organization = await organizationService.getOrganization(targetOrgId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    let facility: Facility | null = null;
    let department: Department | null = null;

    if (facilityId) {
      facility = await organizationService.getFacility(facilityId);
      if (facility && facility.organizationId !== targetOrgId) {
        throw new Error(
          "Facility does not belong to the specified organization",
        );
      }
    }

    if (departmentId) {
      department = await organizationService.getDepartment(departmentId);
      if (department && (!facility || department.facilityId !== facility.id)) {
        throw new Error("Department does not belong to the specified facility");
      }
    }

    const permissions = await this.getUserPermissions(userId, targetOrgId);
    const dataAccessScope = await this.getDataAccessScope(userId, targetOrgId);

    this.currentContext = {
      organizationId: targetOrgId,
      organization,
      facilityId: facility?.id || null,
      facility,
      departmentId: department?.id || null,
      department,
      permissions,
      dataAccessScope,
    };

    return this.currentContext;
  }

  /**
   * Get current tenant context
   */
  getCurrentContext(): OrganizationContext | null {
    return this.currentContext;
  }

  /**
   * Switch to a different organization context
   */
  async switchContext(
    userId: string,
    organizationId: string,
    facilityId?: string,
    departmentId?: string,
  ): Promise<OrganizationContext> {
    // Verify user has access to the target organization
    const hasAccess = await this.verifyOrganizationAccess(
      userId,
      organizationId,
    );
    if (!hasAccess) {
      throw new Error("Access denied to the specified organization");
    }

    return this.resolveContext(
      userId,
      organizationId,
      facilityId,
      departmentId,
    );
  }

  /**
   * Get all organizations accessible by a user
   */
  async getAccessibleOrganizations(userId: string): Promise<Organization[]> {
    // In a real implementation, this would query the database for:
    // 1. Organizations where user is a member
    // 2. Organizations shared via data sharing agreements
    // For now, return all active organizations (mock)

    const userOrgs = await this.getUserOrganizations(userId);
    const sharedOrgs = await this.getSharedOrganizations(userId);

    return [...userOrgs, ...sharedOrgs];
  }

  /**
   * Validate if current context allows access to a resource
   */
  async validateResourceAccess(
    resourceType: string,
    resourceOrganizationId: string,
    action: string,
  ): Promise<boolean> {
    if (!this.currentContext) {
      return false;
    }

    // Check if resource belongs to current organization
    if (resourceOrganizationId === this.currentContext.organizationId) {
      return this.checkPermission(resourceType, action);
    }

    // Check if resource is accessible via data sharing agreement
    const scope = this.currentContext.dataAccessScope;
    if (scope.organizations.includes(resourceOrganizationId)) {
      return this.checkCrossOrgPermission(
        resourceType,
        resourceOrganizationId,
        action,
      );
    }

    return false;
  }

  /**
   * Get tenant isolation filters for database queries
   */
  getTenantFilter(): Record<string, any> {
    if (!this.currentContext) {
      throw new Error("No tenant context available");
    }

    const filter: Record<string, any> = {
      organizationId: this.currentContext.organizationId,
    };

    // Add facility filter if context is scoped to a facility
    if (this.currentContext.facilityId) {
      filter.facilityId = this.currentContext.facilityId;
    }

    // Add department filter if context is scoped to a department
    if (this.currentContext.departmentId) {
      filter.departmentId = this.currentContext.departmentId;
    }

    return filter;
  }

  /**
   * Get extended tenant filter including shared organizations
   */
  getExtendedTenantFilter(): Record<string, any> {
    if (!this.currentContext) {
      throw new Error("No tenant context available");
    }

    const scope = this.currentContext.dataAccessScope;

    return {
      organizationId: {
        $in: [this.currentContext.organizationId, ...scope.organizations],
      },
    };
  }

  /**
   * Clear current context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getUserPrimaryOrganization(
    userId: string,
  ): Promise<string | null> {
    // Mock implementation - in production, query user's primary organization
    // This would typically come from the user's session or user record
    return "org-default-123";
  }

  private async getUserOrganizations(userId: string): Promise<Organization[]> {
    // Mock implementation - in production, query organizations where user is a member
    return [];
  }

  private async getSharedOrganizations(
    userId: string,
  ): Promise<Organization[]> {
    // Mock implementation - in production, query organizations shared via agreements
    return [];
  }

  private async getUserPermissions(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    // Mock implementation - in production, fetch user's permissions for the organization
    return [
      "patients:read",
      "patients:write",
      "clinical:read",
      "clinical:write",
      "billing:read",
      "reports:read",
    ];
  }

  private async getDataAccessScope(
    userId: string,
    organizationId: string,
  ): Promise<DataAccessScope> {
    // Mock implementation - in production, build scope from:
    // 1. User's organizational memberships
    // 2. Active data sharing agreements
    // 3. User's role-based access

    return {
      organizations: [organizationId],
      facilities: [],
      departments: [],
      sharingAgreements: [],
      restrictions: [],
    };
  }

  private async verifyOrganizationAccess(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const accessible = await this.getAccessibleOrganizations(userId);
    return accessible.some((org) => org.id === organizationId);
  }

  private checkPermission(resourceType: string, action: string): boolean {
    if (!this.currentContext) {
      return false;
    }

    const permissionString = `${resourceType}:${action}`;
    return this.currentContext.permissions.includes(permissionString);
  }

  private async checkCrossOrgPermission(
    resourceType: string,
    resourceOrganizationId: string,
    action: string,
  ): Promise<boolean> {
    if (!this.currentContext) {
      return false;
    }

    // In production, this would:
    // 1. Find relevant data sharing agreements
    // 2. Check if resourceType is included in agreement
    // 3. Validate access rules and conditions
    // 4. Check time restrictions and other constraints

    return false; // Default deny for cross-org access
  }

  /**
   * Build organization hierarchy path
   */
  async getOrganizationPath(organizationId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | null = organizationId;

    while (currentId) {
      path.unshift(currentId);
      const org = await organizationService.getOrganization(currentId);
      currentId = org?.parentOrganizationId || null;
    }

    return path;
  }

  /**
   * Check if an organization is a descendant of another
   */
  async isDescendantOf(childId: string, ancestorId: string): Promise<boolean> {
    const path = await this.getOrganizationPath(childId);
    return path.includes(ancestorId);
  }

  /**
   * Get all descendant organizations
   */
  async getDescendantOrganizations(
    organizationId: string,
  ): Promise<Organization[]> {
    const descendants: Organization[] = [];
    const children =
      await organizationService.getOrganizationsByParent(organizationId);

    for (const child of children) {
      descendants.push(child);
      const childDescendants = await this.getDescendantOrganizations(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}

// Export singleton instance
export const tenantResolver = new TenantResolver();

// ============================================================================
// Context Management Hook Support
// ============================================================================

export interface TenantContextState {
  context: OrganizationContext | null;
  loading: boolean;
  error: Error | null;
}

export interface TenantSwitchOptions {
  organizationId: string;
  facilityId?: string;
  departmentId?: string;
}

/**
 * Data Isolation Utilities
 * Ensures strict data isolation between organizations with HIPAA compliance
 */

import { tenantResolver } from "./tenant-resolver";
import { auditLogger } from "@/lib/audit-logger";
import { OrganizationContext, DataType } from "@/types/enterprise";

export class DataIsolation {
  /**
   * Apply tenant isolation to a database query
   */
  applyTenantScope<T extends Record<string, any>>(
    query: T,
    options?: IsolationOptions,
  ): T {
    const context = tenantResolver.getCurrentContext();
    if (!context) {
      throw new Error("No tenant context available - data isolation required");
    }

    const scopedQuery = { ...query };

    // Apply organization filter
    if (options?.includeCrossOrg) {
      const extendedFilter = tenantResolver.getExtendedTenantFilter();
      Object.assign(scopedQuery, extendedFilter);
    } else {
      const tenantFilter = tenantResolver.getTenantFilter();
      Object.assign(scopedQuery, tenantFilter);
    }

    // Apply soft delete filter
    if (options?.includeDeleted !== true) {
      scopedQuery.deletedAt = null;
    }

    return scopedQuery;
  }

  /**
   * Validate that a record belongs to the current tenant
   */
  async validateRecordOwnership(
    record: TenantRecord,
    options?: ValidationOptions,
  ): Promise<ValidationResult> {
    const context = tenantResolver.getCurrentContext();
    if (!context) {
      return {
        valid: false,
        reason: "NO_CONTEXT",
        message: "No tenant context available",
      };
    }

    // Check organization ownership
    if (record.organizationId === context.organizationId) {
      return { valid: true };
    }

    // Check if cross-org access is allowed
    if (options?.allowCrossOrg) {
      const scope = context.dataAccessScope;
      if (scope.organizations.includes(record.organizationId)) {
        // Verify data sharing agreement allows this access
        const agreementValid = await this.validateDataSharingAccess(
          context.organizationId,
          record.organizationId,
          options.resourceType || "unknown",
        );

        if (agreementValid) {
          return { valid: true, crossOrgAccess: true };
        }
      }
    }

    return {
      valid: false,
      reason: "UNAUTHORIZED",
      message: "Record does not belong to current tenant",
    };
  }

  /**
   * Sanitize data based on tenant access level
   */
  sanitizeRecord<T extends Record<string, any>>(
    record: T,
    accessLevel: AccessLevel = "FULL",
  ): Partial<T> {
    if (accessLevel === "FULL") {
      return record;
    }

    const sanitized = { ...record };

    if (accessLevel === "LIMITED") {
      // Remove sensitive PHI fields
      this.removePHIFields(sanitized);
    } else if (accessLevel === "MINIMAL") {
      // Keep only basic identifiers
      return this.getMinimalFields(sanitized);
    }

    return sanitized;
  }

  /**
   * Log PHI access for audit trail
   */
  async logPHIAccess(
    userId: string,
    accessType: "READ" | "WRITE" | "DELETE",
    resourceType: string,
    resourceId: string,
    patientId?: string,
  ): Promise<void> {
    const context = tenantResolver.getCurrentContext();
    if (!context) {
      throw new Error("No tenant context for audit logging");
    }

    await auditLogger.log({
      userId,
      action: accessType,
      resource: resourceType,
      resourceId,
      details: {
        patientId,
        organizationId: context.organizationId,
        facilityId: context.facilityId,
        departmentId: context.departmentId,
        timestamp: new Date(),
        phiAccessed: true,
      },
    });
  }

  /**
   * Create a cross-organization query with proper permissions
   */
  async createCrossOrgQuery(
    baseQuery: Record<string, any>,
    targetOrganizationIds: string[],
    resourceType: string,
  ): Promise<CrossOrgQueryResult> {
    const context = tenantResolver.getCurrentContext();
    if (!context) {
      throw new Error("No tenant context available");
    }

    const allowedOrgs: string[] = [];
    const deniedOrgs: string[] = [];

    for (const targetOrgId of targetOrganizationIds) {
      const hasAccess = await this.validateDataSharingAccess(
        context.organizationId,
        targetOrgId,
        resourceType,
      );

      if (hasAccess) {
        allowedOrgs.push(targetOrgId);
      } else {
        deniedOrgs.push(targetOrgId);
      }
    }

    if (allowedOrgs.length === 0) {
      return {
        query: null,
        allowedOrganizations: [],
        deniedOrganizations: deniedOrgs,
        hasAccess: false,
      };
    }

    const scopedQuery = {
      ...baseQuery,
      organizationId: { $in: allowedOrgs },
      deletedAt: null,
    };

    return {
      query: scopedQuery,
      allowedOrganizations: allowedOrgs,
      deniedOrganizations: deniedOrgs,
      hasAccess: true,
    };
  }

  /**
   * Enforce minimum necessary principle for data access
   */
  applyMinimumNecessary<T extends Record<string, any>>(
    data: T[],
    purpose: DataAccessPurpose,
    dataTypes: DataType[],
  ): Partial<T>[] {
    return data.map((record) => {
      const filtered: Partial<T> = {};

      // Define field mappings for each data type
      const allowedFields = this.getAllowedFieldsForPurpose(purpose, dataTypes);

      for (const field of allowedFields) {
        if (field in record) {
          filtered[field as keyof T] = record[field];
        }
      }

      return filtered;
    });
  }

  /**
   * Validate consent for data sharing
   */
  async validateConsent(
    patientId: string,
    organizationId: string,
    dataTypes: DataType[],
  ): Promise<ConsentValidation> {
    // In production, this would:
    // 1. Check patient consent records
    // 2. Validate consent is current and not expired
    // 3. Check if data types are covered by consent
    // 4. Verify any restrictions or limitations

    return {
      hasConsent: true,
      consentId: "mock-consent-id",
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      allowedDataTypes: dataTypes,
      restrictions: [],
    };
  }

  /**
   * Check for data sharing agreement violations
   */
  async checkViolations(
    sourceOrgId: string,
    targetOrgId: string,
    resourceType: string,
    action: string,
  ): Promise<ViolationCheck> {
    // In production, this would:
    // 1. Find active data sharing agreements
    // 2. Check access rules
    // 3. Validate time restrictions
    // 4. Check purpose limitations
    // 5. Verify compliance requirements

    return {
      hasViolations: false,
      violations: [],
      warnings: [],
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async validateDataSharingAccess(
    sourceOrgId: string,
    targetOrgId: string,
    resourceType: string,
  ): Promise<boolean> {
    // Mock implementation - in production:
    // 1. Query active data sharing agreements
    // 2. Validate agreement covers the resource type
    // 3. Check access rules and conditions
    // 4. Verify time restrictions
    // 5. Validate compliance requirements

    // For now, allow same org access
    return sourceOrgId === targetOrgId;
  }

  private removePHIFields(record: Record<string, any>): void {
    // Remove common PHI fields
    const phiFields = [
      "ssn",
      "driversLicense",
      "medicalRecordNumber",
      "healthPlanNumber",
      "accountNumber",
      "certificateNumber",
      "vehicleIdentifier",
      "deviceIdentifier",
      "biometricIdentifier",
      "fullFacePhoto",
      "email",
      "phone",
      "fax",
      "ipAddress",
    ];

    phiFields.forEach((field) => {
      if (field in record) {
        delete record[field];
      }
    });
  }

  private getMinimalFields<T extends Record<string, any>>(
    record: T,
  ): Partial<T> {
    // Return only essential non-PHI identifiers
    const minimalFields: (keyof T)[] = ["id", "organizationId", "createdAt"];
    const minimal: Partial<T> = {};

    minimalFields.forEach((field) => {
      if (field in record) {
        minimal[field] = record[field];
      }
    });

    return minimal;
  }

  private getAllowedFieldsForPurpose(
    purpose: DataAccessPurpose,
    dataTypes: DataType[],
  ): string[] {
    // Define field mappings based on purpose and data types
    const fieldMap: Record<DataAccessPurpose, Record<DataType, string[]>> = {
      TREATMENT: {
        [DataType.DEMOGRAPHICS]: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
        ],
        [DataType.CLINICAL_NOTES]: ["*"], // All fields
        [DataType.LAB_RESULTS]: ["*"],
        [DataType.MEDICATIONS]: ["*"],
        [DataType.ALLERGIES]: ["*"],
        [DataType.VITALS]: ["*"],
      },
      BILLING: {
        [DataType.DEMOGRAPHICS]: ["firstName", "lastName", "dateOfBirth"],
        [DataType.INSURANCE]: ["*"],
        [DataType.BILLING_DATA]: ["*"],
        [DataType.DIAGNOSES]: ["icdCode", "description"],
        [DataType.PROCEDURES]: ["cptCode", "description"],
      },
      RESEARCH: {
        [DataType.DEMOGRAPHICS]: ["age", "gender", "zipCode"], // De-identified
        [DataType.LAB_RESULTS]: ["testType", "result", "units"],
        [DataType.DIAGNOSES]: ["icdCode"],
      },
      OPERATIONS: {
        [DataType.DEMOGRAPHICS]: ["id", "organizationId"],
        [DataType.APPOINTMENTS]: ["*"],
      },
    };

    const allowedFields: Set<string> = new Set();

    dataTypes.forEach((dataType) => {
      const fields = fieldMap[purpose]?.[dataType] || [];
      fields.forEach((field) => allowedFields.add(field));
    });

    return Array.from(allowedFields);
  }
}

// ============================================================================
// Types
// ============================================================================

export interface IsolationOptions {
  includeCrossOrg?: boolean;
  includeDeleted?: boolean;
  facilityScope?: string;
  departmentScope?: string;
}

export interface ValidationOptions {
  allowCrossOrg?: boolean;
  resourceType?: string;
  requireConsent?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  crossOrgAccess?: boolean;
  reason?: string;
  message?: string;
}

export interface TenantRecord {
  id: string;
  organizationId: string;
  facilityId?: string;
  departmentId?: string;
  deletedAt?: Date | null;
}

export type AccessLevel = "FULL" | "LIMITED" | "MINIMAL" | "NONE";

export interface CrossOrgQueryResult {
  query: Record<string, any> | null;
  allowedOrganizations: string[];
  deniedOrganizations: string[];
  hasAccess: boolean;
}

export type DataAccessPurpose =
  | "TREATMENT"
  | "BILLING"
  | "RESEARCH"
  | "OPERATIONS";

export interface ConsentValidation {
  hasConsent: boolean;
  consentId: string | null;
  validUntil: Date | null;
  allowedDataTypes: DataType[];
  restrictions: string[];
}

export interface ViolationCheck {
  hasViolations: boolean;
  violations: Violation[];
  warnings: Warning[];
}

export interface Violation {
  type: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface Warning {
  type: string;
  description: string;
}

// Export singleton instance
export const dataIsolation = new DataIsolation();

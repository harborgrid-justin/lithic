/**
 * Data Sharing Agreement Management
 * Handles creation, validation, and enforcement of inter-organizational data sharing
 */

import {
  DataSharingAgreement,
  CreateDataSharingAgreementDto,
  UpdateDataSharingAgreementDto,
  AgreementStatus,
  AccessRule,
  DataType,
  AccessLevel,
  AgreementPurpose,
} from "@/types/enterprise";
import { auditLogger } from "@/lib/audit-logger";

// Mock database
let agreements: DataSharingAgreement[] = [];

export class SharingAgreementService {
  /**
   * Create a new data sharing agreement
   */
  async createAgreement(
    dto: CreateDataSharingAgreementDto,
    userId: string,
  ): Promise<DataSharingAgreement> {
    const now = new Date();
    const agreementId = this.generateId();

    const agreement: DataSharingAgreement = {
      id: agreementId,
      organizationId: dto.sourceOrganizationId,
      name: dto.name,
      sourceOrganizationId: dto.sourceOrganizationId,
      targetOrganizationId: dto.targetOrganizationId,
      type: dto.type,
      purpose: dto.purpose,
      status: AgreementStatus.DRAFT,
      dataTypes: dto.dataTypes,
      accessRules: dto.accessRules,
      effectiveDate: dto.effectiveDate,
      expiryDate: dto.expiryDate || null,
      autoRenew: false,
      renewalTermDays: 365,
      signedBy: [],
      documentUrl: null,
      restrictions: dto.restrictions || [],
      auditRequired: true,
      complianceFramework: dto.complianceFramework,
      notificationContacts: [],
      terminationNoticeDays: 30,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    agreements.push(agreement);

    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: { agreement },
    });

    return agreement;
  }

  /**
   * Get agreement by ID
   */
  async getAgreement(id: string): Promise<DataSharingAgreement | null> {
    return agreements.find((a) => a.id === id && !a.deletedAt) || null;
  }

  /**
   * Get all agreements for an organization
   */
  async getOrganizationAgreements(
    organizationId: string,
    options?: AgreementQueryOptions,
  ): Promise<DataSharingAgreement[]> {
    let filtered = agreements.filter(
      (a) =>
        !a.deletedAt &&
        (a.sourceOrganizationId === organizationId ||
          a.targetOrganizationId === organizationId),
    );

    if (options?.status) {
      filtered = filtered.filter((a) => a.status === options.status);
    }

    if (options?.type) {
      filtered = filtered.filter((a) => a.type === options.type);
    }

    if (options?.activeOnly) {
      const now = new Date();
      filtered = filtered.filter(
        (a) =>
          a.status === AgreementStatus.ACTIVE &&
          a.effectiveDate <= now &&
          (!a.expiryDate || a.expiryDate > now),
      );
    }

    return filtered;
  }

  /**
   * Get agreements between two organizations
   */
  async getAgreementsBetween(
    sourceOrgId: string,
    targetOrgId: string,
  ): Promise<DataSharingAgreement[]> {
    return agreements.filter(
      (a) =>
        !a.deletedAt &&
        a.sourceOrganizationId === sourceOrgId &&
        a.targetOrganizationId === targetOrgId,
    );
  }

  /**
   * Update agreement
   */
  async updateAgreement(
    dto: UpdateDataSharingAgreementDto,
    userId: string,
  ): Promise<DataSharingAgreement> {
    const index = agreements.findIndex((a) => a.id === dto.id);
    if (index === -1) {
      throw new Error("Agreement not found");
    }

    const updated = {
      ...agreements[index],
      ...dto,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    agreements[index] = updated;

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "data_sharing_agreement",
      resourceId: updated.id,
      details: { changes: dto },
    });

    return updated;
  }

  /**
   * Sign agreement
   */
  async signAgreement(
    agreementId: string,
    userId: string,
    userName: string,
    role: string,
    organizationId: string,
    ipAddress: string,
    signature: string,
  ): Promise<DataSharingAgreement> {
    const agreement = await this.getAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    const signatureInfo = {
      userId,
      userName,
      role,
      organizationId,
      signedAt: new Date(),
      ipAddress,
      signature,
    };

    agreement.signedBy.push(signatureInfo);

    // Check if both parties have signed
    const sourceOrgSigned = agreement.signedBy.some(
      (s) => s.organizationId === agreement.sourceOrganizationId,
    );
    const targetOrgSigned = agreement.signedBy.some(
      (s) => s.organizationId === agreement.targetOrganizationId,
    );

    if (sourceOrgSigned && targetOrgSigned) {
      agreement.status = AgreementStatus.PENDING_APPROVAL;
    }

    agreement.updatedAt = new Date();
    agreement.updatedBy = userId;

    await auditLogger.log({
      userId,
      action: "SIGN",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: { signatureInfo },
    });

    return agreement;
  }

  /**
   * Activate agreement
   */
  async activateAgreement(
    agreementId: string,
    userId: string,
  ): Promise<DataSharingAgreement> {
    const agreement = await this.getAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    // Validate agreement is ready for activation
    const validation = await this.validateAgreement(agreement);
    if (!validation.valid) {
      throw new Error(
        `Agreement validation failed: ${validation.errors.join(", ")}`,
      );
    }

    agreement.status = AgreementStatus.ACTIVE;
    agreement.updatedAt = new Date();
    agreement.updatedBy = userId;

    await auditLogger.log({
      userId,
      action: "ACTIVATE",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: {},
    });

    return agreement;
  }

  /**
   * Suspend agreement
   */
  async suspendAgreement(
    agreementId: string,
    userId: string,
    reason: string,
  ): Promise<DataSharingAgreement> {
    const agreement = await this.getAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    agreement.status = AgreementStatus.SUSPENDED;
    agreement.updatedAt = new Date();
    agreement.updatedBy = userId;

    await auditLogger.log({
      userId,
      action: "SUSPEND",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: { reason },
    });

    return agreement;
  }

  /**
   * Terminate agreement
   */
  async terminateAgreement(
    agreementId: string,
    userId: string,
    reason: string,
  ): Promise<DataSharingAgreement> {
    const agreement = await this.getAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    agreement.status = AgreementStatus.TERMINATED;
    agreement.updatedAt = new Date();
    agreement.updatedBy = userId;

    await auditLogger.log({
      userId,
      action: "TERMINATE",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: { reason },
    });

    return agreement;
  }

  /**
   * Check if data access is allowed under agreements
   */
  async checkDataAccess(
    sourceOrgId: string,
    targetOrgId: string,
    dataType: DataType,
    purpose: AgreementPurpose,
    userId?: string,
  ): Promise<DataAccessCheck> {
    const activeAgreements = await this.getAgreementsBetween(
      sourceOrgId,
      targetOrgId,
    );

    const validAgreements = activeAgreements.filter((a) => {
      const now = new Date();
      return (
        a.status === AgreementStatus.ACTIVE &&
        a.effectiveDate <= now &&
        (!a.expiryDate || a.expiryDate > now) &&
        a.dataTypes.includes(dataType) &&
        this.isPurposeAllowed(a, purpose)
      );
    });

    if (validAgreements.length === 0) {
      return {
        allowed: false,
        reason: "NO_ACTIVE_AGREEMENT",
        message: "No active data sharing agreement found for this data type",
      };
    }

    // Check access rules
    const agreement = validAgreements[0];
    const applicableRules = agreement.accessRules.filter(
      (rule) => rule.dataType === dataType,
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        reason: "NO_ACCESS_RULES",
        message: "No access rules defined for this data type",
      };
    }

    // Check if user is allowed
    if (userId) {
      const userAllowed = applicableRules.some(
        (rule) =>
          rule.allowedUsers.includes(userId) || rule.allowedUsers.length === 0,
      );

      if (!userAllowed) {
        return {
          allowed: false,
          reason: "USER_NOT_ALLOWED",
          message: "User not authorized under agreement",
        };
      }
    }

    // Check time restrictions
    const timeRestricted = applicableRules.some(
      (rule) => rule.timeRestrictions !== null,
    );

    if (timeRestricted) {
      const timeAllowed = this.checkTimeRestrictions(applicableRules);
      if (!timeAllowed) {
        return {
          allowed: false,
          reason: "TIME_RESTRICTION",
          message: "Access not allowed at this time",
        };
      }
    }

    // Determine access level
    const maxAccessLevel = this.getMaxAccessLevel(applicableRules);

    return {
      allowed: true,
      agreementId: agreement.id,
      accessLevel: maxAccessLevel,
      restrictions: agreement.restrictions,
      auditRequired: agreement.auditRequired,
    };
  }

  /**
   * Get access rules for a specific data type
   */
  async getAccessRules(
    sourceOrgId: string,
    targetOrgId: string,
    dataType: DataType,
  ): Promise<AccessRule[]> {
    const agreements = await this.getAgreementsBetween(
      sourceOrgId,
      targetOrgId,
    );
    const activeAgreements = agreements.filter(
      (a) => a.status === AgreementStatus.ACTIVE,
    );

    const rules: AccessRule[] = [];

    for (const agreement of activeAgreements) {
      const applicableRules = agreement.accessRules.filter(
        (rule) => rule.dataType === dataType,
      );
      rules.push(...applicableRules);
    }

    return rules;
  }

  /**
   * Validate agreement completeness and compliance
   */
  async validateAgreement(
    agreement: DataSharingAgreement,
  ): Promise<AgreementValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check signatures
    const sourceOrgSigned = agreement.signedBy.some(
      (s) => s.organizationId === agreement.sourceOrganizationId,
    );
    const targetOrgSigned = agreement.signedBy.some(
      (s) => s.organizationId === agreement.targetOrganizationId,
    );

    if (!sourceOrgSigned) {
      errors.push("Source organization signature required");
    }
    if (!targetOrgSigned) {
      errors.push("Target organization signature required");
    }

    // Check dates
    if (agreement.effectiveDate > new Date()) {
      warnings.push("Agreement not yet effective");
    }

    if (agreement.expiryDate && agreement.expiryDate < new Date()) {
      errors.push("Agreement has expired");
    }

    // Check data types
    if (agreement.dataTypes.length === 0) {
      errors.push("At least one data type must be specified");
    }

    // Check access rules
    if (agreement.accessRules.length === 0) {
      warnings.push("No access rules defined");
    }

    // Check compliance frameworks
    if (agreement.complianceFramework.length === 0) {
      warnings.push("No compliance framework specified");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Process expiring agreements
   */
  async processExpiringAgreements(
    daysBeforeExpiry: number = 30,
  ): Promise<void> {
    const now = new Date();
    const thresholdDate = new Date(
      now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000,
    );

    const expiringAgreements = agreements.filter(
      (a) =>
        a.status === AgreementStatus.ACTIVE &&
        a.expiryDate &&
        a.expiryDate <= thresholdDate &&
        a.expiryDate > now,
    );

    for (const agreement of expiringAgreements) {
      // Send notifications
      await this.notifyExpiringAgreement(agreement);

      // Auto-renew if enabled
      if (agreement.autoRenew) {
        await this.renewAgreement(agreement.id, "system");
      }
    }
  }

  /**
   * Renew agreement
   */
  async renewAgreement(
    agreementId: string,
    userId: string,
  ): Promise<DataSharingAgreement> {
    const agreement = await this.getAgreement(agreementId);
    if (!agreement) {
      throw new Error("Agreement not found");
    }

    const newExpiryDate = new Date(
      (agreement.expiryDate || new Date()).getTime() +
        agreement.renewalTermDays * 24 * 60 * 60 * 1000,
    );

    agreement.expiryDate = newExpiryDate;
    agreement.updatedAt = new Date();
    agreement.updatedBy = userId;

    await auditLogger.log({
      userId,
      action: "RENEW",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: { newExpiryDate },
    });

    return agreement;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateId(): string {
    return `dsa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private isPurposeAllowed(
    agreement: DataSharingAgreement,
    purpose: AgreementPurpose,
  ): boolean {
    return agreement.purpose === purpose;
  }

  private checkTimeRestrictions(rules: AccessRule[]): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

    return rules.some((rule) => {
      if (!rule.timeRestrictions) return true;

      const { daysOfWeek, startTime, endTime } = rule.timeRestrictions;

      const dayAllowed = daysOfWeek.includes(currentDay);
      const timeAllowed = currentTime >= startTime && currentTime <= endTime;

      return dayAllowed && timeAllowed;
    });
  }

  private getMaxAccessLevel(rules: AccessRule[]): AccessLevel {
    const levels = rules.map((r) => r.accessLevel);

    if (levels.includes(AccessLevel.READ_WRITE)) return AccessLevel.READ_WRITE;
    if (levels.includes(AccessLevel.CREATE_ONLY))
      return AccessLevel.CREATE_ONLY;
    if (levels.includes(AccessLevel.READ_ONLY)) return AccessLevel.READ_ONLY;

    return AccessLevel.NO_ACCESS;
  }

  private async notifyExpiringAgreement(
    agreement: DataSharingAgreement,
  ): Promise<void> {
    // In production, send email/SMS notifications to contacts
    await auditLogger.log({
      userId: "system",
      action: "NOTIFY",
      resource: "data_sharing_agreement",
      resourceId: agreement.id,
      details: {
        type: "expiring_agreement",
        expiryDate: agreement.expiryDate,
      },
    });
  }
}

// ============================================================================
// Types
// ============================================================================

export interface AgreementQueryOptions {
  status?: AgreementStatus;
  type?: string;
  activeOnly?: boolean;
}

export interface DataAccessCheck {
  allowed: boolean;
  agreementId?: string;
  accessLevel?: AccessLevel;
  restrictions?: any[];
  auditRequired?: boolean;
  reason?: string;
  message?: string;
}

export interface AgreementValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Export singleton instance
export const sharingAgreementService = new SharingAgreementService();

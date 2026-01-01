/**
 * SDOH Data Sharing Consent Management
 * HIPAA-compliant consent tracking for SDOH referrals
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// Consent Types
// ============================================================================

export enum ConsentType {
  GENERAL_SDOH_SCREENING = "GENERAL_SDOH_SCREENING",
  SDOH_DATA_SHARING = "SDOH_DATA_SHARING",
  REFERRAL_TO_CBO = "REFERRAL_TO_CBO",
  RESEARCH_DATA_USE = "RESEARCH_DATA_USE",
  CARE_COORDINATION = "CARE_COORDINATION",
  FOLLOW_UP_CONTACT = "FOLLOW_UP_CONTACT",
}

export enum ConsentStatus {
  PENDING = "PENDING",
  GRANTED = "GRANTED",
  DENIED = "DENIED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export enum ConsentMethod {
  ELECTRONIC_SIGNATURE = "ELECTRONIC_SIGNATURE",
  VERBAL_PHONE = "VERBAL_PHONE",
  VERBAL_IN_PERSON = "VERBAL_IN_PERSON",
  WRITTEN_SIGNATURE = "WRITTEN_SIGNATURE",
  PATIENT_PORTAL = "PATIENT_PORTAL",
}

export interface SDOHConsent {
  id: string;
  organizationId: string;
  patientId: string;

  // Consent Details
  type: ConsentType;
  status: ConsentStatus;
  method: ConsentMethod;

  // What is being consented to
  purpose: string;
  scope: ConsentScope;
  dataCategories: string[];

  // Who can access
  authorizedOrganizations: AuthorizedOrganization[];
  authorizedIndividuals: AuthorizedIndividual[];

  // Time period
  effectiveDate: Date;
  expirationDate?: Date;
  autoRenew: boolean;

  // Signature and verification
  signedBy: string; // Patient name
  signedByRelationship?: string; // If signed by representative
  signature?: string; // Digital signature or ID
  witnessedBy?: string;
  witnessSignature?: string;

  // Consent form
  consentFormId: string;
  consentFormVersion: string;
  consentFormUrl?: string;
  languageUsed: string;

  // Restrictions and preferences
  restrictions: ConsentRestriction[];
  preferences: ConsentPreferences;

  // Revocation
  canBeRevoked: boolean;
  revocationDate?: Date;
  revocationReason?: string;
  revokedBy?: string;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedDate?: Date;
  verificationMethod?: string;

  // Additional info
  notes?: string;
  attachments?: ConsentAttachment[];
  hipaaCompliant: boolean;
  regulatoryCompliant: boolean;
}

export interface ConsentScope {
  includeScreeningResults: boolean;
  includeIdentifiedNeeds: boolean;
  includeClinicalNotes: boolean;
  includeDemographics: boolean;
  includeContactInfo: boolean;
  includeInsuranceInfo: boolean;
  includeReferralHistory: boolean;
  includeOutcomes: boolean;
  customInclusions?: string[];
  customExclusions?: string[];
}

export interface AuthorizedOrganization {
  id: string;
  name: string;
  type: string;
  purpose: string;
  accessLevel: AccessLevel;
  expirationDate?: Date;
}

export interface AuthorizedIndividual {
  id: string;
  name: string;
  title?: string;
  organization: string;
  role: string;
  accessLevel: AccessLevel;
  expirationDate?: Date;
}

export enum AccessLevel {
  READ_ONLY = "READ_ONLY",
  READ_WRITE = "READ_WRITE",
  FULL_ACCESS = "FULL_ACCESS",
  LIMITED = "LIMITED",
}

export interface ConsentRestriction {
  type: RestrictionType;
  description: string;
  appliesTo: string[]; // Organization IDs or individual IDs
}

export enum RestrictionType {
  NO_SHARING_WITH_SPECIFIC_ENTITY = "NO_SHARING_WITH_SPECIFIC_ENTITY",
  LIMITED_DATA_SHARING = "LIMITED_DATA_SHARING",
  NO_RESEARCH_USE = "NO_RESEARCH_USE",
  NO_MARKETING = "NO_MARKETING",
  REQUIRE_ADDITIONAL_CONSENT = "REQUIRE_ADDITIONAL_CONSENT",
  TIME_LIMITED = "TIME_LIMITED",
  PURPOSE_LIMITED = "PURPOSE_LIMITED",
}

export interface ConsentPreferences {
  communicationMethod: ("email" | "phone" | "mail" | "patient_portal")[];
  languagePreference: string;
  requireNotificationBeforeSharing: boolean;
  allowAutomatedDecisions: boolean;
  shareWithFamilyMembers: boolean;
  authorizedFamilyMembers?: string[];
}

export interface ConsentAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
}

// ============================================================================
// Consent Forms
// ============================================================================

export interface ConsentForm {
  id: string;
  version: string;
  organizationId: string;
  type: ConsentType;
  title: string;
  description: string;
  content: ConsentFormContent;
  languages: string[];
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  requiresWitness: boolean;
  requiresNotarization: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentFormContent {
  sections: ConsentFormSection[];
  disclosures: Disclosure[];
  patientRights: string[];
  revocationInstructions: string;
  contactInformation: {
    privacyOfficer: string;
    phone: string;
    email: string;
    address?: string;
  };
}

export interface ConsentFormSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  order: number;
}

export interface Disclosure {
  title: string;
  content: string;
  acknowledgmentRequired: boolean;
}

// ============================================================================
// Consent Manager
// ============================================================================

export class ConsentManager {
  private consents: Map<string, SDOHConsent> = new Map();
  private forms: Map<string, ConsentForm> = new Map();

  /**
   * Create new consent
   */
  createConsent(request: CreateConsentRequest): SDOHConsent {
    const consentId = this.generateConsentId();
    const now = new Date();

    const consent: SDOHConsent = {
      id: consentId,
      organizationId: request.organizationId,
      patientId: request.patientId,
      type: request.type,
      status: ConsentStatus.GRANTED,
      method: request.method,
      purpose: request.purpose,
      scope: request.scope,
      dataCategories: request.dataCategories,
      authorizedOrganizations: request.authorizedOrganizations || [],
      authorizedIndividuals: request.authorizedIndividuals || [],
      effectiveDate: request.effectiveDate || now,
      expirationDate: request.expirationDate,
      autoRenew: request.autoRenew || false,
      signedBy: request.signedBy,
      signedByRelationship: request.signedByRelationship,
      signature: request.signature,
      witnessedBy: request.witnessedBy,
      witnessSignature: request.witnessSignature,
      consentFormId: request.consentFormId,
      consentFormVersion: request.consentFormVersion,
      consentFormUrl: request.consentFormUrl,
      languageUsed: request.languageUsed || "en",
      restrictions: request.restrictions || [],
      preferences: request.preferences || this.getDefaultPreferences(),
      canBeRevoked: request.canBeRevoked !== false,
      createdBy: request.createdBy,
      createdAt: now,
      updatedAt: now,
      hipaaCompliant: true,
      regulatoryCompliant: true,
    };

    this.consents.set(consentId, consent);
    return consent;
  }

  /**
   * Revoke consent
   */
  revokeConsent(
    consentId: string,
    revokedBy: string,
    reason?: string
  ): SDOHConsent {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error("Consent not found");
    }

    if (!consent.canBeRevoked) {
      throw new Error("This consent cannot be revoked");
    }

    consent.status = ConsentStatus.REVOKED;
    consent.revocationDate = new Date();
    consent.revokedBy = revokedBy;
    consent.revocationReason = reason;
    consent.updatedAt = new Date();

    this.consents.set(consentId, consent);
    return consent;
  }

  /**
   * Check if consent is valid and active
   */
  isConsentValid(consentId: string): boolean {
    const consent = this.consents.get(consentId);
    if (!consent) return false;

    // Check status
    if (consent.status !== ConsentStatus.GRANTED) return false;

    // Check expiration
    if (consent.expirationDate && consent.expirationDate < new Date()) {
      this.expireConsent(consentId);
      return false;
    }

    // Check effective date
    if (consent.effectiveDate > new Date()) return false;

    return true;
  }

  /**
   * Check if specific data sharing is authorized
   */
  isDataSharingAuthorized(
    consentId: string,
    organizationId: string,
    dataCategory: string
  ): {
    authorized: boolean;
    reason?: string;
    restrictions?: ConsentRestriction[];
  } {
    const consent = this.consents.get(consentId);
    if (!consent) {
      return { authorized: false, reason: "Consent not found" };
    }

    if (!this.isConsentValid(consentId)) {
      return { authorized: false, reason: "Consent is not valid or expired" };
    }

    // Check if data category is included in consent
    if (!consent.dataCategories.includes(dataCategory)) {
      return { authorized: false, reason: "Data category not included in consent" };
    }

    // Check if organization is authorized
    const orgAuthorized = consent.authorizedOrganizations.some(
      (org) => org.id === organizationId
    );

    if (!orgAuthorized) {
      return { authorized: false, reason: "Organization not authorized" };
    }

    // Check for restrictions
    const restrictions = consent.restrictions.filter((restriction) =>
      restriction.appliesTo.includes(organizationId)
    );

    if (restrictions.length > 0) {
      // Check if any restriction blocks this sharing
      const blockingRestriction = restrictions.find(
        (r) =>
          r.type === RestrictionType.NO_SHARING_WITH_SPECIFIC_ENTITY ||
          r.type === RestrictionType.LIMITED_DATA_SHARING
      );

      if (blockingRestriction) {
        return {
          authorized: false,
          reason: "Restricted by patient preference",
          restrictions,
        };
      }
    }

    return { authorized: true, restrictions };
  }

  /**
   * Get consents for patient
   */
  getPatientConsents(patientId: string): SDOHConsent[] {
    return Array.from(this.consents.values()).filter(
      (c) => c.patientId === patientId
    );
  }

  /**
   * Get active consents for patient by type
   */
  getActiveConsentsByType(
    patientId: string,
    type: ConsentType
  ): SDOHConsent[] {
    return this.getPatientConsents(patientId).filter(
      (c) => c.type === type && this.isConsentValid(c.id)
    );
  }

  /**
   * Expire consent
   */
  private expireConsent(consentId: string): void {
    const consent = this.consents.get(consentId);
    if (consent) {
      consent.status = ConsentStatus.EXPIRED;
      consent.updatedAt = new Date();
      this.consents.set(consentId, consent);
    }
  }

  /**
   * Check for expiring consents
   */
  getExpiringConsents(daysAhead: number = 30): SDOHConsent[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return Array.from(this.consents.values()).filter(
      (consent) =>
        consent.status === ConsentStatus.GRANTED &&
        consent.expirationDate &&
        consent.expirationDate <= futureDate &&
        consent.expirationDate > new Date()
    );
  }

  /**
   * Renew consent
   */
  renewConsent(
    consentId: string,
    newExpirationDate: Date,
    renewedBy: string
  ): SDOHConsent {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error("Consent not found");
    }

    consent.expirationDate = newExpirationDate;
    consent.lastVerifiedDate = new Date();
    consent.verificationMethod = "renewal";
    consent.updatedAt = new Date();

    if (consent.status === ConsentStatus.EXPIRED) {
      consent.status = ConsentStatus.GRANTED;
    }

    this.consents.set(consentId, consent);
    return consent;
  }

  /**
   * Add authorized organization to consent
   */
  addAuthorizedOrganization(
    consentId: string,
    organization: AuthorizedOrganization
  ): SDOHConsent {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error("Consent not found");
    }

    consent.authorizedOrganizations.push(organization);
    consent.updatedAt = new Date();

    this.consents.set(consentId, consent);
    return consent;
  }

  /**
   * Remove authorized organization from consent
   */
  removeAuthorizedOrganization(
    consentId: string,
    organizationId: string
  ): SDOHConsent {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error("Consent not found");
    }

    consent.authorizedOrganizations = consent.authorizedOrganizations.filter(
      (org) => org.id !== organizationId
    );
    consent.updatedAt = new Date();

    this.consents.set(consentId, consent);
    return consent;
  }

  /**
   * Create consent form
   */
  createConsentForm(form: Omit<ConsentForm, "id" | "createdAt" | "updatedAt">): ConsentForm {
    const formId = this.generateFormId();
    const now = new Date();

    const consentForm: ConsentForm = {
      ...form,
      id: formId,
      createdAt: now,
      updatedAt: now,
    };

    this.forms.set(formId, consentForm);
    return consentForm;
  }

  /**
   * Get consent form
   */
  getConsentForm(formId: string): ConsentForm | undefined {
    return this.forms.get(formId);
  }

  /**
   * Get active consent forms by type
   */
  getActiveConsentForms(type: ConsentType): ConsentForm[] {
    return Array.from(this.forms.values()).filter(
      (form) => form.type === type && form.isActive
    );
  }

  /**
   * Generate consent audit log
   */
  generateAuditLog(consentId: string): ConsentAuditLog {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error("Consent not found");
    }

    return {
      consentId: consent.id,
      patientId: consent.patientId,
      type: consent.type,
      status: consent.status,
      createdDate: consent.createdAt,
      effectiveDate: consent.effectiveDate,
      expirationDate: consent.expirationDate,
      revokedDate: consent.revocationDate,
      authorizedOrganizations: consent.authorizedOrganizations.map((org) => ({
        name: org.name,
        purpose: org.purpose,
        accessLevel: org.accessLevel,
      })),
      dataShared: consent.dataCategories,
      restrictions: consent.restrictions.map((r) => r.description),
      lastVerified: consent.lastVerifiedDate,
    };
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): ConsentPreferences {
    return {
      communicationMethod: ["email", "phone"],
      languagePreference: "en",
      requireNotificationBeforeSharing: false,
      allowAutomatedDecisions: true,
      shareWithFamilyMembers: false,
    };
  }

  private generateConsentId(): string {
    return `CONSENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFormId(): string {
    return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateConsentRequest {
  organizationId: string;
  patientId: string;
  type: ConsentType;
  method: ConsentMethod;
  purpose: string;
  scope: ConsentScope;
  dataCategories: string[];
  authorizedOrganizations?: AuthorizedOrganization[];
  authorizedIndividuals?: AuthorizedIndividual[];
  effectiveDate?: Date;
  expirationDate?: Date;
  autoRenew?: boolean;
  signedBy: string;
  signedByRelationship?: string;
  signature?: string;
  witnessedBy?: string;
  witnessSignature?: string;
  consentFormId: string;
  consentFormVersion: string;
  consentFormUrl?: string;
  languageUsed?: string;
  restrictions?: ConsentRestriction[];
  preferences?: ConsentPreferences;
  canBeRevoked?: boolean;
  createdBy: string;
}

export interface ConsentAuditLog {
  consentId: string;
  patientId: string;
  type: ConsentType;
  status: ConsentStatus;
  createdDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  revokedDate?: Date;
  authorizedOrganizations: Array<{
    name: string;
    purpose: string;
    accessLevel: AccessLevel;
  }>;
  dataShared: string[];
  restrictions: string[];
  lastVerified?: Date;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const ConsentScopeSchema = z.object({
  includeScreeningResults: z.boolean(),
  includeIdentifiedNeeds: z.boolean(),
  includeClinicalNotes: z.boolean(),
  includeDemographics: z.boolean(),
  includeContactInfo: z.boolean(),
  includeInsuranceInfo: z.boolean(),
  includeReferralHistory: z.boolean(),
  includeOutcomes: z.boolean(),
  customInclusions: z.array(z.string()).optional(),
  customExclusions: z.array(z.string()).optional(),
});

export const CreateConsentSchema = z.object({
  organizationId: z.string(),
  patientId: z.string(),
  type: z.nativeEnum(ConsentType),
  method: z.nativeEnum(ConsentMethod),
  purpose: z.string().min(10),
  scope: ConsentScopeSchema,
  dataCategories: z.array(z.string()).min(1),
  signedBy: z.string(),
  consentFormId: z.string(),
  consentFormVersion: z.string(),
  createdBy: z.string(),
});

export const AuthorizedOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  purpose: z.string(),
  accessLevel: z.nativeEnum(AccessLevel),
  expirationDate: z.date().optional(),
});

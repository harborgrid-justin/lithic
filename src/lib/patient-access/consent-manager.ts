/**
 * Patient Access API - Consent Manager
 * Patient consent management, granular access controls, and consent directives
 */

import { z } from "zod";

/**
 * Consent Status
 */
export enum ConsentStatus {
  DRAFT = "draft",
  PROPOSED = "proposed",
  ACTIVE = "active",
  REJECTED = "rejected",
  INACTIVE = "inactive",
  ENTERED_IN_ERROR = "entered-in-error",
}

/**
 * Consent Provision Type
 */
export enum ProvisionType {
  DENY = "deny",
  PERMIT = "permit",
}

/**
 * Consent Category
 */
export enum ConsentCategory {
  RESEARCH = "research",
  PATIENT_PRIVACY = "patient-privacy",
  TREATMENT = "treatment",
  ADVANCE_DIRECTIVE = "advance-directive",
  MEDICAL_CONSENT = "medical-consent",
}

/**
 * Consent Scope
 */
export enum ConsentScope {
  PATIENT_PRIVACY = "patient-privacy",
  RESEARCH = "research",
  TREATMENT = "treatment",
  ADR = "adr", // Advanced Care Directive
}

/**
 * Consent Action
 */
export enum ConsentAction {
  ACCESS = "access",
  CORRECT = "correct",
  DISCLOSE = "disclose",
  USE = "use",
}

/**
 * Consent Resource Type Filter
 */
export interface ResourceTypeFilter {
  system: "http://hl7.org/fhir/resource-types";
  code: string;
}

/**
 * Consent Purpose
 */
export enum ConsentPurpose {
  TREATMENT = "TREAT",
  PAYMENT = "HPAYMT",
  OPERATIONS = "HOPERAT",
  RESEARCH = "HRESCH",
  PUBLIC_HEALTH = "PUBHLTH",
  MARKETING = "HMARKT",
  DIRECTORY = "HCOMPL",
}

/**
 * Consent Provision
 */
export interface ConsentProvision {
  type: ProvisionType;
  period?: {
    start?: string;
    end?: string;
  };
  actor?: Array<{
    role: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    reference: {
      reference: string;
      display?: string;
    };
  }>;
  action?: Array<{
    coding: Array<{
      system: string;
      code: ConsentAction;
      display?: string;
    }>;
  }>;
  securityLabel?: Array<{
    system: string;
    code: string;
    display?: string;
  }>;
  purpose?: Array<{
    system: string;
    code: ConsentPurpose;
    display?: string;
  }>;
  class?: Array<ResourceTypeFilter>;
  code?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  dataPeriod?: {
    start?: string;
    end?: string;
  };
  data?: Array<{
    meaning: "instance" | "related" | "dependents" | "authoredby";
    reference: {
      reference: string;
    };
  }>;
  provision?: ConsentProvision[];
}

/**
 * Patient Consent
 */
export interface PatientConsent {
  id?: string;
  resourceType: "Consent";
  status: ConsentStatus;
  scope: {
    coding: Array<{
      system: "http://terminology.hl7.org/CodeSystem/consentscope";
      code: ConsentScope;
      display?: string;
    }>;
  };
  category: Array<{
    coding: Array<{
      system: string;
      code: ConsentCategory;
      display?: string;
    }>;
  }>;
  patient: {
    reference: string;
    display?: string;
  };
  dateTime?: string;
  performer?: Array<{
    reference: string;
    display?: string;
  }>;
  organization?: Array<{
    reference: string;
    display?: string;
  }>;
  sourceAttachment?: {
    contentType: string;
    data?: string;
    url?: string;
    title?: string;
  };
  sourceReference?: {
    reference: string;
  };
  policy?: Array<{
    authority?: string;
    uri?: string;
  }>;
  policyRule?: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  };
  verification?: Array<{
    verified: boolean;
    verifiedWith?: {
      reference: string;
    };
    verificationDate?: string;
  }>;
  provision?: ConsentProvision;
}

/**
 * Consent Decision
 */
export interface ConsentDecision {
  allowed: boolean;
  reason?: string;
  matchingProvisions: ConsentProvision[];
}

/**
 * Create a patient consent
 */
export function createConsent(
  patientId: string,
  scope: ConsentScope,
  category: ConsentCategory,
  provision: ConsentProvision,
  options?: {
    status?: ConsentStatus;
    dateTime?: string;
    performerId?: string;
    organizationId?: string;
    policyUri?: string;
  }
): PatientConsent {
  return {
    resourceType: "Consent",
    status: options?.status || ConsentStatus.ACTIVE,
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: scope,
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: category,
          },
        ],
      },
    ],
    patient: {
      reference: `Patient/${patientId}`,
    },
    dateTime: options?.dateTime || new Date().toISOString(),
    performer: options?.performerId
      ? [{ reference: `Patient/${patientId}` }]
      : undefined,
    organization: options?.organizationId
      ? [{ reference: `Organization/${options.organizationId}` }]
      : undefined,
    policy: options?.policyUri
      ? [{ uri: options.policyUri }]
      : undefined,
    provision,
  };
}

/**
 * Create permit-all consent
 */
export function createPermitAllConsent(patientId: string): PatientConsent {
  return createConsent(
    patientId,
    ConsentScope.PATIENT_PRIVACY,
    ConsentCategory.PATIENT_PRIVACY,
    {
      type: ProvisionType.PERMIT,
    }
  );
}

/**
 * Create deny-all consent
 */
export function createDenyAllConsent(patientId: string): PatientConsent {
  return createConsent(
    patientId,
    ConsentScope.PATIENT_PRIVACY,
    ConsentCategory.PATIENT_PRIVACY,
    {
      type: ProvisionType.DENY,
    }
  );
}

/**
 * Create resource-specific consent
 */
export function createResourceConsent(
  patientId: string,
  resourceTypes: string[],
  provisionType: ProvisionType,
  actions: ConsentAction[]
): PatientConsent {
  return createConsent(
    patientId,
    ConsentScope.PATIENT_PRIVACY,
    ConsentCategory.PATIENT_PRIVACY,
    {
      type: provisionType,
      class: resourceTypes.map((type) => ({
        system: "http://hl7.org/fhir/resource-types" as const,
        code: type,
      })),
      action: actions.map((action) => ({
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: action,
          },
        ],
      })),
    }
  );
}

/**
 * Create actor-specific consent
 */
export function createActorConsent(
  patientId: string,
  actorId: string,
  actorRole: string,
  provisionType: ProvisionType
): PatientConsent {
  return createConsent(
    patientId,
    ConsentScope.PATIENT_PRIVACY,
    ConsentCategory.PATIENT_PRIVACY,
    {
      type: provisionType,
      actor: [
        {
          role: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: actorRole,
              },
            ],
          },
          reference: {
            reference: actorId,
          },
        },
      ],
    }
  );
}

/**
 * Create purpose-specific consent
 */
export function createPurposeConsent(
  patientId: string,
  purposes: ConsentPurpose[],
  provisionType: ProvisionType
): PatientConsent {
  return createConsent(
    patientId,
    ConsentScope.PATIENT_PRIVACY,
    ConsentCategory.PATIENT_PRIVACY,
    {
      type: provisionType,
      purpose: purposes.map((purpose) => ({
        system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
        code: purpose,
      })),
    }
  );
}

/**
 * Check if access is allowed by consent
 */
export function checkConsentAccess(
  consent: PatientConsent,
  context: {
    resourceType?: string;
    action?: ConsentAction;
    actorId?: string;
    purpose?: ConsentPurpose;
  }
): ConsentDecision {
  // If consent is not active, deny access
  if (consent.status !== ConsentStatus.ACTIVE) {
    return {
      allowed: false,
      reason: "Consent is not active",
      matchingProvisions: [],
    };
  }

  // If no provision, use default behavior based on scope
  if (!consent.provision) {
    return {
      allowed: true,
      reason: "No specific provisions defined",
      matchingProvisions: [],
    };
  }

  // Evaluate provision
  return evaluateProvision(consent.provision, context);
}

/**
 * Evaluate a consent provision
 */
function evaluateProvision(
  provision: ConsentProvision,
  context: {
    resourceType?: string;
    action?: ConsentAction;
    actorId?: string;
    purpose?: ConsentPurpose;
  }
): ConsentDecision {
  const matchingProvisions: ConsentProvision[] = [];

  // Check if provision matches context
  let matches = true;

  // Check resource type
  if (provision.class && context.resourceType) {
    matches = provision.class.some((c) => c.code === context.resourceType);
  }

  // Check action
  if (provision.action && context.action) {
    matches =
      matches &&
      provision.action.some((a) =>
        a.coding.some((c) => c.code === context.action)
      );
  }

  // Check actor
  if (provision.actor && context.actorId) {
    matches =
      matches &&
      provision.actor.some((a) => a.reference.reference === context.actorId);
  }

  // Check purpose
  if (provision.purpose && context.purpose) {
    matches =
      matches &&
      provision.purpose.some((p) => p.code === context.purpose);
  }

  if (matches) {
    matchingProvisions.push(provision);
  }

  // Check nested provisions
  if (provision.provision) {
    for (const nested of provision.provision) {
      const nestedResult = evaluateProvision(nested, context);
      if (nestedResult.matchingProvisions.length > 0) {
        matchingProvisions.push(...nestedResult.matchingProvisions);
      }
    }
  }

  // Determine if allowed based on provision type
  const hasPermit = matchingProvisions.some((p) => p.type === ProvisionType.PERMIT);
  const hasDeny = matchingProvisions.some((p) => p.type === ProvisionType.DENY);

  // Deny takes precedence
  if (hasDeny) {
    return {
      allowed: false,
      reason: "Access denied by consent provision",
      matchingProvisions,
    };
  }

  if (hasPermit) {
    return {
      allowed: true,
      reason: "Access permitted by consent provision",
      matchingProvisions,
    };
  }

  // Default behavior based on root provision type
  return {
    allowed: provision.type === ProvisionType.PERMIT,
    reason:
      provision.type === ProvisionType.PERMIT
        ? "Access permitted by default"
        : "Access denied by default",
    matchingProvisions,
  };
}

/**
 * Filter resources by consent
 */
export function filterResourcesByConsent<T extends { resourceType: string }>(
  resources: T[],
  consent: PatientConsent,
  context: {
    action?: ConsentAction;
    actorId?: string;
    purpose?: ConsentPurpose;
  }
): T[] {
  return resources.filter((resource) => {
    const decision = checkConsentAccess(consent, {
      ...context,
      resourceType: resource.resourceType,
    });
    return decision.allowed;
  });
}

/**
 * Get consent summary
 */
export function getConsentSummary(consent: PatientConsent): {
  patientId: string;
  status: string;
  scope: string;
  permittedResources: string[];
  deniedResources: string[];
  permittedActions: string[];
  deniedActions: string[];
} {
  const summary = {
    patientId: consent.patient.reference.split("/")[1] || "",
    status: consent.status,
    scope: consent.scope.coding[0]?.code || "",
    permittedResources: [] as string[],
    deniedResources: [] as string[],
    permittedActions: [] as string[],
    deniedActions: [] as string[],
  };

  if (consent.provision) {
    extractProvisionSummary(consent.provision, summary);
  }

  return summary;
}

/**
 * Extract provision summary recursively
 */
function extractProvisionSummary(
  provision: ConsentProvision,
  summary: {
    permittedResources: string[];
    deniedResources: string[];
    permittedActions: string[];
    deniedActions: string[];
  }
): void {
  const resources = provision.class?.map((c) => c.code) || [];
  const actions = provision.action?.flatMap((a) => a.coding.map((c) => c.code)) || [];

  if (provision.type === ProvisionType.PERMIT) {
    summary.permittedResources.push(...resources);
    summary.permittedActions.push(...actions);
  } else {
    summary.deniedResources.push(...resources);
    summary.deniedActions.push(...actions);
  }

  // Process nested provisions
  if (provision.provision) {
    for (const nested of provision.provision) {
      extractProvisionSummary(nested, summary);
    }
  }
}

/**
 * Validation schemas
 */
export const ConsentSchema = z.object({
  resourceType: z.literal("Consent"),
  status: z.nativeEnum(ConsentStatus),
  scope: z.object({
    coding: z.array(
      z.object({
        system: z.literal("http://terminology.hl7.org/CodeSystem/consentscope"),
        code: z.nativeEnum(ConsentScope),
        display: z.string().optional(),
      })
    ),
  }),
  category: z.array(
    z.object({
      coding: z.array(
        z.object({
          system: z.string(),
          code: z.nativeEnum(ConsentCategory),
          display: z.string().optional(),
        })
      ),
    })
  ),
  patient: z.object({
    reference: z.string(),
    display: z.string().optional(),
  }),
});

/**
 * Helper to validate consent
 */
export function validateConsent(consent: unknown): boolean {
  try {
    ConsentSchema.parse(consent);
    return true;
  } catch (error) {
    console.error("Consent validation error:", error);
    return false;
  }
}

/**
 * USCDI v3 Health Concerns Implementation
 * Health concerns tracking, problem list management, and SDOH concerns integration
 */

import { z } from "zod";

/**
 * Health Concern Categories
 */
export enum HealthConcernCategory {
  HEALTH_CONCERN = "health-concern",
  PROBLEM_LIST_ITEM = "problem-list-item",
  ENCOUNTER_DIAGNOSIS = "encounter-diagnosis",
}

export const HealthConcernCategoryDisplay: Record<HealthConcernCategory, string> = {
  [HealthConcernCategory.HEALTH_CONCERN]: "Health Concern",
  [HealthConcernCategory.PROBLEM_LIST_ITEM]: "Problem List Item",
  [HealthConcernCategory.ENCOUNTER_DIAGNOSIS]: "Encounter Diagnosis",
};

/**
 * Problem Status
 */
export enum ProblemStatus {
  ACTIVE = "active",
  RECURRENCE = "recurrence",
  RELAPSE = "relapse",
  INACTIVE = "inactive",
  REMISSION = "remission",
  RESOLVED = "resolved",
}

/**
 * Clinical Status
 */
export enum ClinicalStatus {
  ACTIVE = "active",
  RECURRENCE = "recurrence",
  RELAPSE = "relapse",
  INACTIVE = "inactive",
  REMISSION = "remission",
  RESOLVED = "resolved",
}

/**
 * Verification Status
 */
export enum VerificationStatus {
  UNCONFIRMED = "unconfirmed",
  PROVISIONAL = "provisional",
  DIFFERENTIAL = "differential",
  CONFIRMED = "confirmed",
  REFUTED = "refuted",
  ENTERED_IN_ERROR = "entered-in-error",
}

/**
 * Health Concern Severity
 */
export enum Severity {
  MILD = "255604002",
  MODERATE = "6736007",
  SEVERE = "24484000",
}

export const SeverityDisplay: Record<Severity, string> = {
  [Severity.MILD]: "Mild",
  [Severity.MODERATE]: "Moderate",
  [Severity.SEVERE]: "Severe",
};

/**
 * SDOH Categories per Gravity Project
 */
export enum SDOHCategory {
  FOOD_INSECURITY = "food-insecurity",
  HOUSING_INSTABILITY = "housing-instability-and-homelessness",
  TRANSPORTATION_INSECURITY = "transportation-insecurity",
  UTILITY_INSECURITY = "utility-insecurity",
  INTERPERSONAL_SAFETY = "interpersonal-safety",
  FINANCIAL_INSECURITY = "financial-insecurity",
  EMPLOYMENT = "employment-status",
  EDUCATION = "educational-attainment",
  HEALTH_LITERACY = "health-literacy",
  SOCIAL_CONNECTION = "social-connection",
  STRESS = "stress",
  INTIMATE_PARTNER_VIOLENCE = "intimate-partner-violence",
  VETERAN_STATUS = "veteran-status",
}

export const SDOHCategoryDisplay: Record<SDOHCategory, string> = {
  [SDOHCategory.FOOD_INSECURITY]: "Food Insecurity",
  [SDOHCategory.HOUSING_INSTABILITY]: "Housing Instability and Homelessness",
  [SDOHCategory.TRANSPORTATION_INSECURITY]: "Transportation Insecurity",
  [SDOHCategory.UTILITY_INSECURITY]: "Utility Insecurity",
  [SDOHCategory.INTERPERSONAL_SAFETY]: "Interpersonal Safety",
  [SDOHCategory.FINANCIAL_INSECURITY]: "Financial Insecurity",
  [SDOHCategory.EMPLOYMENT]: "Employment Status",
  [SDOHCategory.EDUCATION]: "Educational Attainment",
  [SDOHCategory.HEALTH_LITERACY]: "Health Literacy",
  [SDOHCategory.SOCIAL_CONNECTION]: "Social Connection",
  [SDOHCategory.STRESS]: "Stress",
  [SDOHCategory.INTIMATE_PARTNER_VIOLENCE]: "Intimate Partner Violence",
  [SDOHCategory.VETERAN_STATUS]: "Veteran Status",
};

/**
 * Health Concern FHIR Resource
 */
export interface HealthConcern {
  id?: string;
  resourceType: "Condition";
  clinicalStatus?: {
    coding: Array<{
      system: "http://terminology.hl7.org/CodeSystem/condition-clinical";
      code: ClinicalStatus;
      display?: string;
    }>;
  };
  verificationStatus?: {
    coding: Array<{
      system: "http://terminology.hl7.org/CodeSystem/condition-ver-status";
      code: VerificationStatus;
      display?: string;
    }>;
  };
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  severity?: {
    coding: Array<{
      system: "http://snomed.info/sct";
      code: Severity;
      display: string;
    }>;
  };
  code: {
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
    text?: string;
  };
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display?: string;
    }>;
  }>;
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
  };
  onsetDateTime?: string;
  onsetAge?: {
    value: number;
    unit: string;
    system: "http://unitsofmeasure.org";
    code: string;
  };
  onsetPeriod?: {
    start?: string;
    end?: string;
  };
  onsetRange?: {
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
  };
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: {
    value: number;
    unit: string;
  };
  abatementPeriod?: {
    start?: string;
    end?: string;
  };
  abatementRange?: {
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
  };
  abatementString?: string;
  recordedDate?: string;
  recorder?: {
    reference: string;
    display?: string;
  };
  asserter?: {
    reference: string;
    display?: string;
  };
  stage?: Array<{
    summary?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
    assessment?: Array<{
      reference: string;
    }>;
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    };
  }>;
  evidence?: Array<{
    code?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display?: string;
      }>;
    }>;
    detail?: Array<{
      reference: string;
    }>;
  }>;
  note?: Array<{
    authorReference?: {
      reference: string;
    };
    time?: string;
    text: string;
  }>;
}

/**
 * Helper function to create a health concern
 */
export function createHealthConcern(
  patientId: string,
  code: string,
  codeSystem: string,
  display: string,
  category: HealthConcernCategory,
  options?: {
    clinicalStatus?: ClinicalStatus;
    verificationStatus?: VerificationStatus;
    severity?: Severity;
    onsetDateTime?: string;
    encounterId?: string;
    recorderId?: string;
    note?: string;
  }
): HealthConcern {
  return {
    resourceType: "Condition",
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: options?.clinicalStatus || ClinicalStatus.ACTIVE,
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: options?.verificationStatus || VerificationStatus.CONFIRMED,
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/condition-category",
            code: category,
            display: HealthConcernCategoryDisplay[category],
          },
        ],
      },
    ],
    severity: options?.severity
      ? {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: options.severity,
              display: SeverityDisplay[options.severity],
            },
          ],
        }
      : undefined,
    code: {
      coding: [
        {
          system: codeSystem,
          code,
          display,
        },
      ],
      text: display,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    encounter: options?.encounterId
      ? {
          reference: `Encounter/${options.encounterId}`,
        }
      : undefined,
    onsetDateTime: options?.onsetDateTime,
    recordedDate: new Date().toISOString(),
    recorder: options?.recorderId
      ? {
          reference: `Practitioner/${options.recorderId}`,
        }
      : undefined,
    note: options?.note
      ? [
          {
            time: new Date().toISOString(),
            text: options.note,
          },
        ]
      : undefined,
  };
}

/**
 * Helper function to create an SDOH health concern
 */
export function createSDOHConcern(
  patientId: string,
  sdohCategory: SDOHCategory,
  code: string,
  display: string,
  options?: {
    clinicalStatus?: ClinicalStatus;
    verificationStatus?: VerificationStatus;
    severity?: Severity;
    onsetDateTime?: string;
    encounterId?: string;
    recorderId?: string;
    note?: string;
  }
): HealthConcern {
  return {
    resourceType: "Condition",
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: options?.clinicalStatus || ClinicalStatus.ACTIVE,
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: options?.verificationStatus || VerificationStatus.CONFIRMED,
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/core/CodeSystem/condition-category",
            code: "health-concern",
            display: "Health Concern",
          },
        ],
      },
      {
        coding: [
          {
            system: "http://hl7.org/fhir/us/sdoh-clinicalcare/CodeSystem/SDOHCC-CodeSystemTemporaryCodes",
            code: sdohCategory,
            display: SDOHCategoryDisplay[sdohCategory],
          },
        ],
      },
    ],
    severity: options?.severity
      ? {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: options.severity,
              display: SeverityDisplay[options.severity],
            },
          ],
        }
      : undefined,
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code,
          display,
        },
      ],
      text: display,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    encounter: options?.encounterId
      ? {
          reference: `Encounter/${options.encounterId}`,
        }
      : undefined,
    onsetDateTime: options?.onsetDateTime,
    recordedDate: new Date().toISOString(),
    recorder: options?.recorderId
      ? {
          reference: `Practitioner/${options.recorderId}`,
        }
      : undefined,
    note: options?.note
      ? [
          {
            time: new Date().toISOString(),
            text: options.note,
          },
        ]
      : undefined,
  };
}

/**
 * Helper function to update health concern status
 */
export function updateHealthConcernStatus(
  concern: HealthConcern,
  clinicalStatus: ClinicalStatus,
  abatementDateTime?: string
): HealthConcern {
  return {
    ...concern,
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: clinicalStatus,
        },
      ],
    },
    abatementDateTime,
  };
}

/**
 * Validation schemas
 */
export const HealthConcernSchema = z.object({
  resourceType: z.literal("Condition"),
  clinicalStatus: z
    .object({
      coding: z.array(
        z.object({
          system: z.literal("http://terminology.hl7.org/CodeSystem/condition-clinical"),
          code: z.nativeEnum(ClinicalStatus),
          display: z.string().optional(),
        })
      ),
    })
    .optional(),
  verificationStatus: z
    .object({
      coding: z.array(
        z.object({
          system: z.literal("http://terminology.hl7.org/CodeSystem/condition-ver-status"),
          code: z.nativeEnum(VerificationStatus),
          display: z.string().optional(),
        })
      ),
    })
    .optional(),
  category: z
    .array(
      z.object({
        coding: z.array(
          z.object({
            system: z.string(),
            code: z.string(),
            display: z.string().optional(),
          })
        ),
      })
    )
    .optional(),
  code: z.object({
    coding: z.array(
      z.object({
        system: z.string(),
        code: z.string(),
        display: z.string().optional(),
      })
    ),
    text: z.string().optional(),
  }),
  subject: z.object({
    reference: z.string(),
    display: z.string().optional(),
  }),
});

/**
 * Helper to validate health concern
 */
export function validateHealthConcern(concern: unknown): boolean {
  try {
    HealthConcernSchema.parse(concern);
    return true;
  } catch (error) {
    console.error("Health concern validation error:", error);
    return false;
  }
}

/**
 * Helper to filter concerns by category
 */
export function filterByCategory(
  concerns: HealthConcern[],
  category: string
): HealthConcern[] {
  return concerns.filter((concern) =>
    concern.category?.some((cat) =>
      cat.coding.some((coding) => coding.code === category)
    )
  );
}

/**
 * Helper to get active concerns
 */
export function getActiveConcerns(concerns: HealthConcern[]): HealthConcern[] {
  return concerns.filter(
    (concern) =>
      concern.clinicalStatus?.coding.some(
        (coding) => coding.code === ClinicalStatus.ACTIVE
      )
  );
}

/**
 * Helper to get SDOH concerns
 */
export function getSDOHConcerns(concerns: HealthConcern[]): HealthConcern[] {
  return concerns.filter((concern) =>
    concern.category?.some((cat) =>
      cat.coding.some(
        (coding) =>
          coding.system ===
          "http://hl7.org/fhir/us/sdoh-clinicalcare/CodeSystem/SDOHCC-CodeSystemTemporaryCodes"
      )
    )
  );
}

/**
 * ICD-10-CM Z-Code Mapper for SDOH Documentation
 * Maps SDOH screening results to billing codes
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// Z-Code Categories (ICD-10-CM)
// ============================================================================

export enum ZCodeCategory {
  HOUSING = "HOUSING",
  FOOD = "FOOD",
  TRANSPORTATION = "TRANSPORTATION",
  UTILITIES = "UTILITIES",
  EDUCATION = "EDUCATION",
  EMPLOYMENT = "EMPLOYMENT",
  FINANCIAL = "FINANCIAL",
  SOCIAL_SUPPORT = "SOCIAL_SUPPORT",
  SAFETY = "SAFETY",
  HEALTH_LITERACY = "HEALTH_LITERACY",
  ACCESS_TO_CARE = "ACCESS_TO_CARE",
  LEGAL = "LEGAL",
}

export interface ZCode {
  code: string;
  description: string;
  category: ZCodeCategory;
  subcategory?: string;
  billable: boolean;
  effectiveDate: Date;
  lastUpdated: Date;
  relatedCodes?: string[];
  keywords: string[];
  clinicalNotes?: string;
}

// ============================================================================
// Comprehensive Z-Code Database
// ============================================================================

export const Z_CODE_DATABASE: ZCode[] = [
  // Housing
  {
    code: "Z59.00",
    description: "Homelessness, unspecified",
    category: ZCodeCategory.HOUSING,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["homeless", "no housing", "unsheltered"],
    clinicalNotes: "Patient currently experiencing homelessness",
  },
  {
    code: "Z59.01",
    description: "Sheltered homelessness",
    category: ZCodeCategory.HOUSING,
    subcategory: "Emergency shelter",
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["shelter", "temporary housing", "emergency shelter"],
  },
  {
    code: "Z59.02",
    description: "Unsheltered homelessness",
    category: ZCodeCategory.HOUSING,
    subcategory: "Living on street",
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["street", "rough sleeping", "outdoors"],
  },
  {
    code: "Z59.1",
    description: "Inadequate housing",
    category: ZCodeCategory.HOUSING,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["substandard", "poor conditions", "unsafe housing"],
    relatedCodes: ["Z59.10", "Z59.11", "Z59.12"],
  },
  {
    code: "Z59.10",
    description: "Inadequate housing, unspecified",
    category: ZCodeCategory.HOUSING,
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["inadequate", "substandard"],
  },
  {
    code: "Z59.11",
    description: "Inadequate housing environmental temperature",
    category: ZCodeCategory.HOUSING,
    subcategory: "Temperature issues",
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["cold", "heat", "temperature", "no heating", "no cooling"],
  },
  {
    code: "Z59.12",
    description: "Inadequate housing utilities",
    category: ZCodeCategory.HOUSING,
    subcategory: "Utility issues",
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["no water", "no electricity", "utilities"],
  },
  {
    code: "Z59.2",
    description: "Discord with neighbors, lodgers and landlord",
    category: ZCodeCategory.HOUSING,
    subcategory: "Housing conflicts",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["conflict", "dispute", "landlord", "eviction"],
  },
  {
    code: "Z59.3",
    description: "Problems related to living in residential institution",
    category: ZCodeCategory.HOUSING,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["institutional", "group home", "facility"],
  },
  {
    code: "Z59.4",
    description: "Lack of adequate food",
    category: ZCodeCategory.FOOD,
    billable: false,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["food insecurity", "hunger", "insufficient food"],
    relatedCodes: ["Z59.41", "Z59.48"],
  },
  {
    code: "Z59.41",
    description: "Food insecurity",
    category: ZCodeCategory.FOOD,
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["food insecurity", "limited food", "food access"],
  },
  {
    code: "Z59.48",
    description: "Other specified lack of adequate food",
    category: ZCodeCategory.FOOD,
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["nutritional", "dietary", "food quality"],
  },

  // Transportation
  {
    code: "Z59.82",
    description: "Transportation insecurity",
    category: ZCodeCategory.TRANSPORTATION,
    billable: true,
    effectiveDate: new Date("2022-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["transportation", "no car", "public transit", "mobility"],
  },

  // Utilities
  {
    code: "Z59.86",
    description: "Financial insecurity",
    category: ZCodeCategory.FINANCIAL,
    billable: true,
    effectiveDate: new Date("2022-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["financial", "money", "poverty", "low income"],
  },
  {
    code: "Z59.87",
    description: "Material hardship",
    category: ZCodeCategory.FINANCIAL,
    billable: true,
    effectiveDate: new Date("2022-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["hardship", "material needs", "basic needs"],
  },

  // Education and Literacy
  {
    code: "Z55.0",
    description: "Illiteracy and low-level literacy",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["illiterate", "reading", "literacy"],
  },
  {
    code: "Z55.1",
    description: "Schooling unavailable and unattainable",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["no school", "education access"],
  },
  {
    code: "Z55.2",
    description: "Failed school examinations",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["academic", "failure", "exams"],
  },
  {
    code: "Z55.3",
    description: "Underachievement in school",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["underperform", "academic difficulty"],
  },
  {
    code: "Z55.4",
    description: "Educational maladjustment and discord with teachers and classmates",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["school problems", "bullying", "conflict"],
  },
  {
    code: "Z55.5",
    description: "Less than a high school diploma",
    category: ZCodeCategory.EDUCATION,
    billable: true,
    effectiveDate: new Date("2023-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["education level", "no diploma", "dropout"],
  },

  // Employment
  {
    code: "Z56.0",
    description: "Unemployment, unspecified",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["unemployed", "jobless", "no work"],
  },
  {
    code: "Z56.1",
    description: "Change of job",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["job change", "new job", "transition"],
  },
  {
    code: "Z56.2",
    description: "Threat of job loss",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["layoff", "termination", "job security"],
  },
  {
    code: "Z56.3",
    description: "Stressful work schedule",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["work stress", "schedule", "hours"],
  },
  {
    code: "Z56.4",
    description: "Discord with boss and workmates",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["workplace conflict", "boss", "coworkers"],
  },
  {
    code: "Z56.5",
    description: "Uncongenial work environment",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["hostile", "toxic workplace", "harassment"],
  },
  {
    code: "Z56.6",
    description: "Other physical and mental strain related to work",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["burnout", "work stress", "occupational"],
  },
  {
    code: "Z56.81",
    description: "Sexual harassment on the job",
    category: ZCodeCategory.EMPLOYMENT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["harassment", "sexual", "workplace"],
  },
  {
    code: "Z56.82",
    description: "Military deployment status",
    category: ZCodeCategory.EMPLOYMENT,
    subcategory: "Military",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["military", "deployment", "veteran"],
  },

  // Financial Circumstances
  {
    code: "Z59.5",
    description: "Extreme poverty",
    category: ZCodeCategory.FINANCIAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["poverty", "destitute", "poor"],
  },
  {
    code: "Z59.6",
    description: "Low income",
    category: ZCodeCategory.FINANCIAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["low income", "limited resources"],
  },
  {
    code: "Z59.7",
    description: "Insufficient social insurance and welfare support",
    category: ZCodeCategory.FINANCIAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["benefits", "welfare", "insurance"],
  },

  // Social Support and Isolation
  {
    code: "Z60.2",
    description: "Problems related to living alone",
    category: ZCodeCategory.SOCIAL_SUPPORT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["isolation", "alone", "lonely"],
  },
  {
    code: "Z60.3",
    description: "Acculturation difficulty",
    category: ZCodeCategory.SOCIAL_SUPPORT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["cultural", "immigrant", "adaptation"],
  },
  {
    code: "Z60.4",
    description: "Social exclusion and rejection",
    category: ZCodeCategory.SOCIAL_SUPPORT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["excluded", "rejected", "discrimination"],
  },
  {
    code: "Z60.5",
    description: "Target of (perceived) adverse discrimination and persecution",
    category: ZCodeCategory.SOCIAL_SUPPORT,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["discrimination", "persecution", "bias"],
  },

  // Safety and Violence
  {
    code: "Z69.010",
    description: "Encounter for mental health services for victim of parental child abuse",
    category: ZCodeCategory.SAFETY,
    subcategory: "Child abuse",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["child abuse", "victim", "parental"],
  },
  {
    code: "Z69.011",
    description: "Encounter for mental health services for perpetrator of parental child abuse",
    category: ZCodeCategory.SAFETY,
    subcategory: "Child abuse",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["child abuse", "perpetrator", "parental"],
  },
  {
    code: "Z69.11",
    description: "Encounter for mental health services for victim of spousal or partner abuse",
    category: ZCodeCategory.SAFETY,
    subcategory: "Domestic violence",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["domestic violence", "intimate partner", "abuse"],
  },
  {
    code: "Z69.12",
    description: "Encounter for mental health services for perpetrator of spousal or partner abuse",
    category: ZCodeCategory.SAFETY,
    subcategory: "Domestic violence",
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["domestic violence", "perpetrator", "abuse"],
  },
  {
    code: "Z91.410",
    description: "Personal history of adult physical and sexual abuse",
    category: ZCodeCategory.SAFETY,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["history", "abuse", "trauma"],
  },
  {
    code: "Z91.411",
    description: "Personal history of adult psychological abuse",
    category: ZCodeCategory.SAFETY,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["psychological", "emotional abuse", "history"],
  },

  // Health Literacy and Access to Care
  {
    code: "Z59.89",
    description: "Other problems related to housing and economic circumstances",
    category: ZCodeCategory.ACCESS_TO_CARE,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["other housing", "economic"],
  },
  {
    code: "Z75.3",
    description: "Unavailability and inaccessibility of health-care facilities",
    category: ZCodeCategory.ACCESS_TO_CARE,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["no access", "healthcare", "facilities"],
  },
  {
    code: "Z75.4",
    description: "Unavailability and inaccessibility of other helping agencies",
    category: ZCodeCategory.ACCESS_TO_CARE,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["services", "agencies", "access"],
  },

  // Legal Issues
  {
    code: "Z65.0",
    description: "Conviction in civil and criminal proceedings without imprisonment",
    category: ZCodeCategory.LEGAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["legal", "conviction", "criminal"],
  },
  {
    code: "Z65.1",
    description: "Imprisonment and other incarceration",
    category: ZCodeCategory.LEGAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["prison", "jail", "incarceration"],
  },
  {
    code: "Z65.2",
    description: "Problems related to release from prison",
    category: ZCodeCategory.LEGAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["reentry", "release", "prison"],
  },
  {
    code: "Z65.3",
    description: "Problems related to other legal circumstances",
    category: ZCodeCategory.LEGAL,
    billable: true,
    effectiveDate: new Date("2016-10-01"),
    lastUpdated: new Date("2024-10-01"),
    keywords: ["legal issues", "court", "custody"],
  },
];

// ============================================================================
// Z-Code Mapping Functions
// ============================================================================

export interface ZCodeMapping {
  zCode: ZCode;
  confidence: number; // 0-1 score
  reasoning: string;
  supportingData: string[];
}

/**
 * Map SDOH screening results to appropriate Z-codes
 */
export function mapScreeningToZCodes(
  identifiedNeeds: string[],
  responses: Record<string, any>
): ZCodeMapping[] {
  const mappings: ZCodeMapping[] = [];

  identifiedNeeds.forEach((need) => {
    const codes = findRelevantZCodes(need);
    codes.forEach((code) => {
      mappings.push({
        zCode: code,
        confidence: calculateConfidence(need, code, responses),
        reasoning: `Based on identified need: ${need}`,
        supportingData: extractSupportingData(need, responses),
      });
    });
  });

  // Sort by confidence
  return mappings.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find Z-codes relevant to a specific need
 */
export function findRelevantZCodes(need: string): ZCode[] {
  const needLower = need.toLowerCase();
  return Z_CODE_DATABASE.filter(
    (code) =>
      code.keywords.some((keyword) => needLower.includes(keyword.toLowerCase())) ||
      code.description.toLowerCase().includes(needLower) ||
      code.category.toLowerCase().includes(needLower)
  );
}

/**
 * Search Z-codes by keyword
 */
export function searchZCodes(query: string): ZCode[] {
  const queryLower = query.toLowerCase();
  return Z_CODE_DATABASE.filter(
    (code) =>
      code.code.toLowerCase().includes(queryLower) ||
      code.description.toLowerCase().includes(queryLower) ||
      code.keywords.some((keyword) => keyword.toLowerCase().includes(queryLower))
  );
}

/**
 * Get Z-codes by category
 */
export function getZCodesByCategory(category: ZCodeCategory): ZCode[] {
  return Z_CODE_DATABASE.filter((code) => code.category === category);
}

/**
 * Validate Z-code
 */
export function validateZCode(code: string): boolean {
  return Z_CODE_DATABASE.some((zCode) => zCode.code === code);
}

/**
 * Get Z-code details
 */
export function getZCodeDetails(code: string): ZCode | undefined {
  return Z_CODE_DATABASE.find((zCode) => zCode.code === code);
}

/**
 * Calculate confidence score for Z-code mapping
 */
function calculateConfidence(
  need: string,
  code: ZCode,
  responses: Record<string, any>
): number {
  let confidence = 0.5; // Base confidence

  // Exact keyword match
  const needLower = need.toLowerCase();
  if (code.keywords.some((keyword) => needLower === keyword.toLowerCase())) {
    confidence += 0.3;
  }

  // Partial keyword match
  if (
    code.keywords.some((keyword) => needLower.includes(keyword.toLowerCase()))
  ) {
    confidence += 0.15;
  }

  // Category match
  if (code.category.toLowerCase().includes(needLower)) {
    confidence += 0.1;
  }

  // Response data support
  if (responses && Object.keys(responses).length > 0) {
    confidence += 0.05;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Extract supporting data from responses
 */
function extractSupportingData(
  need: string,
  responses: Record<string, any>
): string[] {
  const supportingData: string[] = [];

  Object.entries(responses).forEach(([question, answer]) => {
    if (
      question.toLowerCase().includes(need.toLowerCase()) ||
      String(answer).toLowerCase().includes(need.toLowerCase())
    ) {
      supportingData.push(`${question}: ${answer}`);
    }
  });

  return supportingData;
}

// ============================================================================
// Billing Integration
// ============================================================================

export interface ZCodeBillingEntry {
  zCode: string;
  description: string;
  patientId: string;
  encounterId: string;
  providerId: string;
  diagnosisDate: Date;
  isPrimary: boolean;
  sequenceNumber: number;
  documentationUrl?: string;
  notes?: string;
}

/**
 * Prepare Z-codes for billing submission
 */
export function prepareForBilling(
  mappings: ZCodeMapping[],
  patientId: string,
  encounterId: string,
  providerId: string
): ZCodeBillingEntry[] {
  return mappings
    .filter((mapping) => mapping.zCode.billable && mapping.confidence >= 0.7)
    .map((mapping, index) => ({
      zCode: mapping.zCode.code,
      description: mapping.zCode.description,
      patientId,
      encounterId,
      providerId,
      diagnosisDate: new Date(),
      isPrimary: index === 0,
      sequenceNumber: index + 1,
      notes: mapping.reasoning,
    }));
}

// ============================================================================
// Validation Schema
// ============================================================================

export const ZCodeMappingSchema = z.object({
  identifiedNeeds: z.array(z.string()),
  responses: z.record(z.any()),
  patientId: z.string(),
  encounterId: z.string(),
  providerId: z.string(),
});

export const ZCodeBillingSchema = z.object({
  zCode: z.string(),
  description: z.string(),
  patientId: z.string(),
  encounterId: z.string(),
  providerId: z.string(),
  diagnosisDate: z.date(),
  isPrimary: z.boolean(),
  sequenceNumber: z.number(),
  documentationUrl: z.string().optional(),
  notes: z.string().optional(),
});

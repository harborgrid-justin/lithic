/**
 * ICD-10 Z-Code Auto-Suggestion Engine
 *
 * Intelligent mapping system for suggesting appropriate ICD-10 Z-codes (Z55-Z65)
 * based on SDOH screening responses and identified needs.
 */

import type {
  ZCode,
  ZCodeSuggestion,
  SDOHDomain,
  SDOHScreening,
  IdentifiedNeed,
  ZCodeCategory,
} from "@/types/sdoh";

// ============================================================================
// Z-Code Database (Z55-Z65 SDOH Codes)
// ============================================================================

export const Z_CODE_DATABASE: ZCode[] = [
  // Z55 - Problems related to education and literacy
  {
    code: "Z55.0",
    display: "Illiteracy and low-level literacy",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Problems with reading and writing skills",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Use for patients with documented literacy challenges",
  },
  {
    code: "Z55.1",
    display: "Schooling unavailable and unattainable",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Lack of access to education",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z55.2",
    display: "Failed school examinations",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Academic challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z55.3",
    display: "Underachievement in school",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Educational performance issues",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z55.4",
    display: "Educational maladjustment and discord with teachers and classmates",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Social challenges in educational setting",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z55.8",
    display: "Other problems related to education and literacy",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Other educational challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z55.9",
    display: "Problems related to education and literacy, unspecified",
    category: "Z55",
    domain: SDOHDomain.EDUCATION,
    description: "Unspecified educational problems",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z56 - Problems related to employment and unemployment
  {
    code: "Z56.0",
    display: "Unemployment, unspecified",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Patient is unemployed",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Document impact on health",
  },
  {
    code: "Z56.1",
    display: "Change of job",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Recent job change causing stress",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.2",
    display: "Threat of job loss",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Risk of unemployment",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.3",
    display: "Stressful work schedule",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Work schedule impacting health",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.4",
    display: "Discord with boss and workmates",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Workplace relationship problems",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.5",
    display: "Uncongenial work environment",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Poor working conditions",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.6",
    display: "Other physical and mental strain related to work",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Work-related stress",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.81",
    display: "Sexual harassment on the job",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Workplace harassment",
    parent: "Z56.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.82",
    display: "Military deployment status",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Military service affecting health",
    parent: "Z56.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z56.9",
    display: "Other problems related to employment",
    category: "Z56",
    domain: SDOHDomain.EMPLOYMENT,
    description: "Unspecified employment problems",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z59 - Problems related to housing and economic circumstances
  {
    code: "Z59.0",
    display: "Homelessness",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "Patient lacks stable housing",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Critical SDOH factor",
  },
  {
    code: "Z59.1",
    display: "Inadequate housing",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "Substandard housing conditions",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Include mold, pests, lack of utilities",
  },
  {
    code: "Z59.2",
    display: "Discord with neighbors, lodgers, and landlord",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "Housing-related conflicts",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z59.3",
    display: "Problems related to living in residential institution",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "Institutional living challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z59.4",
    display: "Lack of adequate food and safe drinking water",
    category: "Z59",
    domain: SDOHDomain.FOOD_INSECURITY,
    description: "Food and water insecurity",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Critical for nutrition-related conditions",
  },
  {
    code: "Z59.5",
    display: "Extreme poverty",
    category: "Z59",
    domain: SDOHDomain.FINANCIAL_STRAIN,
    description: "Severe financial hardship",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z59.6",
    display: "Low income",
    category: "Z59",
    domain: SDOHDomain.FINANCIAL_STRAIN,
    description: "Financial constraints",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z59.7",
    display: "Insufficient social insurance and welfare support",
    category: "Z59",
    domain: SDOHDomain.FINANCIAL_STRAIN,
    description: "Lack of social safety net",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z59.81",
    display: "Housing instability, housed",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "At risk of homelessness",
    parent: "Z59.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2017-10-01"),
    notes: "New code for housing insecurity",
  },
  {
    code: "Z59.82",
    display: "Transportation insecurity",
    category: "Z59",
    domain: SDOHDomain.TRANSPORTATION,
    description: "Lack of reliable transportation",
    parent: "Z59.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    notes: "Important for access to care",
  },
  {
    code: "Z59.86",
    display: "Financial insecurity",
    category: "Z59",
    domain: SDOHDomain.FINANCIAL_STRAIN,
    description: "Economic instability",
    parent: "Z59.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    notes: null,
  },
  {
    code: "Z59.87",
    display: "Food insecurity",
    category: "Z59",
    domain: SDOHDomain.FOOD_INSECURITY,
    description: "Uncertain access to food",
    parent: "Z59.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2020-10-01"),
    notes: "Preferred code for food insecurity",
  },
  {
    code: "Z59.89",
    display: "Other problems related to housing and economic circumstances",
    category: "Z59",
    domain: SDOHDomain.HOUSING_INSTABILITY,
    description: "Other housing/economic issues",
    parent: "Z59.8",
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z60 - Problems related to social environment
  {
    code: "Z60.0",
    display: "Problems of adjustment to life-cycle transitions",
    category: "Z60",
    domain: SDOHDomain.SOCIAL_ISOLATION,
    description: "Life transition challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z60.2",
    display: "Problems related to living alone",
    category: "Z60",
    domain: SDOHDomain.SOCIAL_ISOLATION,
    description: "Social isolation",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Important for mental health",
  },
  {
    code: "Z60.3",
    display: "Acculturation difficulty",
    category: "Z60",
    domain: SDOHDomain.HEALTHCARE_ACCESS,
    description: "Cultural adaptation challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Include language barriers",
  },
  {
    code: "Z60.4",
    display: "Social exclusion and rejection",
    category: "Z60",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Social discrimination",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z60.5",
    display: "Target of (perceived) adverse discrimination and persecution",
    category: "Z60",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Discrimination experience",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z62 - Problems related to upbringing
  {
    code: "Z62.810",
    display: "Personal history of physical and sexual abuse in childhood",
    category: "Z62",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Childhood abuse history",
    parent: "Z62.81",
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Trauma-informed care important",
  },
  {
    code: "Z62.820",
    display: "Parent-child conflict",
    category: "Z62",
    domain: SDOHDomain.CHILDCARE,
    description: "Family relationship problems",
    parent: "Z62.82",
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z63 - Other problems related to primary support group
  {
    code: "Z63.0",
    display: "Problems in relationship with spouse or partner",
    category: "Z63",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Relationship challenges",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z63.4",
    display: "Disappearance and death of family member",
    category: "Z63",
    domain: SDOHDomain.SOCIAL_ISOLATION,
    description: "Loss of family support",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z63.5",
    display: "Disruption of family by separation and divorce",
    category: "Z63",
    domain: SDOHDomain.SOCIAL_ISOLATION,
    description: "Family breakdown",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z63.6",
    display: "Dependent relative needing care at home",
    category: "Z63",
    domain: SDOHDomain.CHILDCARE,
    description: "Caregiver burden",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z65 - Problems related to other psychosocial circumstances
  {
    code: "Z65.0",
    display: "Conviction in civil and criminal proceedings without imprisonment",
    category: "Z65",
    domain: SDOHDomain.LEGAL_ISSUES,
    description: "Legal problems",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z65.1",
    display: "Imprisonment and other incarceration",
    category: "Z65",
    domain: SDOHDomain.LEGAL_ISSUES,
    description: "Incarceration",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z65.3",
    display: "Problems related to other legal circumstances",
    category: "Z65",
    domain: SDOHDomain.LEGAL_ISSUES,
    description: "Other legal issues",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z65.4",
    display: "Victim of crime and terrorism",
    category: "Z65",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Crime victimization",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z65.5",
    display: "Exposure to disaster, war and other hostilities",
    category: "Z65",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Trauma exposure",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },
  {
    code: "Z65.8",
    display: "Other specified problems related to psychosocial circumstances",
    category: "Z65",
    domain: SDOHDomain.SOCIAL_ISOLATION,
    description: "Other psychosocial problems",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: null,
  },

  // Z69 - Encounter for mental health services for victim and perpetrator of abuse
  {
    code: "Z69.11",
    display: "Encounter for mental health services for victim of spouse or partner psychological abuse",
    category: "Z65",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Intimate partner violence - psychological",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Screen for IPV",
  },
  {
    code: "Z69.12",
    display: "Encounter for mental health services for victim of spouse or partner violence, physical",
    category: "Z65",
    domain: SDOHDomain.INTERPERSONAL_SAFETY,
    description: "Intimate partner violence - physical",
    parent: null,
    children: [],
    billable: true,
    effectiveDate: new Date("2015-10-01"),
    notes: "Safety planning critical",
  },
];

// ============================================================================
// Z-Code Mapper Class
// ============================================================================

export class ZCodeMapper {
  private zCodeIndex: Map<string, ZCode>;
  private domainIndex: Map<SDOHDomain, ZCode[]>;

  constructor() {
    this.zCodeIndex = new Map();
    this.domainIndex = new Map();
    this.buildIndexes();
  }

  /**
   * Generate Z-code suggestions from screening results
   */
  suggestZCodes(screening: SDOHScreening): ZCodeSuggestion[] {
    const suggestions: ZCodeSuggestion[] = [];
    const seenCodes = new Set<string>();

    // Generate suggestions from identified needs
    for (const need of screening.identifiedNeeds) {
      const needSuggestions = this.suggestForNeed(need, screening);
      for (const suggestion of needSuggestions) {
        if (!seenCodes.has(suggestion.zCode.code)) {
          suggestions.push(suggestion);
          seenCodes.add(suggestion.zCode.code);
        }
      }
    }

    // Generate suggestions from high-risk responses
    for (const response of screening.responses) {
      if (response.riskIndicator) {
        const responseSuggestions = this.suggestFromResponse(
          response,
          screening
        );
        for (const suggestion of responseSuggestions) {
          if (!seenCodes.has(suggestion.zCode.code)) {
            suggestions.push(suggestion);
            seenCodes.add(suggestion.zCode.code);
          }
        }
      }
    }

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get Z-code by code string
   */
  getZCode(code: string): ZCode | undefined {
    return this.zCodeIndex.get(code);
  }

  /**
   * Get all Z-codes for a domain
   */
  getZCodesByDomain(domain: SDOHDomain): ZCode[] {
    return this.domainIndex.get(domain) || [];
  }

  /**
   * Search Z-codes by description
   */
  searchZCodes(query: string): ZCode[] {
    const lowerQuery = query.toLowerCase();
    return Z_CODE_DATABASE.filter(
      (zCode) =>
        zCode.code.toLowerCase().includes(lowerQuery) ||
        zCode.display.toLowerCase().includes(lowerQuery) ||
        zCode.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Validate Z-code applicability
   */
  validateZCode(
    code: string,
    screening: SDOHScreening
  ): { valid: boolean; reason: string } {
    const zCode = this.zCodeIndex.get(code);

    if (!zCode) {
      return { valid: false, reason: "Z-code not found in database" };
    }

    // Check if domain is relevant to screening results
    const relevantDomains = screening.identifiedNeeds.map((n) => n.domain);
    if (!relevantDomains.includes(zCode.domain)) {
      return {
        valid: false,
        reason: "Z-code domain not relevant to identified needs",
      };
    }

    // Check if code is billable
    if (!zCode.billable) {
      return { valid: false, reason: "Z-code is not billable" };
    }

    return { valid: true, reason: "Z-code is valid and applicable" };
  }

  /**
   * Get related Z-codes (e.g., parent/children)
   */
  getRelatedZCodes(code: string): ZCode[] {
    const zCode = this.zCodeIndex.get(code);
    if (!zCode) return [];

    const related: ZCode[] = [];

    // Add children
    for (const childCode of zCode.children) {
      const child = this.zCodeIndex.get(childCode);
      if (child) related.push(child);
    }

    // Add parent
    if (zCode.parent) {
      const parent = this.zCodeIndex.get(zCode.parent);
      if (parent) related.push(parent);
    }

    return related;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildIndexes(): void {
    for (const zCode of Z_CODE_DATABASE) {
      this.zCodeIndex.set(zCode.code, zCode);

      const domainCodes = this.domainIndex.get(zCode.domain) || [];
      domainCodes.push(zCode);
      this.domainIndex.set(zCode.domain, domainCodes);
    }
  }

  private suggestForNeed(
    need: IdentifiedNeed,
    screening: SDOHScreening
  ): ZCodeSuggestion[] {
    const suggestions: ZCodeSuggestion[] = [];
    const domainCodes = this.getZCodesByDomain(need.domain);

    for (const zCode of domainCodes) {
      const confidence = this.calculateConfidence(
        zCode,
        need,
        screening.responses
      );

      if (confidence > 50) {
        suggestions.push({
          zCode,
          confidence,
          reasoning: this.generateReasoning(zCode, need),
          sourceQuestions: this.findSourceQuestions(need.domain, screening),
          domain: need.domain,
          autoApply: confidence > 85,
        });
      }
    }

    return suggestions;
  }

  private suggestFromResponse(
    response: any,
    screening: SDOHScreening
  ): ZCodeSuggestion[] {
    const suggestions: ZCodeSuggestion[] = [];
    const domainCodes = this.getZCodesByDomain(response.domain);

    for (const zCode of domainCodes) {
      // Simple matching logic
      if (this.responseMatchesZCode(response, zCode)) {
        suggestions.push({
          zCode,
          confidence: 70,
          reasoning: `Based on response to: "${response.questionText}"`,
          sourceQuestions: [response.questionId],
          domain: response.domain,
          autoApply: false,
        });
      }
    }

    return suggestions;
  }

  private calculateConfidence(
    zCode: ZCode,
    need: IdentifiedNeed,
    responses: any[]
  ): number {
    let confidence = 60; // Base confidence

    // Increase confidence based on severity
    if (need.severity === "CRITICAL") confidence += 20;
    else if (need.severity === "HIGH") confidence += 15;
    else if (need.severity === "MODERATE") confidence += 10;

    // Increase confidence if multiple responses support this code
    const supportingResponses = responses.filter(
      (r) => r.domain === zCode.domain && r.riskIndicator
    );
    confidence += Math.min(supportingResponses.length * 5, 20);

    return Math.min(confidence, 100);
  }

  private generateReasoning(zCode: ZCode, need: IdentifiedNeed): string {
    return `${zCode.display} is recommended for ${need.category} with ${need.severity} severity level. ${zCode.description}`;
  }

  private findSourceQuestions(
    domain: SDOHDomain,
    screening: SDOHScreening
  ): string[] {
    return screening.responses
      .filter((r) => r.domain === domain && r.riskIndicator)
      .map((r) => r.questionId);
  }

  private responseMatchesZCode(response: any, zCode: ZCode): boolean {
    // Simple keyword matching
    const keywords = zCode.display.toLowerCase().split(" ");
    const responseText = response.answerText.toLowerCase();

    return keywords.some((keyword) => responseText.includes(keyword));
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format Z-code for display
 */
export function formatZCode(zCode: ZCode): string {
  return `${zCode.code} - ${zCode.display}`;
}

/**
 * Group Z-codes by category
 */
export function groupZCodesByCategory(
  zCodes: ZCode[]
): Map<ZCodeCategory, ZCode[]> {
  const grouped = new Map<ZCodeCategory, ZCode[]>();

  for (const zCode of zCodes) {
    const category = zCode.category;
    const existing = grouped.get(category) || [];
    existing.push(zCode);
    grouped.set(category, existing);
  }

  return grouped;
}

/**
 * Export singleton instance
 */
export const zCodeMapper = new ZCodeMapper();

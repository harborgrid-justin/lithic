/**
 * MIPS Promoting Interoperability (PI) Category
 * Formerly Advancing Care Information (ACI)
 * Measures related to EHR use, e-prescribing, and health information exchange
 */

export type MeasurePerformanceMethod = "proportion" | "yes-no";

export interface PIObjective {
  objectiveId: string;
  objectiveName: string;
  required: boolean;
  measures: PIMeasure[];
}

export interface PIMeasure {
  measureId: string;
  measureName: string;
  description: string;
  objective: string;
  performanceMethod: MeasurePerformanceMethod;
  required: boolean;
  basePoints: number;
  bonusPoints: number;

  // Performance data
  numerator: number;
  denominator: number;
  performanceScore: number;

  // Threshold
  performanceThreshold: number;
  meetsThreshold: boolean;

  // Attestation (for yes/no measures)
  attested?: boolean;

  // Exclusions
  exclusionClaimed: boolean;
  exclusionReason?: string;
}

export interface PICategory {
  totalBasePoints: number;
  totalBonusPoints: number;
  totalPoints: number;
  maxBasePoints: number;
  categoryScore: number;
  categoryWeight: number;
  weightedScore: number;

  objectives: PIObjective[];

  // Special considerations
  securityRiskAnalysisConducted: boolean;
  ehrcertificationId: string;
  smallPracticeBonus: boolean;
}

// ============================================================================
// PI Measure Definitions
// ============================================================================

/**
 * Get PI measure specifications
 */
export function getPIMeasureDefinition(measureId: string): Partial<PIMeasure> {
  const measures: Record<string, Partial<PIMeasure>> = {
    // e-Prescribing Objective
    "PI_EP_1": {
      measureId: "PI_EP_1",
      measureName: "e-Prescribing",
      description: "At least one permissible prescription written by the MIPS eligible clinician is queried for a drug formulary and transmitted electronically using CEHRT",
      objective: "e-Prescribing",
      performanceMethod: "proportion",
      required: true,
      basePoints: 10,
      bonusPoints: 5,
      performanceThreshold: 60,
    },

    "PI_LVPP_1": {
      measureId: "PI_LVPP_1",
      measureName: "Query of Prescription Drug Monitoring Program (PDMP)",
      description: "For at least one Schedule II opioid electronically prescribed using CEHRT, the MIPS eligible clinician uses data from CEHRT to conduct a query of a PDMP for prescription drug history",
      objective: "e-Prescribing",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 0,
      bonusPoints: 5,
      performanceThreshold: 0,
    },

    // Health Information Exchange Objective
    "PI_HIE_1": {
      measureId: "PI_HIE_1",
      measureName: "Support Electronic Referral Loops by Sending Health Information",
      description: "For at least one transition of care or referral, the MIPS eligible clinician that transitions or refers their patient to another setting of care or health care clinician creates a summary of care record using CEHRT and electronically exchanges the summary of care record",
      objective: "Health Information Exchange",
      performanceMethod: "proportion",
      required: true,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 50,
    },

    "PI_HIE_2": {
      measureId: "PI_HIE_2",
      measureName: "Support Electronic Referral Loops by Receiving and Incorporating Health Information",
      description: "For at least one electronically received transition of care or referral, the MIPS eligible clinician receives or retrieves and incorporates into the patient's record an electronic summary of care document",
      objective: "Health Information Exchange",
      performanceMethod: "proportion",
      required: true,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 50,
    },

    "PI_HIE_3": {
      measureId: "PI_HIE_3",
      measureName: "Health Information Exchange (HIE) Bi-Directional Exchange",
      description: "MIPS eligible clinician enables secure bi-directional exchange with a public health agency, health information exchange or other entity to support the timely exchange of health information",
      objective: "Health Information Exchange",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 0,
      bonusPoints: 5,
      performanceThreshold: 0,
    },

    // Provider to Patient Exchange
    "PI_PEA_1": {
      measureId: "PI_PEA_1",
      measureName: "Provide Patients Electronic Access to Their Health Information",
      description: "For at least one unique patient seen during the performance period, the patient (or patient-authorized representative) is provided timely access to view online, download, and transmit their health information",
      objective: "Provider to Patient Exchange",
      performanceMethod: "proportion",
      required: true,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 80,
    },

    "PI_PEA_2": {
      measureId: "PI_PEA_2",
      measureName: "Patient-Specific Education",
      description: "Patient-specific education resources are identified and provided to patients",
      objective: "Provider to Patient Exchange",
      performanceMethod: "proportion",
      required: false,
      basePoints: 0,
      bonusPoints: 5,
      performanceThreshold: 50,
    },

    // Public Health and Clinical Data Exchange
    "PI_PHCDRR_1": {
      measureId: "PI_PHCDRR_1",
      measureName: "Immunization Registry Reporting",
      description: "The MIPS eligible clinician is in active engagement to submit immunization data to an immunization registry",
      objective: "Public Health and Clinical Data Exchange",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 0,
    },

    "PI_PHCDRR_2": {
      measureId: "PI_PHCDRR_2",
      measureName: "Electronic Case Reporting",
      description: "The MIPS eligible clinician is in active engagement to submit reportable diseases and conditions to a public health agency",
      objective: "Public Health and Clinical Data Exchange",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 0,
    },

    "PI_PHCDRR_3": {
      measureId: "PI_PHCDRR_3",
      measureName: "Public Health Registry Reporting",
      description: "The MIPS eligible clinician is in active engagement to submit data to a public health registry",
      objective: "Public Health and Clinical Data Exchange",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 0,
    },

    "PI_PHCDRR_4": {
      measureId: "PI_PHCDRR_4",
      measureName: "Clinical Data Registry Reporting",
      description: "The MIPS eligible clinician is in active engagement to submit data to a clinical data registry",
      objective: "Public Health and Clinical Data Exchange",
      performanceMethod: "yes-no",
      required: false,
      basePoints: 10,
      bonusPoints: 0,
      performanceThreshold: 0,
    },
  };

  return measures[measureId] || {};
}

// ============================================================================
// Measure Performance Calculation
// ============================================================================

/**
 * Calculate PI measure performance
 */
export function calculatePIMeasurePerformance(
  measureId: string,
  numerator: number,
  denominator: number,
  attested?: boolean,
): PIMeasure {
  const definition = getPIMeasureDefinition(measureId);

  const performanceScore = definition.performanceMethod === "yes-no"
    ? (attested ? 100 : 0)
    : (denominator > 0 ? (numerator / denominator) * 100 : 0);

  const meetsThreshold = performanceScore >= (definition.performanceThreshold || 0);

  return {
    measureId,
    measureName: definition.measureName || "",
    description: definition.description || "",
    objective: definition.objective || "",
    performanceMethod: definition.performanceMethod || "proportion",
    required: definition.required || false,
    basePoints: definition.basePoints || 0,
    bonusPoints: definition.bonusPoints || 0,
    numerator,
    denominator,
    performanceScore,
    performanceThreshold: definition.performanceThreshold || 0,
    meetsThreshold,
    attested,
    exclusionClaimed: false,
  };
}

// ============================================================================
// PI Category Scoring
// ============================================================================

/**
 * Calculate PI category score
 */
export function calculatePICategoryScore(
  measures: PIMeasure[],
  securityRiskAnalysisConducted: boolean,
  isSmallPractice: boolean = false,
  categoryWeight: number = 0.25, // 25% in 2024+
): PICategory {
  // Security Risk Analysis is required - if not conducted, score = 0
  if (!securityRiskAnalysisConducted) {
    return {
      totalBasePoints: 0,
      totalBonusPoints: 0,
      totalPoints: 0,
      maxBasePoints: 50,
      categoryScore: 0,
      categoryWeight,
      weightedScore: 0,
      objectives: [],
      securityRiskAnalysisConducted: false,
      ehrcertificationId: "",
      smallPracticeBonus: false,
    };
  }

  let totalBasePoints = 0;
  let totalBonusPoints = 0;
  const maxBasePoints = 50;

  // Calculate points from measures
  measures.forEach(measure => {
    if (measure.exclusionClaimed) {
      return; // Skip excluded measures
    }

    if (measure.required) {
      // Required measures: earn points if threshold met
      if (measure.meetsThreshold) {
        totalBasePoints += measure.basePoints;
        totalBonusPoints += measure.bonusPoints;
      }
    } else {
      // Optional measures (yes/no or bonus)
      if (measure.performanceMethod === "yes-no" && measure.attested) {
        totalBasePoints += measure.basePoints;
        totalBonusPoints += measure.bonusPoints;
      } else if (measure.performanceMethod === "proportion" && measure.meetsThreshold) {
        totalBonusPoints += measure.bonusPoints;
      }
    }
  });

  // Small practice bonus
  let smallPracticeBonus = false;
  if (isSmallPractice) {
    totalBonusPoints += 5;
    smallPracticeBonus = true;
  }

  const totalPoints = totalBasePoints + totalBonusPoints;

  // Calculate category score (base + bonus, capped at 100)
  const categoryScore = Math.min(100, (totalPoints / maxBasePoints) * 100);

  const weightedScore = categoryScore * categoryWeight;

  // Group measures by objective
  const objectivesMap = new Map<string, PIObjective>();

  measures.forEach(measure => {
    if (!objectivesMap.has(measure.objective)) {
      objectivesMap.set(measure.objective, {
        objectiveId: measure.objective.toLowerCase().replace(/\s+/g, "-"),
        objectiveName: measure.objective,
        required: false,
        measures: [],
      });
    }

    const objective = objectivesMap.get(measure.objective)!;
    objective.measures.push(measure);

    if (measure.required) {
      objective.required = true;
    }
  });

  return {
    totalBasePoints,
    totalBonusPoints,
    totalPoints,
    maxBasePoints,
    categoryScore,
    categoryWeight,
    weightedScore,
    objectives: Array.from(objectivesMap.values()),
    securityRiskAnalysisConducted: true,
    ehrcertificationId: "",
    smallPracticeBonus,
  };
}

// ============================================================================
// Exclusions and Hardship Exceptions
// ============================================================================

export type ExclusionType =
  | "insufficient-internet"
  | "lack-control-availability"
  | "lack-infrastructure"
  | "patient-decline"
  | "security-risk";

/**
 * Apply exclusion to PI measure
 */
export function applyPIExclusion(
  measure: PIMeasure,
  exclusionType: ExclusionType,
  reason: string,
): PIMeasure {
  return {
    ...measure,
    exclusionClaimed: true,
    exclusionReason: `${exclusionType}: ${reason}`,
  };
}

/**
 * Check if eligible for PI hardship exception
 */
export function checkPIHardshipEligibility(
  circumstance: string,
): {
  eligible: boolean;
  reweighting: "automatic" | "application-required" | "not-eligible";
  description: string;
} {
  const hardshipCircumstances: Record<string, any> = {
    "extreme-unforeseen": {
      eligible: true,
      reweighting: "application-required",
      description: "Extreme and uncontrollable circumstances (e.g., natural disaster)",
    },
    "insufficient-internet": {
      eligible: true,
      reweighting: "application-required",
      description: "Lack of sufficient internet connectivity",
    },
    "lack-control": {
      eligible: true,
      reweighting: "application-required",
      description: "Lack of control over availability of CEHRT",
    },
    "small-practice": {
      eligible: true,
      reweighting: "automatic",
      description: "Small practice with 15 or fewer clinicians (automatic reweighting to Quality)",
    },
    "hospital-based": {
      eligible: true,
      reweighting: "automatic",
      description: "Hospital-based MIPS eligible clinician (automatic reweighting)",
    },
    "non-patient-facing": {
      eligible: true,
      reweighting: "automatic",
      description: "Non-patient facing MIPS eligible clinician (automatic reweighting)",
    },
  };

  return hardshipCircumstances[circumstance] || {
    eligible: false,
    reweighting: "not-eligible",
    description: "Does not meet hardship criteria",
  };
}

// ============================================================================
// Interoperability Insights
// ============================================================================

/**
 * Generate insights and recommendations for PI performance
 */
export function generatePIInsights(
  piCategory: PICategory,
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Analyze overall performance
  if (piCategory.categoryScore >= 90) {
    strengths.push("Excellent PI performance - all required measures met");
  } else if (piCategory.categoryScore >= 70) {
    strengths.push("Good PI performance - most required measures met");
  } else {
    weaknesses.push("PI performance below target - review required measures");
  }

  // Check security risk analysis
  if (!piCategory.securityRiskAnalysisConducted) {
    weaknesses.push("CRITICAL: Security Risk Analysis not conducted - PI score is 0");
    recommendations.push("Conduct Security Risk Analysis immediately to earn PI points");
  }

  // Analyze objectives
  piCategory.objectives.forEach(objective => {
    const requiredMeasures = objective.measures.filter(m => m.required);
    const metRequired = requiredMeasures.filter(m => m.meetsThreshold);

    if (requiredMeasures.length > 0 && metRequired.length === requiredMeasures.length) {
      strengths.push(`${objective.objectiveName}: All required measures met`);
    } else if (requiredMeasures.length > metRequired.length) {
      weaknesses.push(`${objective.objectiveName}: ${requiredMeasures.length - metRequired.length} required measure(s) not met`);
    }

    // Check for bonus opportunities
    const bonusMeasures = objective.measures.filter(m => !m.required && m.bonusPoints > 0);
    const earnedBonus = bonusMeasures.filter(m =>
      (m.performanceMethod === "yes-no" && m.attested) ||
      (m.performanceMethod === "proportion" && m.meetsThreshold)
    );

    if (earnedBonus.length < bonusMeasures.length) {
      opportunities.push(
        `${objective.objectiveName}: ${bonusMeasures.length - earnedBonus.length} bonus measure(s) available`
      );
    }
  });

  // Bonus points analysis
  if (piCategory.totalBonusPoints === 0) {
    opportunities.push("No bonus points earned - consider attestation to optional measures");
    recommendations.push("Review optional measures for quick bonus point opportunities");
  } else if (piCategory.totalBonusPoints < 10) {
    opportunities.push(`Only ${piCategory.totalBonusPoints} bonus points earned - more available`);
  }

  // Small practice bonus
  if (piCategory.smallPracticeBonus) {
    strengths.push("Small practice bonus applied (+5 points)");
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    recommendations,
  };
}

// ============================================================================
// E-Prescribing Analysis
// ============================================================================

/**
 * Analyze e-prescribing performance
 */
export function analyzeEPrescribing(
  totalPrescriptions: number,
  electronicPrescriptions: number,
  controlledSubstances: number,
  pdmpQueries: number,
): {
  ePrescribingRate: number;
  meetsThreshold: boolean;
  pdmpComplianceRate: number;
  recommendations: string[];
} {
  const ePrescribingRate = totalPrescriptions > 0
    ? (electronicPrescriptions / totalPrescriptions) * 100
    : 0;

  const meetsThreshold = ePrescribingRate >= 60;

  const pdmpComplianceRate = controlledSubstances > 0
    ? (pdmpQueries / controlledSubstances) * 100
    : 0;

  const recommendations: string[] = [];

  if (!meetsThreshold) {
    recommendations.push(`E-prescribing rate (${ePrescribingRate.toFixed(1)}%) below 60% threshold`);
    recommendations.push("Increase electronic prescribing to meet MIPS requirements");
  }

  if (pdmpComplianceRate < 100 && controlledSubstances > 0) {
    recommendations.push(`PDMP queries completed for only ${pdmpComplianceRate.toFixed(1)}% of controlled substances`);
    recommendations.push("Query PDMP for all Schedule II opioid prescriptions");
  }

  return {
    ePrescribingRate,
    meetsThreshold,
    pdmpComplianceRate,
    recommendations,
  };
}

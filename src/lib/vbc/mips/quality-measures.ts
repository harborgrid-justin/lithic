/**
 * MIPS Quality Measures
 * Merit-based Incentive Payment System quality measure calculation
 * Based on CMS Quality Payment Program specifications
 */

export type MeasureType = "process" | "outcome" | "structure" | "patient-reported-outcome" | "efficiency" | "intermediate-outcome";
export type MeasureSubmissionMethod = "claims" | "registry" | "ehr" | "qcdr" | "cms-web-interface";
export type BenchmarkTier = "decile-10" | "decile-9" | "decile-8" | "decile-7" | "below-decile-7";

export interface MIPSQualityMeasure {
  measureId: string;
  nqfNumber?: string;
  title: string;
  description: string;
  measureType: MeasureType;
  specialty: string[];
  highPriority: boolean;
  outcomeOrPatientExperience: boolean;
  submissionMethods: MeasureSubmissionMethod[];
  inverseIndicator: boolean; // true if lower is better

  // Measure specifications
  numeratorDescription: string;
  denominatorDescription: string;
  denominatorExclusions?: string;
  denominatorExceptions?: string;

  // Performance data
  numerator: number;
  denominator: number;
  performanceRate: number;

  // Benchmarking
  benchmark: number;
  decile3Benchmark: number;
  decile7Benchmark: number;
  benchmarkTier: BenchmarkTier;

  // Scoring
  measurePoints: number;
  bonusPoints: number;
  maxPoints: number;

  // Data completeness
  dataCompleteness: number;
  meetsDataCompleteness: boolean;

  // Case minimum
  caseMinimum: number;
  meetsCaseMinimum: boolean;
}

export interface QualityCategory {
  totalMeasures: number;
  measuresReported: number;
  totalPoints: number;
  maxPoints: number;
  categoryScore: number;
  categoryWeight: number;
  weightedScore: number;
  bonusPoints: number;
}

// ============================================================================
// MIPS Quality Measure Definitions (Sample Set)
// ============================================================================

/**
 * Get MIPS quality measure definition
 */
export function getMIPSMeasureDefinition(measureId: string): Partial<MIPSQualityMeasure> {
  const measures: Record<string, Partial<MIPSQualityMeasure>> = {
    // Diabetes measures
    "001": {
      measureId: "001",
      nqfNumber: "0059",
      title: "Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)",
      description: "Percentage of patients 18-75 years of age with diabetes who had HbA1c > 9.0% during the measurement period",
      measureType: "intermediate-outcome",
      specialty: ["Internal Medicine", "Family Medicine", "Endocrinology"],
      highPriority: true,
      outcomeOrPatientExperience: true,
      submissionMethods: ["claims", "registry", "ehr"],
      inverseIndicator: true,
      numeratorDescription: "Patients whose most recent HbA1c level >9.0%",
      denominatorDescription: "Patients 18-75 years with diabetes",
      caseMinimum: 20,
    },

    "236": {
      measureId: "236",
      nqfNumber: "0034",
      title: "Controlling High Blood Pressure",
      description: "Percentage of patients 18-85 years of age with hypertension whose blood pressure was adequately controlled during the measurement period",
      measureType: "intermediate-outcome",
      specialty: ["Internal Medicine", "Family Medicine", "Cardiology"],
      highPriority: true,
      outcomeOrPatientExperience: true,
      submissionMethods: ["claims", "registry", "ehr"],
      inverseIndicator: false,
      numeratorDescription: "Patients whose most recent BP is <140/90 mmHg",
      denominatorDescription: "Patients 18-85 years with diagnosis of hypertension",
      caseMinimum: 20,
    },

    // Preventive care
    "112": {
      measureId: "112",
      nqfNumber: "0041",
      title: "Breast Cancer Screening",
      description: "Percentage of women 50-74 years of age who had a mammogram to screen for breast cancer in the 27 months prior to the end of the measurement period",
      measureType: "process",
      specialty: ["Internal Medicine", "Family Medicine", "Obstetrics/Gynecology"],
      highPriority: false,
      outcomeOrPatientExperience: false,
      submissionMethods: ["claims", "registry", "ehr"],
      inverseIndicator: false,
      numeratorDescription: "Women who had mammogram within 27 months",
      denominatorDescription: "Women 50-74 years of age",
      denominatorExclusions: "Bilateral mastectomy or two unilateral mastectomies",
      caseMinimum: 20,
    },

    "113": {
      measureId: "113",
      nqfNumber: "0034",
      title: "Colorectal Cancer Screening",
      description: "Percentage of patients 50-75 years of age who had appropriate screening for colorectal cancer",
      measureType: "process",
      specialty: ["Internal Medicine", "Family Medicine", "Gastroenterology"],
      highPriority: false,
      outcomeOrPatientExperience: false,
      submissionMethods: ["claims", "registry", "ehr"],
      inverseIndicator: false,
      numeratorDescription: "Patients with appropriate colorectal cancer screening",
      denominatorDescription: "Patients 50-75 years of age",
      denominatorExclusions: "Total colectomy",
      caseMinimum: 20,
    },

    // Care coordination
    "374": {
      measureId: "374",
      nqfNumber: "0101",
      title: "Closing the Referral Loop: Receipt of Specialist Report",
      description: "Percentage of patients with referrals for which the referring provider received a report from the provider to whom the patient was referred",
      measureType: "process",
      specialty: ["Internal Medicine", "Family Medicine"],
      highPriority: false,
      outcomeOrPatientExperience: false,
      submissionMethods: ["registry", "ehr"],
      inverseIndicator: false,
      numeratorDescription: "Referrals with specialist report received",
      denominatorDescription: "All referrals to another provider",
      caseMinimum: 20,
    },

    // Depression screening
    "134": {
      measureId: "134",
      nqfNumber: "0418",
      title: "Preventive Care and Screening: Screening for Depression and Follow-Up Plan",
      description: "Percentage of patients aged 12 years and older screened for depression using a standardized tool AND documented follow-up plan",
      measureType: "process",
      specialty: ["Internal Medicine", "Family Medicine", "Psychiatry"],
      highPriority: false,
      outcomeOrPatientExperience: false,
      submissionMethods: ["claims", "registry", "ehr"],
      inverseIndicator: false,
      numeratorDescription: "Patients screened for depression with follow-up plan",
      denominatorDescription: "Patients aged 12 years and older",
      caseMinimum: 20,
    },
  };

  return measures[measureId] || {};
}

// ============================================================================
// Quality Measure Calculation
// ============================================================================

/**
 * Calculate performance rate for quality measure
 */
export function calculateMeasurePerformance(
  numerator: number,
  denominator: number,
  exclusions: number = 0,
  exceptions: number = 0,
): {
  performanceRate: number;
  dataCompleteness: number;
  eligiblePopulation: number;
} {
  const eligiblePopulation = denominator - exclusions;
  const reportingDenominator = eligiblePopulation - exceptions;

  const performanceRate = reportingDenominator > 0
    ? (numerator / reportingDenominator) * 100
    : 0;

  const dataCompleteness = denominator > 0
    ? ((reportingDenominator + numerator) / denominator) * 100
    : 0;

  return {
    performanceRate,
    dataCompleteness,
    eligiblePopulation,
  };
}

// ============================================================================
// Measure Scoring (Achievement vs Improvement)
// ============================================================================

/**
 * Calculate measure points based on benchmark achievement
 */
export function calculateMeasurePoints(
  performanceRate: number,
  benchmark: number,
  decile3Benchmark: number,
  decile7Benchmark: number,
  inverseIndicator: boolean = false,
): {
  measurePoints: number;
  benchmarkTier: BenchmarkTier;
  maxPoints: number;
} {
  const maxPoints = 10;

  // Flip logic for inverse indicators (lower is better)
  const effectiveRate = inverseIndicator ? (100 - performanceRate) : performanceRate;
  const effectiveBenchmark = inverseIndicator ? (100 - benchmark) : benchmark;
  const effectiveDecile7 = inverseIndicator ? (100 - decile7Benchmark) : decile7Benchmark;

  let measurePoints = 0;
  let benchmarkTier: BenchmarkTier = "below-decile-7";

  // Decile 10 (100% or best performance)
  if (effectiveRate >= 100 || (effectiveRate >= effectiveDecile7 + 10)) {
    measurePoints = maxPoints;
    benchmarkTier = "decile-10";
  }
  // Decile 9
  else if (effectiveRate >= effectiveDecile7 + 5) {
    measurePoints = maxPoints * 0.9;
    benchmarkTier = "decile-9";
  }
  // Decile 8
  else if (effectiveRate >= effectiveDecile7 + 2) {
    measurePoints = maxPoints * 0.8;
    benchmarkTier = "decile-8";
  }
  // Decile 7
  else if (effectiveRate >= effectiveDecile7) {
    measurePoints = maxPoints * 0.7;
    benchmarkTier = "decile-7";
  }
  // Below decile 7
  else if (effectiveRate >= decile3Benchmark) {
    measurePoints = maxPoints * 0.4;
  }
  // Below decile 3
  else {
    measurePoints = maxPoints * 0.1;
  }

  return {
    measurePoints,
    benchmarkTier,
    maxPoints,
  };
}

/**
 * Calculate bonus points for high-priority measures
 */
export function calculateBonusPoints(
  measure: MIPSQualityMeasure,
): number {
  let bonusPoints = 0;

  // High priority bonus
  if (measure.highPriority) {
    bonusPoints += measure.measurePoints * 0.1; // 10% bonus
  }

  // Outcome/patient experience bonus
  if (measure.outcomeOrPatientExperience) {
    bonusPoints += measure.measurePoints * 0.1; // 10% bonus
  }

  // End-to-end electronic reporting bonus (simplified)
  if (measure.submissionMethods.includes("ehr")) {
    bonusPoints += measure.measurePoints * 0.05; // 5% bonus
  }

  return bonusPoints;
}

// ============================================================================
// Quality Category Scoring
// ============================================================================

/**
 * Calculate overall quality category score
 */
export function calculateQualityCategoryScore(
  measures: MIPSQualityMeasure[],
  categoryWeight: number = 0.30, // 30% in 2024+
): QualityCategory {
  // Filter measures that meet requirements
  const validMeasures = measures.filter(m =>
    m.meetsCaseMinimum && m.meetsDataCompleteness
  );

  if (validMeasures.length === 0) {
    return {
      totalMeasures: measures.length,
      measuresReported: 0,
      totalPoints: 0,
      maxPoints: 0,
      categoryScore: 0,
      categoryWeight,
      weightedScore: 0,
      bonusPoints: 0,
    };
  }

  // Calculate points
  const totalPoints = validMeasures.reduce((sum, m) => sum + m.measurePoints, 0);
  const maxPoints = validMeasures.reduce((sum, m) => sum + m.maxPoints, 0);
  const bonusPoints = validMeasures.reduce((sum, m) => sum + m.bonusPoints, 0);

  // Category score (0-100)
  const categoryScore = maxPoints > 0
    ? Math.min(100, ((totalPoints + bonusPoints) / maxPoints) * 100)
    : 0;

  const weightedScore = categoryScore * categoryWeight;

  return {
    totalMeasures: measures.length,
    measuresReported: validMeasures.length,
    totalPoints: totalPoints + bonusPoints,
    maxPoints,
    categoryScore,
    categoryWeight,
    weightedScore,
    bonusPoints,
  };
}

// ============================================================================
// Small Practice Considerations
// ============================================================================

/**
 * Check if practice qualifies for small practice scoring
 * Small practices (15 or fewer clinicians) have different requirements
 */
export function checkSmallPracticeEligibility(
  clinicianCount: number,
): {
  isSmallPractice: boolean;
  reducedMeasureRequirement: number;
  dataCompletenessThreshold: number;
} {
  const isSmallPractice = clinicianCount <= 15;

  return {
    isSmallPractice,
    reducedMeasureRequirement: isSmallPractice ? 3 : 6, // Small practices report 3, others 6
    dataCompletenessThreshold: 70, // 70% data completeness required
  };
}

// ============================================================================
// Measure Validation
// ============================================================================

/**
 * Validate measure meets MIPS requirements
 */
export function validateMeasure(
  measure: MIPSQualityMeasure,
  dataCompletenessThreshold: number = 70,
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Case minimum check
  if (measure.denominator < measure.caseMinimum) {
    errors.push(`Denominator (${measure.denominator}) below case minimum (${measure.caseMinimum})`);
  }

  // Data completeness check
  if (measure.dataCompleteness < dataCompletenessThreshold) {
    errors.push(`Data completeness (${measure.dataCompleteness.toFixed(1)}%) below threshold (${dataCompletenessThreshold}%)`);
  }

  // Performance rate validation
  if (measure.performanceRate < 0 || measure.performanceRate > 100) {
    errors.push(`Invalid performance rate: ${measure.performanceRate}%`);
  }

  // Warnings
  if (measure.performanceRate < measure.benchmark) {
    warnings.push(`Performance (${measure.performanceRate.toFixed(1)}%) below benchmark (${measure.benchmark}%)`);
  }

  if (!measure.highPriority && !measure.outcomeOrPatientExperience) {
    warnings.push("Measure is not high-priority or outcome-based - missing potential bonus points");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Topped-Out Measures
// ============================================================================

/**
 * Check if measure is topped-out (national performance at ceiling)
 */
export function checkToppedOut(measureId: string): {
  isToppedOut: boolean;
  pointsReduction: number;
  recommendation: string;
} {
  // Simplified list - CMS publishes annual topped-out measure list
  const toppedOutMeasures = new Set([
    "046", // Medication Reconciliation
    "130", // Documentation of Current Medications
  ]);

  const isToppedOut = toppedOutMeasures.has(measureId);

  return {
    isToppedOut,
    pointsReduction: isToppedOut ? 1 : 0, // 1 point reduction per topped-out measure
    recommendation: isToppedOut
      ? "Consider replacing with non-topped-out measure for full points"
      : "Measure is not topped-out",
  };
}

// ============================================================================
// Measure Set Selection
// ============================================================================

/**
 * Recommend optimal measure set for maximum points
 */
export function recommendMeasureSet(
  availableMeasures: MIPSQualityMeasure[],
  requiredMeasureCount: number,
): {
  recommendedMeasures: MIPSQualityMeasure[];
  estimatedPoints: number;
  reasoning: string[];
} {
  const reasoning: string[] = [];

  // Sort measures by potential points (measure points + bonus points)
  const rankedMeasures = [...availableMeasures]
    .filter(m => m.meetsCaseMinimum && m.meetsDataCompleteness)
    .sort((a, b) => {
      const pointsA = a.measurePoints + a.bonusPoints;
      const pointsB = b.measurePoints + b.bonusPoints;
      return pointsB - pointsA;
    });

  // Select top measures
  const recommendedMeasures = rankedMeasures.slice(0, requiredMeasureCount);

  // Calculate estimated points
  const estimatedPoints = recommendedMeasures.reduce(
    (sum, m) => sum + m.measurePoints + m.bonusPoints,
    0,
  );

  // Provide reasoning
  if (recommendedMeasures.some(m => m.highPriority)) {
    reasoning.push("Selected high-priority measures for bonus points");
  }

  if (recommendedMeasures.some(m => m.outcomeOrPatientExperience)) {
    reasoning.push("Included outcome measures for additional bonus points");
  }

  const avgPerformance = recommendedMeasures.reduce((sum, m) => sum + m.performanceRate, 0) / recommendedMeasures.length;
  reasoning.push(`Average performance rate: ${avgPerformance.toFixed(1)}%`);

  return {
    recommendedMeasures,
    estimatedPoints,
    reasoning,
  };
}

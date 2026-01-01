/**
 * Population Health Registries
 * Chronic disease management, risk stratification, care gap identification
 */

import type {
  DiseaseRegistry,
  DiseaseRegistryType,
  RegistryPatient,
  RiskStratification,
  RiskLevel,
  RiskFactor,
  CareGap,
  CareGapCategory,
  CareGapPriority,
  CareGapStatus,
  RegistryQualityMetric,
  PatientAttribution,
  AttributionMethod,
  TrendDirection,
} from "@/types/analytics-enterprise";

// ============================================================================
// Disease Registry Definitions
// ============================================================================

export const DISEASE_REGISTRIES: Record<DiseaseRegistryType, Omit<DiseaseRegistry, "id" | "totalPatients" | "activePatients" | "riskDistribution" | "qualityMetrics">> = {
  diabetes: {
    diseaseType: "diabetes",
    name: "Diabetes Mellitus Registry",
    description: "Comprehensive tracking of all diabetes patients (Type 1, Type 2, and Gestational)",
    inclusionCriteria: [
      "ICD-10 codes: E10.* (Type 1), E11.* (Type 2), O24.* (Gestational)",
      "HbA1c >= 6.5% on two occasions",
      "Fasting glucose >= 126 mg/dL on two occasions",
      "Active diabetes medication prescription",
    ],
    exclusionCriteria: [
      "Pre-diabetes only (without progression to diabetes)",
      "Resolved gestational diabetes (>1 year postpartum with normal glucose)",
      "Deceased patients",
    ],
  },
  hypertension: {
    diseaseType: "hypertension",
    name: "Hypertension Registry",
    description: "Tracking and management of patients with high blood pressure",
    inclusionCriteria: [
      "ICD-10 codes: I10-I16 (Hypertensive diseases)",
      "Blood pressure >= 140/90 mmHg on multiple occasions",
      "Active antihypertensive medication",
    ],
    exclusionCriteria: [
      "White coat hypertension only",
      "Transient hypertension resolved",
      "Deceased patients",
    ],
  },
  chf: {
    diseaseType: "chf",
    name: "Congestive Heart Failure Registry",
    description: "Heart failure patients requiring active management",
    inclusionCriteria: [
      "ICD-10 codes: I50.* (Heart failure)",
      "Documented CHF diagnosis with imaging confirmation",
      "Active CHF medication regimen",
      "NYHA Class II-IV",
    ],
    exclusionCriteria: [
      "Resolved acute heart failure episode with no chronic component",
      "Deceased patients",
    ],
  },
  copd: {
    diseaseType: "copd",
    name: "COPD Registry",
    description: "Chronic Obstructive Pulmonary Disease tracking",
    inclusionCriteria: [
      "ICD-10 codes: J44.* (COPD)",
      "Spirometry: FEV1/FVC < 0.70 post-bronchodilator",
      "Active COPD medications",
      "Chronic bronchitis or emphysema diagnosis",
    ],
    exclusionCriteria: [
      "Asthma only (without COPD component)",
      "Deceased patients",
    ],
  },
  asthma: {
    diseaseType: "asthma",
    name: "Asthma Registry",
    description: "Asthma patients requiring ongoing management",
    inclusionCriteria: [
      "ICD-10 codes: J45.* (Asthma)",
      "Active asthma medications (controller or rescue)",
      "Documented bronchospasm or reversible airway obstruction",
    ],
    exclusionCriteria: [
      "Childhood asthma, fully resolved in adulthood",
      "Deceased patients",
    ],
  },
  ckd: {
    diseaseType: "ckd",
    name: "Chronic Kidney Disease Registry",
    description: "Tracking of patients with impaired kidney function",
    inclusionCriteria: [
      "ICD-10 codes: N18.* (CKD)",
      "eGFR < 60 mL/min/1.73m² for >= 3 months",
      "Albuminuria >= 30 mg/g for >= 3 months",
      "Kidney damage markers present",
    ],
    exclusionCriteria: [
      "Acute kidney injury only",
      "eGFR normalized without chronic component",
      "Deceased patients",
    ],
  },
  cad: {
    diseaseType: "cad",
    name: "Coronary Artery Disease Registry",
    description: "Patients with coronary artery disease",
    inclusionCriteria: [
      "ICD-10 codes: I25.* (Chronic ischemic heart disease)",
      "History of MI, PCI, or CABG",
      "Documented coronary stenosis >= 50%",
      "Active antiplatelet or antianginal therapy",
    ],
    exclusionCriteria: [
      "Ruled out CAD after evaluation",
      "Deceased patients",
    ],
  },
  stroke: {
    diseaseType: "stroke",
    name: "Stroke/TIA Registry",
    description: "Stroke survivors requiring secondary prevention",
    inclusionCriteria: [
      "ICD-10 codes: I63.* (Cerebral infarction), G45.* (TIA)",
      "Documented stroke or TIA on imaging",
      "Active stroke prevention medications",
    ],
    exclusionCriteria: [
      "Migraine misdiagnosed as TIA",
      "Deceased patients",
    ],
  },
  cancer: {
    diseaseType: "cancer",
    name: "Cancer Registry",
    description: "Active cancer patients in treatment or surveillance",
    inclusionCriteria: [
      "ICD-10 codes: C00-C97 (Malignant neoplasms)",
      "Active cancer diagnosis",
      "In active treatment or surveillance phase",
    ],
    exclusionCriteria: [
      "Cancer in complete remission > 5 years (except specific types)",
      "Non-melanoma skin cancer only",
      "Deceased patients",
    ],
  },
};

// ============================================================================
// Risk Stratification Algorithms
// ============================================================================

/**
 * Calculate diabetes risk stratification
 */
export function stratifyDiabetesRisk(patient: {
  hba1c?: number;
  complications?: string[];
  medicationAdherence?: number;
  lastVisit?: Date;
  age: number;
  comorbidities?: string[];
}): RiskStratification {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // HbA1c factor (0-40 points)
  if (patient.hba1c) {
    let hba1cScore = 0;
    if (patient.hba1c >= 10) hba1cScore = 40;
    else if (patient.hba1c >= 9) hba1cScore = 30;
    else if (patient.hba1c >= 8) hba1cScore = 20;
    else if (patient.hba1c >= 7) hba1cScore = 10;

    factors.push({
      factor: "HbA1c",
      value: patient.hba1c,
      weight: 0.4,
      contribution: hba1cScore,
      modifiable: true,
    });
    totalScore += hba1cScore;
  }

  // Complications factor (0-30 points)
  const complicationScore = Math.min(30, (patient.complications?.length || 0) * 10);
  if (patient.complications && patient.complications.length > 0) {
    factors.push({
      factor: "Complications",
      value: patient.complications.join(", "),
      weight: 0.3,
      contribution: complicationScore,
      modifiable: false,
    });
    totalScore += complicationScore;
  }

  // Medication adherence factor (0-15 points, inverse)
  if (patient.medicationAdherence !== undefined) {
    const adherenceScore = Math.max(0, 15 - patient.medicationAdherence * 15);
    factors.push({
      factor: "Medication Adherence",
      value: patient.medicationAdherence,
      weight: 0.15,
      contribution: adherenceScore,
      modifiable: true,
    });
    totalScore += adherenceScore;
  }

  // Care engagement (0-10 points)
  if (patient.lastVisit) {
    const daysSinceVisit = Math.floor(
      (Date.now() - patient.lastVisit.getTime()) / (1000 * 60 * 60 * 24),
    );
    const engagementScore = daysSinceVisit > 365 ? 10 : daysSinceVisit > 180 ? 5 : 0;
    factors.push({
      factor: "Care Engagement",
      value: daysSinceVisit,
      weight: 0.1,
      contribution: engagementScore,
      modifiable: true,
    });
    totalScore += engagementScore;
  }

  // Age factor (0-5 points)
  const ageScore = patient.age >= 65 ? 5 : patient.age >= 50 ? 3 : 0;
  factors.push({
    factor: "Age",
    value: patient.age,
    weight: 0.05,
    contribution: ageScore,
    modifiable: false,
  });
  totalScore += ageScore;

  // Determine risk level based on total score
  const riskLevel = getRiskLevelFromScore(totalScore, { low: 15, moderate: 40, high: 70 });

  return {
    patientId: "",
    registryType: "diabetes",
    riskLevel,
    riskScore: totalScore,
    riskFactors: factors,
    calculatedAt: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    algorithm: "Diabetes Stratification v1.0",
    version: "1.0",
  };
}

/**
 * Calculate CHF risk stratification
 */
export function stratifyCHFRisk(patient: {
  nyhaClass?: number;
  ejectionFraction?: number;
  hospitalizations?: number;
  bnp?: number;
  age: number;
  comorbidities?: string[];
}): RiskStratification {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // NYHA Class (0-40 points)
  if (patient.nyhaClass) {
    const nyhaScore = patient.nyhaClass * 10;
    factors.push({
      factor: "NYHA Class",
      value: patient.nyhaClass,
      weight: 0.4,
      contribution: nyhaScore,
      modifiable: true,
    });
    totalScore += nyhaScore;
  }

  // Ejection Fraction (0-30 points, inverse)
  if (patient.ejectionFraction !== undefined) {
    let efScore = 0;
    if (patient.ejectionFraction < 30) efScore = 30;
    else if (patient.ejectionFraction < 40) efScore = 20;
    else if (patient.ejectionFraction < 50) efScore = 10;

    factors.push({
      factor: "Ejection Fraction",
      value: patient.ejectionFraction,
      weight: 0.3,
      contribution: efScore,
      modifiable: true,
    });
    totalScore += efScore;
  }

  // Recent hospitalizations (0-20 points)
  if (patient.hospitalizations !== undefined) {
    const hospScore = Math.min(20, patient.hospitalizations * 10);
    factors.push({
      factor: "Recent Hospitalizations",
      value: patient.hospitalizations,
      weight: 0.2,
      contribution: hospScore,
      modifiable: true,
    });
    totalScore += hospScore;
  }

  // BNP levels (0-10 points)
  if (patient.bnp) {
    let bnpScore = 0;
    if (patient.bnp > 900) bnpScore = 10;
    else if (patient.bnp > 400) bnpScore = 5;

    factors.push({
      factor: "BNP Level",
      value: patient.bnp,
      weight: 0.1,
      contribution: bnpScore,
      modifiable: true,
    });
    totalScore += bnpScore;
  }

  const riskLevel = getRiskLevelFromScore(totalScore, { low: 20, moderate: 50, high: 80 });

  return {
    patientId: "",
    registryType: "chf",
    riskLevel,
    riskScore: totalScore,
    riskFactors: factors,
    calculatedAt: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    algorithm: "CHF Stratification v1.0",
    version: "1.0",
  };
}

/**
 * Helper to determine risk level from score
 */
function getRiskLevelFromScore(
  score: number,
  thresholds: { low: number; moderate: number; high: number },
): RiskLevel {
  if (score <= thresholds.low) return "low";
  if (score <= thresholds.moderate) return "moderate";
  if (score <= thresholds.high) return "high";
  return "very_high";
}

// ============================================================================
// Care Gap Identification
// ============================================================================

/**
 * Identify care gaps for diabetes patients
 */
export function identifyDiabetesCareGaps(patient: {
  patientId: string;
  lastHbA1c?: Date;
  lastEyeExam?: Date;
  lastFootExam?: Date;
  lastNephropathy?: Date;
  lastLipidPanel?: Date;
  onStatin?: boolean;
  onAceInhibitor?: boolean;
}): CareGap[] {
  const gaps: CareGap[] = [];
  const now = new Date();

  // HbA1c testing (every 3-6 months)
  if (!patient.lastHbA1c || daysSince(patient.lastHbA1c) > 180) {
    gaps.push({
      id: `${patient.patientId}-hba1c`,
      patientId: patient.patientId,
      category: "chronic_disease_management",
      description: "HbA1c test overdue",
      priority: daysSince(patient.lastHbA1c) > 365 ? "high" : "medium",
      status: "open",
      dueDate: patient.lastHbA1c
        ? addDays(patient.lastHbA1c, 180)
        : addDays(now, -180),
      overdueBy: patient.lastHbA1c ? daysSince(patient.lastHbA1c) - 180 : undefined,
      recommendedActions: [
        "Schedule HbA1c test",
        "Review current medication regimen",
        "Assess glycemic control",
      ],
      identifiedAt: now,
    });
  }

  // Annual eye exam
  if (!patient.lastEyeExam || daysSince(patient.lastEyeExam) > 365) {
    gaps.push({
      id: `${patient.patientId}-eye-exam`,
      patientId: patient.patientId,
      category: "preventive_screening",
      description: "Annual diabetic eye exam overdue",
      priority: daysSince(patient.lastEyeExam) > 730 ? "high" : "medium",
      status: "open",
      dueDate: patient.lastEyeExam
        ? addDays(patient.lastEyeExam, 365)
        : addDays(now, -365),
      overdueBy: patient.lastEyeExam ? daysSince(patient.lastEyeExam) - 365 : undefined,
      recommendedActions: [
        "Refer to ophthalmology",
        "Schedule dilated eye exam",
        "Screen for retinopathy",
      ],
      identifiedAt: now,
    });
  }

  // Annual foot exam
  if (!patient.lastFootExam || daysSince(patient.lastFootExam) > 365) {
    gaps.push({
      id: `${patient.patientId}-foot-exam`,
      patientId: patient.patientId,
      category: "preventive_screening",
      description: "Annual diabetic foot exam overdue",
      priority: "medium",
      status: "open",
      dueDate: patient.lastFootExam
        ? addDays(patient.lastFootExam, 365)
        : addDays(now, -365),
      overdueBy: patient.lastFootExam ? daysSince(patient.lastFootExam) - 365 : undefined,
      recommendedActions: [
        "Perform comprehensive foot exam",
        "Assess sensation with monofilament",
        "Check for ulcers or deformities",
      ],
      identifiedAt: now,
    });
  }

  // Annual nephropathy screening (uACR or urine microalbumin)
  if (!patient.lastNephropathy || daysSince(patient.lastNephropathy) > 365) {
    gaps.push({
      id: `${patient.patientId}-nephropathy`,
      patientId: patient.patientId,
      category: "preventive_screening",
      description: "Annual nephropathy screening overdue",
      priority: "medium",
      status: "open",
      dueDate: patient.lastNephropathy
        ? addDays(patient.lastNephropathy, 365)
        : addDays(now, -365),
      overdueBy: patient.lastNephropathy
        ? daysSince(patient.lastNephropathy) - 365
        : undefined,
      recommendedActions: [
        "Order urine albumin-to-creatinine ratio",
        "Review kidney function (eGFR)",
        "Assess for ACE inhibitor/ARB therapy",
      ],
      identifiedAt: now,
    });
  }

  // Lipid panel (annually)
  if (!patient.lastLipidPanel || daysSince(patient.lastLipidPanel) > 365) {
    gaps.push({
      id: `${patient.patientId}-lipids`,
      patientId: patient.patientId,
      category: "preventive_screening",
      description: "Annual lipid panel overdue",
      priority: "low",
      status: "open",
      dueDate: patient.lastLipidPanel
        ? addDays(patient.lastLipidPanel, 365)
        : addDays(now, -365),
      overdueBy: patient.lastLipidPanel
        ? daysSince(patient.lastLipidPanel) - 365
        : undefined,
      recommendedActions: ["Order lipid panel", "Review cardiovascular risk"],
      identifiedAt: now,
    });
  }

  // Statin therapy (if indicated)
  if (!patient.onStatin) {
    gaps.push({
      id: `${patient.patientId}-statin`,
      patientId: patient.patientId,
      category: "medication_adherence",
      description: "Statin therapy not documented",
      priority: "medium",
      status: "open",
      recommendedActions: [
        "Assess cardiovascular risk",
        "Consider statin initiation",
        "Review contraindications",
      ],
      identifiedAt: now,
    });
  }

  return gaps;
}

/**
 * Identify care gaps for hypertension patients
 */
export function identifyHypertensionCareGaps(patient: {
  patientId: string;
  lastBPCheck?: Date;
  lastLabWork?: Date;
  bpControlled?: boolean;
}): CareGap[] {
  const gaps: CareGap[] = [];
  const now = new Date();

  // BP monitoring frequency
  const bpDueInDays = patient.bpControlled ? 180 : 90;
  if (!patient.lastBPCheck || daysSince(patient.lastBPCheck) > bpDueInDays) {
    gaps.push({
      id: `${patient.patientId}-bp-check`,
      patientId: patient.patientId,
      category: "chronic_disease_management",
      description: "Blood pressure check overdue",
      priority: patient.bpControlled ? "medium" : "high",
      status: "open",
      dueDate: patient.lastBPCheck
        ? addDays(patient.lastBPCheck, bpDueInDays)
        : addDays(now, -bpDueInDays),
      overdueBy: patient.lastBPCheck
        ? daysSince(patient.lastBPCheck) - bpDueInDays
        : undefined,
      recommendedActions: [
        "Schedule BP check",
        "Review medication adherence",
        "Assess lifestyle modifications",
      ],
      identifiedAt: now,
    });
  }

  // Annual lab work
  if (!patient.lastLabWork || daysSince(patient.lastLabWork) > 365) {
    gaps.push({
      id: `${patient.patientId}-labs`,
      patientId: patient.patientId,
      category: "lab_test",
      description: "Annual lab work overdue",
      priority: "medium",
      status: "open",
      recommendedActions: [
        "Order comprehensive metabolic panel",
        "Check lipid panel",
        "Assess kidney function",
      ],
      identifiedAt: now,
    });
  }

  return gaps;
}

// ============================================================================
// Quality Metrics Calculation
// ============================================================================

/**
 * Calculate diabetes quality metrics
 */
export function calculateDiabetesQualityMetrics(patients: RegistryPatient[]): RegistryQualityMetric[] {
  const metrics: RegistryQualityMetric[] = [];

  // HbA1c testing rate (annual)
  const patientsWithRecentHbA1c = patients.filter((p) =>
    p.outcomes.some((o) => o.outcomeType === "hba1c" && daysSince(o.measurementDate) <= 365),
  ).length;

  metrics.push({
    id: "diabetes-hba1c-testing",
    name: "HbA1c Testing Rate",
    description: "Percentage of patients with HbA1c test in past year",
    numerator: patientsWithRecentHbA1c,
    denominator: patients.length,
    percentage: (patientsWithRecentHbA1c / patients.length) * 100,
    target: 90,
    benchmark: 85,
    trend: "stable" as TrendDirection,
  });

  // HbA1c control (<8%)
  const patientsWithControlledHbA1c = patients.filter((p) =>
    p.outcomes.some((o) => o.outcomeType === "hba1c" && o.value < 8),
  ).length;

  metrics.push({
    id: "diabetes-hba1c-control",
    name: "HbA1c Control (<8%)",
    description: "Percentage of patients with HbA1c <8%",
    numerator: patientsWithControlledHbA1c,
    denominator: patients.length,
    percentage: (patientsWithControlledHbA1c / patients.length) * 100,
    target: 70,
    benchmark: 65,
    trend: "increasing" as TrendDirection,
  });

  // Eye exam completion
  const patientsWithEyeExam = patients.filter((p) =>
    p.careGaps.every((g) => g.category !== "preventive_screening" || !g.description.includes("eye")),
  ).length;

  metrics.push({
    id: "diabetes-eye-exam",
    name: "Annual Eye Exam Rate",
    description: "Percentage of patients with annual dilated eye exam",
    numerator: patientsWithEyeExam,
    denominator: patients.length,
    percentage: (patientsWithEyeExam / patients.length) * 100,
    target: 80,
    benchmark: 75,
    trend: "stable" as TrendDirection,
  });

  return metrics;
}

// ============================================================================
// Attribution Modeling
// ============================================================================

/**
 * Calculate patient attribution using specified method
 */
export function calculateAttribution(
  patientId: string,
  encounters: Array<{ providerId: string; date: Date; type: string }>,
  method: AttributionMethod = "multi_touch",
  windowDays: number = 365,
): PatientAttribution {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Filter encounters within attribution window
  const relevantEncounters = encounters.filter((e) => e.date >= windowStart);

  if (relevantEncounters.length === 0) {
    return {
      patientId,
      primaryProvider: "",
      attributionScore: 0,
      attributionMethod: method,
      touchpoints: [],
      calculatedAt: now,
    };
  }

  // Calculate touchpoint weights based on method
  const touchpoints = relevantEncounters.map((encounter) => {
    let weight = 1;

    switch (method) {
      case "first_touch":
        weight = encounter === relevantEncounters[0] ? 1 : 0;
        break;
      case "last_touch":
        weight = encounter === relevantEncounters[relevantEncounters.length - 1] ? 1 : 0;
        break;
      case "time_decay":
        const daysSince = daysSince(encounter.date);
        weight = Math.exp(-daysSince / 180); // Exponential decay with 180-day half-life
        break;
      case "multi_touch":
      default:
        weight = 1; // Equal weight for all touchpoints
        break;
    }

    return {
      provider: encounter.providerId,
      date: encounter.date,
      type: encounter.type,
      weight,
    };
  });

  // Aggregate scores by provider
  const providerScores = new Map<string, number>();
  touchpoints.forEach((tp) => {
    const current = providerScores.get(tp.provider) || 0;
    providerScores.set(tp.provider, current + tp.weight);
  });

  // Find primary provider (highest score)
  let primaryProvider = "";
  let maxScore = 0;
  providerScores.forEach((score, provider) => {
    if (score > maxScore) {
      maxScore = score;
      primaryProvider = provider;
    }
  });

  return {
    patientId,
    primaryProvider,
    attributionScore: maxScore,
    attributionMethod: method,
    touchpoints,
    calculatedAt: now,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function daysSince(date?: Date): number {
  if (!date) return Infinity;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Prioritize care gaps
 */
export function prioritizeCareGaps(gaps: CareGap[]): CareGap[] {
  const priorityOrder: Record<CareGapPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...gaps].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by overdue days
    const aDays = a.overdueBy || 0;
    const bDays = b.overdueBy || 0;
    return bDays - aDays;
  });
}

/**
 * Get registry summary statistics
 */
export function getRegistrySummary(
  registryId: string,
  patients: RegistryPatient[],
): {
  totalPatients: number;
  activePatients: number;
  riskDistribution: Record<RiskLevel, number>;
  averageRiskScore: number;
  totalCareGaps: number;
  urgentGaps: number;
} {
  const activePatients = patients.filter((p) => p.careGaps.some((g) => g.status === "open"));

  const riskDistribution: Record<RiskLevel, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    very_high: 0,
  };

  let totalRiskScore = 0;
  patients.forEach((p) => {
    riskDistribution[p.riskLevel]++;
    totalRiskScore += p.riskScore;
  });

  const allGaps = patients.flatMap((p) => p.careGaps);
  const urgentGaps = allGaps.filter((g) => g.priority === "urgent").length;

  return {
    totalPatients: patients.length,
    activePatients: activePatients.length,
    riskDistribution,
    averageRiskScore: patients.length > 0 ? totalRiskScore / patients.length : 0,
    totalCareGaps: allGaps.length,
    urgentGaps,
  };
}

/**
 * High Utilizer Identification Model
 * Identifies patients at risk of becoming high healthcare utilizers
 */

import type { Prediction, PredictionFactor, RiskLevel } from "@/types/analytics-enterprise";

export interface HighUtilizerInput {
  patientId: string;

  // Demographics
  age: number;
  gender: "M" | "F" | "O";

  // Historical utilization (past 12 months)
  edVisits: number;
  inpatientAdmissions: number;
  observationStays: number;
  primaryCareVisits: number;
  specialistVisits: number;
  totalEncounters: number;

  // Clinical complexity
  chronicConditionCount: number;
  activeConditions: string[];
  activeMedicationCount: number;
  recentDiagnoses: number; // New diagnoses in past 6 months

  // High-risk conditions
  hasChf: boolean;
  hasCopd: boolean;
  hasDiabetes: boolean;
  hasRenalFailure: boolean;
  hasCancer: boolean;
  hasMentalHealth: boolean;
  hasSubstanceAbuse: boolean;

  // Care coordination
  hasPcp: boolean;
  missedAppointments: number;
  erForNonUrgent: number; // ED visits that could have been primary care

  // Social determinants
  unstableHousing: boolean;
  transportationIssues: boolean;
  socialIsolation: boolean;
  lowHealthLiteracy: boolean;

  // Pharmacy
  polypharmacy: boolean; // >10 medications
  medicationAdherence: number; // 0-1 scale

  // Previous patterns
  wasHighUtilizerLastYear: boolean;
  utilizationTrend: "increasing" | "stable" | "decreasing";
}

export interface HighUtilizerOutput extends Prediction {
  utilizationRisk: "low" | "moderate" | "high" | "very_high";
  predictedEncounters: number;
  predictedEdVisits: number;
  predictedAdmissions: number;
  interventionPriority: number;
  caseManagementRecommended: boolean;
  interventionPrograms: string[];
}

/**
 * High utilizer thresholds (annual)
 */
const UTILIZATION_THRESHOLDS = {
  edVisits: 4, // 4+ ED visits = high utilizer
  admissions: 2, // 2+ admissions = high utilizer
  totalEncounters: 20, // 20+ encounters = high utilizer
};

/**
 * Feature weights for high utilizer prediction
 */
const UTILIZER_WEIGHTS = {
  // Historical utilization (strongest predictors)
  edVisits: 8,
  admissions: 15,
  observationStays: 5,
  totalEncounters: 1,

  // Previous patterns
  wasHighUtilizer: 35,
  increasingTrend: 15,

  // Clinical complexity
  chronicConditions: 4,
  medications: 2,
  recentDiagnoses: 6,

  // High-risk conditions
  chf: 18,
  copd: 15,
  renalFailure: 20,
  cancer: 12,
  mentalHealth: 10,
  substanceAbuse: 22,

  // Care coordination gaps
  noPcp: 10,
  missedAppointments: 3,
  inappropriateEd: 5,

  // Social determinants
  unstableHousing: 12,
  transportation: 8,
  socialIsolation: 6,
  lowHealthLiteracy: 5,

  // Medication issues
  polypharmacy: 8,
  poorAdherence: 10,
};

/**
 * Predict high utilizer risk
 */
export function predictHighUtilizer(input: HighUtilizerInput): HighUtilizerOutput {
  const factors: PredictionFactor[] = [];
  let totalScore = 0;

  // Historical ED utilization
  if (input.edVisits > 0) {
    const contribution = Math.min(input.edVisits * UTILIZER_WEIGHTS.edVisits, 40);
    factors.push({
      feature: "Emergency Department Visits",
      value: input.edVisits,
      contribution,
      description: `${input.edVisits} ED visits in past year`,
    });
    totalScore += contribution;
  }

  // Inpatient admissions
  if (input.inpatientAdmissions > 0) {
    const contribution = Math.min(
      input.inpatientAdmissions * UTILIZER_WEIGHTS.admissions,
      45,
    );
    factors.push({
      feature: "Inpatient Admissions",
      value: input.inpatientAdmissions,
      contribution,
      description: `${input.inpatientAdmissions} admissions in past year`,
    });
    totalScore += contribution;
  }

  // Observation stays
  if (input.observationStays > 0) {
    const contribution = Math.min(
      input.observationStays * UTILIZER_WEIGHTS.observationStays,
      20,
    );
    factors.push({
      feature: "Observation Stays",
      value: input.observationStays,
      contribution,
      description: "Observation stays indicate acute care needs",
    });
    totalScore += contribution;
  }

  // Was high utilizer last year (strongest predictor)
  if (input.wasHighUtilizerLastYear) {
    factors.push({
      feature: "Previous High Utilizer",
      value: "Yes",
      contribution: UTILIZER_WEIGHTS.wasHighUtilizer,
      description: "History of high utilization strongly predicts future use",
    });
    totalScore += UTILIZER_WEIGHTS.wasHighUtilizer;
  }

  // Utilization trend
  if (input.utilizationTrend === "increasing") {
    factors.push({
      feature: "Increasing Utilization",
      value: "Trending up",
      contribution: UTILIZER_WEIGHTS.increasingTrend,
      description: "Upward trend in healthcare utilization",
    });
    totalScore += UTILIZER_WEIGHTS.increasingTrend;
  }

  // Chronic condition burden
  if (input.chronicConditionCount >= 3) {
    const contribution = Math.min(
      input.chronicConditionCount * UTILIZER_WEIGHTS.chronicConditions,
      30,
    );
    factors.push({
      feature: "Chronic Conditions",
      value: input.chronicConditionCount,
      contribution,
      description: `${input.chronicConditionCount} chronic conditions requiring ongoing management`,
    });
    totalScore += contribution;
  }

  // Recent new diagnoses
  if (input.recentDiagnoses >= 2) {
    const contribution = Math.min(
      input.recentDiagnoses * UTILIZER_WEIGHTS.recentDiagnoses,
      20,
    );
    factors.push({
      feature: "Recent New Diagnoses",
      value: input.recentDiagnoses,
      contribution,
      description: "New diagnoses often lead to increased utilization",
    });
    totalScore += contribution;
  }

  // High-risk conditions
  if (input.hasChf) {
    factors.push({
      feature: "Congestive Heart Failure",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.chf,
      description: "CHF associated with high ED and admission rates",
    });
    totalScore += UTILIZER_WEIGHTS.chf;
  }

  if (input.hasCopd) {
    factors.push({
      feature: "COPD",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.copd,
      description: "COPD exacerbations drive ED visits",
    });
    totalScore += UTILIZER_WEIGHTS.copd;
  }

  if (input.hasRenalFailure) {
    factors.push({
      feature: "Renal Failure",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.renalFailure,
      description: "Dialysis and complications = high utilization",
    });
    totalScore += UTILIZER_WEIGHTS.renalFailure;
  }

  if (input.hasCancer) {
    factors.push({
      feature: "Active Cancer",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.cancer,
      description: "Cancer treatment requires frequent encounters",
    });
    totalScore += UTILIZER_WEIGHTS.cancer;
  }

  if (input.hasMentalHealth) {
    factors.push({
      feature: "Mental Health Diagnosis",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.mentalHealth,
      description: "Mental health comorbidity increases utilization",
    });
    totalScore += UTILIZER_WEIGHTS.mentalHealth;
  }

  if (input.hasSubstanceAbuse) {
    factors.push({
      feature: "Substance Use Disorder",
      value: "Present",
      contribution: UTILIZER_WEIGHTS.substanceAbuse,
      description: "Substance abuse strongly associated with ED utilization",
    });
    totalScore += UTILIZER_WEIGHTS.substanceAbuse;
  }

  // No primary care provider
  if (!input.hasPcp) {
    factors.push({
      feature: "No Primary Care Provider",
      value: "Missing",
      contribution: UTILIZER_WEIGHTS.noPcp,
      description: "Lack of PCP leads to ED use for primary care needs",
    });
    totalScore += UTILIZER_WEIGHTS.noPcp;
  }

  // Missed appointments
  if (input.missedAppointments >= 3) {
    const contribution = Math.min(
      input.missedAppointments * UTILIZER_WEIGHTS.missedAppointments,
      15,
    );
    factors.push({
      feature: "Missed Appointments",
      value: input.missedAppointments,
      contribution,
      description: "Missed appointments often lead to ED visits for urgent issues",
    });
    totalScore += contribution;
  }

  // Inappropriate ED use
  if (input.erForNonUrgent >= 2) {
    const contribution = Math.min(
      input.erForNonUrgent * UTILIZER_WEIGHTS.inappropriateEd,
      20,
    );
    factors.push({
      feature: "Non-Urgent ED Use",
      value: input.erForNonUrgent,
      contribution,
      description: "ED visits for non-urgent conditions",
    });
    totalScore += contribution;
  }

  // Social determinants
  if (input.unstableHousing) {
    factors.push({
      feature: "Unstable Housing",
      value: "Yes",
      contribution: UTILIZER_WEIGHTS.unstableHousing,
      description: "Housing instability drives healthcare utilization",
    });
    totalScore += UTILIZER_WEIGHTS.unstableHousing;
  }

  if (input.transportationIssues) {
    factors.push({
      feature: "Transportation Barriers",
      value: "Yes",
      contribution: UTILIZER_WEIGHTS.transportation,
      description: "Transportation issues delay care, leading to ED visits",
    });
    totalScore += UTILIZER_WEIGHTS.transportation;
  }

  if (input.socialIsolation) {
    factors.push({
      feature: "Social Isolation",
      value: "Yes",
      contribution: UTILIZER_WEIGHTS.socialIsolation,
      description: "Social isolation associated with worse outcomes",
    });
    totalScore += UTILIZER_WEIGHTS.socialIsolation;
  }

  if (input.lowHealthLiteracy) {
    factors.push({
      feature: "Low Health Literacy",
      value: "Yes",
      contribution: UTILIZER_WEIGHTS.lowHealthLiteracy,
      description: "Difficulty managing conditions independently",
    });
    totalScore += UTILIZER_WEIGHTS.lowHealthLiteracy;
  }

  // Polypharmacy
  if (input.polypharmacy) {
    factors.push({
      feature: "Polypharmacy",
      value: `${input.activeMedicationCount} medications`,
      contribution: UTILIZER_WEIGHTS.polypharmacy,
      description: "Complex medication regimen increases risks",
    });
    totalScore += UTILIZER_WEIGHTS.polypharmacy;
  }

  // Poor medication adherence
  if (input.medicationAdherence < 0.8) {
    const contribution = (1 - input.medicationAdherence) * UTILIZER_WEIGHTS.poorAdherence;
    factors.push({
      feature: "Poor Medication Adherence",
      value: `${(input.medicationAdherence * 100).toFixed(0)}%`,
      contribution,
      description: "Medication non-adherence leads to complications",
    });
    totalScore += contribution;
  }

  // Convert score to probability
  const probability = 1 / (1 + Math.exp(-(totalScore - 60) / 20));
  const riskLevel = getRiskLevel(probability);
  const utilizationRisk = getUtilizationRisk(probability);

  // Predict future utilization
  const predictions = predictFutureUtilization(input, probability);

  // Generate interventions
  const interventionPrograms = generateInterventionPrograms(input, factors, riskLevel);
  const caseManagementRecommended = riskLevel === "very_high" || riskLevel === "high";
  const interventionPriority = calculateInterventionPriority(totalScore, input);

  return {
    id: `high-utilizer-${input.patientId}-${Date.now()}`,
    patientId: input.patientId,
    modelId: "high-utilizer-v1",
    modelVersion: "1.0",
    predictionType: "high_utilizer",
    score: totalScore,
    probability: probability * 100,
    riskLevel,
    predictedAt: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    factors,
    recommendations: interventionPrograms,
    confidence: 82,
    utilizationRisk,
    predictedEncounters: predictions.totalEncounters,
    predictedEdVisits: predictions.edVisits,
    predictedAdmissions: predictions.admissions,
    interventionPriority,
    caseManagementRecommended,
    interventionPrograms,
  };
}

/**
 * Determine risk level
 */
function getRiskLevel(probability: number): RiskLevel {
  if (probability >= 0.70) return "very_high";
  if (probability >= 0.50) return "high";
  if (probability >= 0.30) return "moderate";
  return "low";
}

/**
 * Get utilization risk category
 */
function getUtilizationRisk(probability: number): "low" | "moderate" | "high" | "very_high" {
  if (probability >= 0.70) return "very_high";
  if (probability >= 0.50) return "high";
  if (probability >= 0.30) return "moderate";
  return "low";
}

/**
 * Predict future utilization levels
 */
function predictFutureUtilization(
  input: HighUtilizerInput,
  probability: number,
): {
  totalEncounters: number;
  edVisits: number;
  admissions: number;
} {
  // Use historical data and risk probability to forecast
  const utilizationMultiplier = 1 + probability * 0.5; // Up to 50% increase for highest risk

  return {
    totalEncounters: Math.round(input.totalEncounters * utilizationMultiplier),
    edVisits: Math.round(input.edVisits * utilizationMultiplier),
    admissions: Math.round(input.inpatientAdmissions * utilizationMultiplier),
  };
}

/**
 * Calculate intervention priority score
 */
function calculateInterventionPriority(score: number, input: HighUtilizerInput): number {
  let priority = score;

  // Boost priority for modifiable factors
  if (input.missedAppointments > 3) priority += 10;
  if (!input.hasPcp) priority += 15;
  if (input.medicationAdherence < 0.7) priority += 10;
  if (input.erForNonUrgent >= 3) priority += 12;

  return Math.min(100, priority);
}

/**
 * Generate intervention programs
 */
function generateInterventionPrograms(
  input: HighUtilizerInput,
  factors: PredictionFactor[],
  riskLevel: RiskLevel,
): string[] {
  const programs: string[] = [];

  // High-risk patients
  if (riskLevel === "very_high" || riskLevel === "high") {
    programs.push("Intensive case management");
    programs.push("Complex care coordination program");
  }

  // Care coordination
  if (!input.hasPcp) {
    programs.push("Primary care establishment program");
  }

  if (input.missedAppointments >= 3) {
    programs.push("Appointment adherence support");
    programs.push("Transportation assistance program");
  }

  // Disease-specific
  if (input.hasChf) {
    programs.push("CHF disease management program");
    programs.push("Home telemonitoring for CHF");
  }

  if (input.hasCopd) {
    programs.push("COPD care management");
    programs.push("Pulmonary rehabilitation");
  }

  if (input.hasDiabetes && input.edVisits > 0) {
    programs.push("Diabetes self-management education");
  }

  // Behavioral health
  if (input.hasMentalHealth) {
    programs.push("Integrated behavioral health services");
  }

  if (input.hasSubstanceAbuse) {
    programs.push("Substance abuse treatment program");
    programs.push("Medication-assisted treatment (MAT)");
  }

  // Social determinants
  if (input.unstableHousing) {
    programs.push("Housing support services");
    programs.push("Community health worker outreach");
  }

  if (input.transportationIssues) {
    programs.push("Non-emergency medical transportation");
  }

  // ED alternatives
  if (input.erForNonUrgent >= 2) {
    programs.push("Urgent care education");
    programs.push("Nurse hotline access");
    programs.push("Extended hours primary care");
  }

  // Medication management
  if (input.polypharmacy || input.medicationAdherence < 0.8) {
    programs.push("Medication therapy management");
    programs.push("Pharmacy consultation");
  }

  if (input.chronicConditionCount >= 4) {
    programs.push("Multi-morbidity management program");
  }

  return programs;
}

/**
 * Batch prediction
 */
export function batchPredictHighUtilizers(
  inputs: HighUtilizerInput[],
): HighUtilizerOutput[] {
  return inputs.map((input) => predictHighUtilizer(input));
}

/**
 * Get top utilizers for intervention prioritization
 */
export function prioritizeForIntervention(
  predictions: HighUtilizerOutput[],
  maxPatients: number = 100,
): HighUtilizerOutput[] {
  return predictions
    .sort((a, b) => b.interventionPriority - a.interventionPriority)
    .slice(0, maxPatients);
}

/**
 * Calculate potential cost savings from intervention
 */
export function calculateInterventionROI(
  prediction: HighUtilizerOutput,
  interventionCost: number,
  averageEdCost: number = 1500,
  averageAdmissionCost: number = 15000,
): {
  potentialSavings: number;
  roi: number;
  breakEvenReduction: number;
} {
  // Assume intervention can reduce utilization by 20-40% for high-risk patients
  const reductionRate = prediction.utilizationRisk === "very_high" ? 0.35 : 0.25;

  const edSavings = prediction.predictedEdVisits * reductionRate * averageEdCost;
  const admissionSavings =
    prediction.predictedAdmissions * reductionRate * averageAdmissionCost;
  const potentialSavings = edSavings + admissionSavings;

  const roi = interventionCost > 0 ? (potentialSavings - interventionCost) / interventionCost : 0;
  const breakEvenReduction =
    potentialSavings > 0 ? interventionCost / potentialSavings : 1;

  return {
    potentialSavings,
    roi,
    breakEvenReduction,
  };
}

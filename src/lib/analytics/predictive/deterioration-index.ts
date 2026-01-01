/**
 * Clinical Deterioration Index
 * Early warning score for identifying patients at risk of clinical decline
 * Based on Modified Early Warning Score (MEWS) and NEWS2 systems
 */

import type { Prediction, PredictionFactor, RiskLevel } from "@/types/analytics-enterprise";

export interface DeteriorationInput {
  patientId: string;
  encounterId: string;
  assessmentTime: Date;

  // Vital signs
  heartRate: number;
  systolicBP: number;
  respiratoryRate: number;
  temperature: number; // Celsius
  oxygenSaturation: number; // Percentage
  supplementalOxygen: boolean;

  // Level of consciousness
  consciousnessLevel: "alert" | "verbal" | "pain" | "unresponsive"; // AVPU scale

  // Additional clinical factors
  urinePut?: number; // mL in last 4 hours
  painScore?: number; // 0-10
  newConfusion?: boolean;

  // Patient context
  age: number;
  hasChronicRespiratory: boolean;
  immunocompromised: boolean;
  recentSurgery: boolean;
  sepsisCriteria?: number; // Number of SIRS criteria met

  // Trending data
  vitalsTrend?: "improving" | "stable" | "worsening";
  previousScore?: number;
}

export interface DeteriorationOutput extends Prediction {
  newsScore: number;
  mewsScore: number;
  severityLevel: "low" | "medium" | "high" | "critical";
  interventionRequired: string;
  escalationPath: string[];
  monitoringFrequency: string;
  clinicalConcerns: string[];
}

/**
 * Calculate National Early Warning Score 2 (NEWS2)
 */
export function calculateNEWS2(input: DeteriorationInput): number {
  let score = 0;

  // Respiration rate (0-3 points)
  if (input.respiratoryRate <= 8) score += 3;
  else if (input.respiratoryRate >= 9 && input.respiratoryRate <= 11) score += 1;
  else if (input.respiratoryRate >= 21 && input.respiratoryRate <= 24) score += 2;
  else if (input.respiratoryRate >= 25) score += 3;

  // Oxygen saturation (0-3 points)
  // Scale 1: Use for most patients
  if (input.oxygenSaturation <= 91) score += 3;
  else if (input.oxygenSaturation >= 92 && input.oxygenSaturation <= 93) score += 2;
  else if (input.oxygenSaturation >= 94 && input.oxygenSaturation <= 95) score += 1;

  // Scale 2: Use for patients with chronic respiratory disease
  if (input.hasChronicRespiratory) {
    // Adjust scoring for hypercapnic respiratory failure
    if (input.oxygenSaturation <= 83) score += 3;
    else if (input.oxygenSaturation >= 84 && input.oxygenSaturation <= 85) score += 2;
    else if (input.oxygenSaturation >= 86 && input.oxygenSaturation <= 87) score += 1;
  }

  // Supplemental oxygen (2 points if on oxygen)
  if (input.supplementalOxygen) score += 2;

  // Temperature (0-3 points)
  if (input.temperature <= 35.0) score += 3;
  else if (input.temperature >= 35.1 && input.temperature <= 36.0) score += 1;
  else if (input.temperature >= 38.1 && input.temperature <= 39.0) score += 1;
  else if (input.temperature >= 39.1) score += 2;

  // Systolic BP (0-3 points)
  if (input.systolicBP <= 90) score += 3;
  else if (input.systolicBP >= 91 && input.systolicBP <= 100) score += 2;
  else if (input.systolicBP >= 101 && input.systolicBP <= 110) score += 1;
  else if (input.systolicBP >= 220) score += 3;

  // Heart rate (0-3 points)
  if (input.heartRate <= 40) score += 3;
  else if (input.heartRate >= 41 && input.heartRate <= 50) score += 1;
  else if (input.heartRate >= 91 && input.heartRate <= 110) score += 1;
  else if (input.heartRate >= 111 && input.heartRate <= 130) score += 2;
  else if (input.heartRate >= 131) score += 3;

  // Consciousness (0 or 3 points)
  if (input.consciousnessLevel !== "alert") score += 3;

  return score;
}

/**
 * Calculate Modified Early Warning Score (MEWS)
 */
export function calculateMEWS(input: DeteriorationInput): number {
  let score = 0;

  // Respiratory rate
  if (input.respiratoryRate < 9) score += 2;
  else if (input.respiratoryRate >= 9 && input.respiratoryRate <= 14) score += 0;
  else if (input.respiratoryRate >= 15 && input.respiratoryRate <= 20) score += 1;
  else if (input.respiratoryRate >= 21 && input.respiratoryRate <= 29) score += 2;
  else if (input.respiratoryRate >= 30) score += 3;

  // Heart rate
  if (input.heartRate < 40) score += 2;
  else if (input.heartRate >= 40 && input.heartRate <= 50) score += 1;
  else if (input.heartRate >= 51 && input.heartRate <= 100) score += 0;
  else if (input.heartRate >= 101 && input.heartRate <= 110) score += 1;
  else if (input.heartRate >= 111 && input.heartRate <= 129) score += 2;
  else if (input.heartRate >= 130) score += 3;

  // Systolic BP
  if (input.systolicBP < 70) score += 3;
  else if (input.systolicBP >= 70 && input.systolicBP <= 80) score += 2;
  else if (input.systolicBP >= 81 && input.systolicBP <= 100) score += 1;
  else if (input.systolicBP >= 101 && input.systolicBP <= 199) score += 0;
  else if (input.systolicBP >= 200) score += 2;

  // Temperature
  if (input.temperature < 35.0) score += 2;
  else if (input.temperature >= 35.0 && input.temperature < 38.5) score += 0;
  else if (input.temperature >= 38.5) score += 2;

  // Consciousness (AVPU)
  const consciousnessScores = {
    alert: 0,
    verbal: 1,
    pain: 2,
    unresponsive: 3,
  };
  score += consciousnessScores[input.consciousnessLevel];

  return score;
}

/**
 * Calculate comprehensive deterioration index
 */
export function calculateDeteriorationIndex(
  input: DeteriorationInput,
): DeteriorationOutput {
  const factors: PredictionFactor[] = [];
  let totalScore = 0;

  // Calculate standardized scores
  const newsScore = calculateNEWS2(input);
  const mewsScore = calculateMEWS(input);

  // Use NEWS2 as primary score, but factor in MEWS and additional criteria
  totalScore = newsScore;

  // Vital signs factors
  if (input.heartRate > 110 || input.heartRate < 50) {
    factors.push({
      feature: "Abnormal Heart Rate",
      value: input.heartRate,
      contribution: input.heartRate > 130 ? 8 : 5,
      description:
        input.heartRate > 110
          ? "Tachycardia indicates stress or deterioration"
          : "Bradycardia may indicate cardiac or neurological issue",
    });
  }

  if (input.systolicBP < 100) {
    factors.push({
      feature: "Hypotension",
      value: input.systolicBP,
      contribution: input.systolicBP < 90 ? 10 : 6,
      description: "Low blood pressure indicates potential shock or severe illness",
    });
  }

  if (input.respiratoryRate > 20 || input.respiratoryRate < 12) {
    factors.push({
      feature: "Abnormal Respiratory Rate",
      value: input.respiratoryRate,
      contribution: input.respiratoryRate > 24 ? 8 : 5,
      description: "Respiratory distress is an early warning sign",
    });
  }

  if (input.temperature > 38.0 || input.temperature < 36.0) {
    factors.push({
      feature: "Abnormal Temperature",
      value: input.temperature,
      contribution: input.temperature > 39 || input.temperature < 35.5 ? 6 : 3,
      description:
        input.temperature > 38 ? "Fever indicates infection or inflammation" : "Hypothermia is concerning",
    });
  }

  if (input.oxygenSaturation < 95) {
    factors.push({
      feature: "Low Oxygen Saturation",
      value: input.oxygenSaturation,
      contribution: input.oxygenSaturation < 90 ? 10 : 5,
      description: "Hypoxemia requires immediate attention",
    });
  }

  if (input.supplementalOxygen) {
    factors.push({
      feature: "Supplemental Oxygen Required",
      value: "Yes",
      contribution: 4,
      description: "Oxygen requirement indicates respiratory compromise",
    });
  }

  // Consciousness level
  if (input.consciousnessLevel !== "alert") {
    const consciousnessSeverity = {
      verbal: 8,
      pain: 12,
      unresponsive: 15,
    };
    factors.push({
      feature: "Altered Consciousness",
      value: input.consciousnessLevel,
      contribution: consciousnessSeverity[input.consciousnessLevel as keyof typeof consciousnessSeverity] || 0,
      description: "Altered mental status is a critical warning sign",
    });
  }

  // New confusion
  if (input.newConfusion) {
    factors.push({
      feature: "New Confusion",
      value: "Present",
      contribution: 8,
      description: "Acute confusion may indicate delirium or neurological event",
    });
  }

  // Urine output (oliguria)
  if (input.urinePut !== undefined && input.urinePut < 100) {
    factors.push({
      feature: "Low Urine Output",
      value: `${input.urinePut} mL`,
      contribution: input.urinePut < 50 ? 8 : 5,
      description: "Oliguria indicates poor perfusion or renal dysfunction",
    });
  }

  // High pain score
  if (input.painScore && input.painScore >= 8) {
    factors.push({
      feature: "Severe Pain",
      value: input.painScore,
      contribution: 4,
      description: "Uncontrolled pain affects recovery and may indicate complications",
    });
  }

  // Sepsis screening
  if (input.sepsisCriteria && input.sepsisCriteria >= 2) {
    factors.push({
      feature: "Sepsis Criteria",
      value: `${input.sepsisCriteria} SIRS criteria`,
      contribution: input.sepsisCriteria >= 3 ? 15 : 10,
      description: "Meets criteria for systemic inflammatory response",
    });
    totalScore += input.sepsisCriteria >= 3 ? 15 : 10;
  }

  // Patient vulnerability factors
  if (input.age >= 75) {
    factors.push({
      feature: "Advanced Age",
      value: input.age,
      contribution: 3,
      description: "Elderly patients deteriorate more rapidly",
    });
    totalScore += 3;
  }

  if (input.immunocompromised) {
    factors.push({
      feature: "Immunocompromised",
      value: "Yes",
      contribution: 5,
      description: "Immunosuppression increases risk of rapid deterioration",
    });
    totalScore += 5;
  }

  if (input.recentSurgery) {
    factors.push({
      feature: "Recent Surgery",
      value: "Yes",
      contribution: 4,
      description: "Postoperative patients require close monitoring",
    });
    totalScore += 4;
  }

  // Trend analysis
  if (input.vitalsTrend === "worsening") {
    factors.push({
      feature: "Worsening Trend",
      value: "Declining",
      contribution: 8,
      description: "Deteriorating vitals indicate progressive illness",
    });
    totalScore += 8;
  }

  if (input.previousScore && newsScore > input.previousScore + 2) {
    factors.push({
      feature: "Rapid Score Increase",
      value: `+${newsScore - input.previousScore}`,
      contribution: 6,
      description: "Acute worsening since last assessment",
    });
    totalScore += 6;
  }

  // Determine severity and risk level
  const severityLevel = getSeverityLevel(newsScore, totalScore);
  const riskLevel = getRiskLevel(totalScore);
  const probability = calculateDeteriorationProbability(totalScore, newsScore);

  // Generate interventions and escalation
  const interventionRequired = determineIntervention(newsScore, severityLevel);
  const escalationPath = determineEscalationPath(newsScore, severityLevel, input);
  const monitoringFrequency = determineMonitoringFrequency(newsScore, severityLevel);
  const clinicalConcerns = identifyClinicalConcerns(input, factors);

  return {
    id: `deterioration-${input.encounterId}-${Date.now()}`,
    patientId: input.patientId,
    modelId: "deterioration-index-v1",
    modelVersion: "1.0",
    predictionType: "deterioration",
    score: totalScore,
    probability,
    riskLevel,
    predictedAt: input.assessmentTime,
    validUntil: new Date(input.assessmentTime.getTime() + 4 * 60 * 60 * 1000), // 4 hours
    factors,
    recommendations: escalationPath,
    confidence: 90,
    newsScore,
    mewsScore,
    severityLevel,
    interventionRequired,
    escalationPath,
    monitoringFrequency,
    clinicalConcerns,
  };
}

/**
 * Determine severity level
 */
function getSeverityLevel(newsScore: number, totalScore: number): "low" | "medium" | "high" | "critical" {
  if (newsScore >= 7 || totalScore >= 50) return "critical";
  if (newsScore >= 5 || totalScore >= 35) return "high";
  if (newsScore >= 3 || totalScore >= 20) return "medium";
  return "low";
}

/**
 * Get risk level
 */
function getRiskLevel(totalScore: number): RiskLevel {
  if (totalScore >= 50) return "very_high";
  if (totalScore >= 35) return "high";
  if (totalScore >= 20) return "moderate";
  return "low";
}

/**
 * Calculate probability of deterioration
 */
function calculateDeteriorationProbability(totalScore: number, newsScore: number): number {
  // Higher scores = higher probability of adverse outcome
  const baseProb = 1 / (1 + Math.exp(-(totalScore - 30) / 10));
  const newsAdjustment = newsScore >= 7 ? 0.15 : newsScore >= 5 ? 0.10 : 0;
  return Math.min(100, (baseProb + newsAdjustment) * 100);
}

/**
 * Determine required intervention
 */
function determineIntervention(newsScore: number, severity: string): string {
  if (newsScore >= 7 || severity === "critical") {
    return "URGENT: Emergency assessment by critical care team within 30 minutes";
  } else if (newsScore >= 5 || severity === "high") {
    return "URGENT: Immediate medical review by senior clinician";
  } else if (newsScore >= 3 || severity === "medium") {
    return "Prompt clinical review by registered nurse and doctor";
  } else {
    return "Continue routine monitoring";
  }
}

/**
 * Determine escalation path
 */
function determineEscalationPath(
  newsScore: number,
  severity: string,
  input: DeteriorationInput,
): string[] {
  const path: string[] = [];

  if (newsScore >= 7 || severity === "critical") {
    path.push("Activate rapid response team immediately");
    path.push("Notify attending physician and intensivist");
    path.push("Prepare for possible ICU transfer");
    path.push("Ensure crash cart available");
    path.push("Obtain stat labs and arterial blood gas");
  } else if (newsScore >= 5 || severity === "high") {
    path.push("Notify charge nurse and physician immediately");
    path.push("Increase monitoring to continuous if not already");
    path.push("Consider rapid response team activation if no improvement");
    path.push("Obtain vital signs every 30 minutes");
  } else if (newsScore >= 3 || severity === "medium") {
    path.push("Inform primary nurse and physician");
    path.push("Increase vital sign monitoring frequency");
    path.push("Reassess within 1 hour");
    path.push("Consider additional diagnostic testing");
  } else {
    path.push("Continue standard care");
    path.push("Document findings in medical record");
  }

  // Add specific interventions based on abnormalities
  if (input.oxygenSaturation < 90) {
    path.push("Initiate or increase supplemental oxygen");
    path.push("Consider chest X-ray and ABG");
  }

  if (input.systolicBP < 90) {
    path.push("Initiate fluid resuscitation");
    path.push("Rule out sepsis and hemorrhage");
  }

  if (input.consciousnessLevel !== "alert") {
    path.push("Perform neurological assessment");
    path.push("Check blood glucose");
    path.push("Consider head CT if indicated");
  }

  return path;
}

/**
 * Determine monitoring frequency
 */
function determineMonitoringFrequency(newsScore: number, severity: string): string {
  if (newsScore >= 7 || severity === "critical") {
    return "Continuous monitoring with telemetry";
  } else if (newsScore >= 5 || severity === "high") {
    return "Every 15-30 minutes until stable";
  } else if (newsScore >= 3 || severity === "medium") {
    return "Every 1 hour";
  } else if (newsScore >= 1) {
    return "Every 4-6 hours";
  } else {
    return "Per routine (every 8-12 hours)";
  }
}

/**
 * Identify specific clinical concerns
 */
function identifyClinicalConcerns(
  input: DeteriorationInput,
  factors: PredictionFactor[],
): string[] {
  const concerns: string[] = [];

  if (input.consciousnessLevel !== "alert") {
    concerns.push("Altered level of consciousness - assess for causes");
  }

  if (input.oxygenSaturation < 90) {
    concerns.push("Severe hypoxemia - risk of organ dysfunction");
  }

  if (input.systolicBP < 90) {
    concerns.push("Hypotension - assess for shock");
  }

  if (input.heartRate > 120 && input.temperature > 38.0) {
    concerns.push("Possible sepsis - consider sepsis bundle");
  }

  if (input.respiratoryRate > 24) {
    concerns.push("Respiratory distress - assess airway and breathing");
  }

  if (input.urinePut !== undefined && input.urinePut < 100) {
    concerns.push("Oliguria - assess renal function and perfusion");
  }

  if (input.sepsisCriteria && input.sepsisCriteria >= 2) {
    concerns.push("SIRS criteria met - high suspicion for sepsis");
  }

  return concerns;
}

/**
 * Batch assessment
 */
export function batchAssessDeteriorationRisk(
  inputs: DeteriorationInput[],
): DeteriorationOutput[] {
  return inputs.map((input) => calculateDeteriorationIndex(input));
}

/**
 * Get patients requiring urgent intervention
 */
export function getUrgentPatients(
  assessments: DeteriorationOutput[],
): DeteriorationOutput[] {
  return assessments
    .filter((a) => a.severityLevel === "critical" || a.severityLevel === "high")
    .sort((a, b) => b.newsScore - a.newsScore);
}

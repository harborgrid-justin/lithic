/**
 * Risk Stratification Algorithms
 * Evidence-based risk scoring for population health management
 */

import {
  RiskScore,
  RiskLevel,
  RiskScoreType,
  RiskComponent,
  PredictedOutcome,
} from "@/types/population-health";
import { Patient } from "@/types/patient";
import { Encounter, Diagnosis, ProblemList } from "@/types/clinical";

interface PatientClinicalData {
  patient: Patient;
  encounters: Encounter[];
  diagnoses: Diagnosis[];
  problemList: ProblemList[];
  medications?: any[];
  labResults?: any[];
  admissions?: any[];
}

/**
 * Calculate LACE Index Score
 * Predicts 30-day readmission risk
 *
 * L = Length of stay (0-7 points)
 * A = Acuity of admission (0-3 points)
 * C = Comorbidity (Charlson) (0-4 points)
 * E = Emergency visits in past 6 months (0-4 points)
 *
 * Total: 0-18 points
 * High risk: ≥10 points
 */
export function calculateLACEScore(data: PatientClinicalData): RiskScore {
  const components: RiskComponent[] = [];
  let totalScore = 0;

  // L - Length of Stay (last admission)
  const lastAdmission = data.encounters
    .filter((e) => e.class === "INPATIENT" && e.status === "COMPLETED")
    .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())[0];

  let lengthOfStay = 0;
  if (lastAdmission && lastAdmission.endTime) {
    const los = Math.floor(
      (lastAdmission.endTime.getTime() - lastAdmission.startTime.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    lengthOfStay = Math.min(los, 7);
    totalScore += lengthOfStay;
  }

  components.push({
    name: "Length of Stay",
    value: lengthOfStay,
    weight: 1,
    contribution: lengthOfStay,
    description: `${lengthOfStay} days (max 7)`,
  });

  // A - Acuity of Admission
  let acuityScore = 0;
  if (lastAdmission) {
    acuityScore = lastAdmission.priority === "EMERGENCY" ? 3 : 0;
    totalScore += acuityScore;
  }

  components.push({
    name: "Acuity of Admission",
    value: acuityScore,
    weight: 1,
    contribution: acuityScore,
    description:
      lastAdmission?.priority === "EMERGENCY"
        ? "Emergency admission"
        : "Non-emergency admission",
  });

  // C - Comorbidity (Charlson score, capped at 4)
  const charlsonScore = calculateCharlsonComorbidityIndex(data);
  const comorbidityScore = Math.min(charlsonScore.score, 4);
  totalScore += comorbidityScore;

  components.push({
    name: "Comorbidity (Charlson)",
    value: charlsonScore.score,
    weight: 1,
    contribution: comorbidityScore,
    description: `Charlson ${charlsonScore.score} (capped at 4)`,
  });

  // E - Emergency visits in past 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const edVisits = data.encounters.filter(
    (e) => e.type === "EMERGENCY" && e.startTime >= sixMonthsAgo,
  ).length;

  const edScore = Math.min(edVisits, 4);
  totalScore += edScore;

  components.push({
    name: "ED Visits (6 months)",
    value: edVisits,
    weight: 1,
    contribution: edScore,
    description: `${edVisits} visits (max 4)`,
  });

  // Determine risk level
  let level: RiskLevel;
  if (totalScore >= 10) level = RiskLevel.HIGH;
  else if (totalScore >= 7) level = RiskLevel.MEDIUM;
  else level = RiskLevel.LOW;

  // Calculate predicted outcomes
  const readmissionProbability = calculateReadmissionProbability(totalScore);

  const predictedOutcomes: PredictedOutcome[] = [
    {
      outcome: "30-day readmission",
      probability: readmissionProbability,
      timeframe: "30 days",
      confidence: 0.75,
      factors: components.map((c) => c.name),
    },
  ];

  const riskScore: RiskScore = {
    id: generateId(),
    organizationId: "", // Set from context
    patientId: data.patient.id,
    registryId: null,
    scoreType: RiskScoreType.LACE,
    score: totalScore,
    level,
    components,
    calculatedDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    trends: [],
    predictedOutcomes,
    interventionRecommendations: getInterventionRecommendations(
      "LACE",
      level,
      totalScore,
    ),
    notes: `LACE score: ${totalScore}/18`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return riskScore;
}

/**
 * Calculate Charlson Comorbidity Index
 * Predicts 10-year mortality based on comorbid conditions
 */
export function calculateCharlsonComorbidityIndex(data: PatientClinicalData): {
  score: number;
  level: RiskLevel;
  components: RiskComponent[];
} {
  const components: RiskComponent[] = [];
  let totalScore = 0;

  // Age adjustment
  const age = calculateAge(data.patient.dateOfBirth);
  let ageScore = 0;
  if (age >= 50 && age < 60) ageScore = 1;
  else if (age >= 60 && age < 70) ageScore = 2;
  else if (age >= 70 && age < 80) ageScore = 3;
  else if (age >= 80) ageScore = 4;

  if (ageScore > 0) {
    components.push({
      name: "Age",
      value: age,
      weight: 1,
      contribution: ageScore,
      description: `${age} years old`,
    });
    totalScore += ageScore;
  }

  // Comorbidity weights based on ICD codes
  const comorbidityWeights = [
    {
      name: "Myocardial Infarction",
      icdPatterns: ["I21", "I22", "I25.2"],
      weight: 1,
    },
    { name: "Congestive Heart Failure", icdPatterns: ["I50"], weight: 1 },
    {
      name: "Peripheral Vascular Disease",
      icdPatterns: ["I70", "I71", "I73"],
      weight: 1,
    },
    {
      name: "Cerebrovascular Disease",
      icdPatterns: ["I60", "I61", "I62", "I63", "I65", "I66", "G45"],
      weight: 1,
    },
    {
      name: "Dementia",
      icdPatterns: ["F00", "F01", "F02", "F03", "G30"],
      weight: 1,
    },
    {
      name: "COPD",
      icdPatterns: ["J40", "J41", "J42", "J43", "J44"],
      weight: 1,
    },
    {
      name: "Connective Tissue Disease",
      icdPatterns: ["M05", "M06", "M32", "M33", "M34"],
      weight: 1,
    },
    {
      name: "Peptic Ulcer Disease",
      icdPatterns: ["K25", "K26", "K27", "K28"],
      weight: 1,
    },
    {
      name: "Mild Liver Disease",
      icdPatterns: [
        "B18",
        "K70.0",
        "K70.1",
        "K70.2",
        "K70.3",
        "K70.9",
        "K73",
        "K74",
      ],
      weight: 1,
    },
    {
      name: "Diabetes (uncomplicated)",
      icdPatterns: ["E10.0", "E10.1", "E10.9", "E11.0", "E11.1", "E11.9"],
      weight: 1,
    },
    {
      name: "Diabetes (with complications)",
      icdPatterns: [
        "E10.2",
        "E10.3",
        "E10.4",
        "E10.5",
        "E11.2",
        "E11.3",
        "E11.4",
        "E11.5",
      ],
      weight: 2,
    },
    { name: "Hemiplegia", icdPatterns: ["G81", "G82"], weight: 2 },
    {
      name: "Moderate/Severe Renal Disease",
      icdPatterns: ["N18.3", "N18.4", "N18.5"],
      weight: 2,
    },
    {
      name: "Any Tumor (without metastasis)",
      icdPatterns: [
        "C00",
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
      ],
      weight: 2,
    },
    {
      name: "Leukemia",
      icdPatterns: ["C91", "C92", "C93", "C94", "C95"],
      weight: 2,
    },
    {
      name: "Lymphoma",
      icdPatterns: ["C81", "C82", "C83", "C84", "C85", "C86", "C88"],
      weight: 2,
    },
    {
      name: "Moderate/Severe Liver Disease",
      icdPatterns: ["K72", "K76.6", "K76.7"],
      weight: 3,
    },
    {
      name: "Metastatic Solid Tumor",
      icdPatterns: ["C77", "C78", "C79", "C80"],
      weight: 6,
    },
    { name: "AIDS", icdPatterns: ["B20", "B21", "B22", "B24"], weight: 6 },
  ];

  // Check each comorbidity
  const allDiagnoses = [...data.diagnoses, ...data.problemList];

  for (const comorbidity of comorbidityWeights) {
    const hasCondition = allDiagnoses.some((d) =>
      comorbidity.icdPatterns.some((pattern) => d.icdCode.startsWith(pattern)),
    );

    if (hasCondition) {
      components.push({
        name: comorbidity.name,
        value: 1,
        weight: comorbidity.weight,
        contribution: comorbidity.weight,
        description: `Present`,
      });
      totalScore += comorbidity.weight;
    }
  }

  // Determine risk level
  let level: RiskLevel;
  if (totalScore >= 5) level = RiskLevel.VERY_HIGH;
  else if (totalScore >= 3) level = RiskLevel.HIGH;
  else if (totalScore >= 1) level = RiskLevel.MEDIUM;
  else level = RiskLevel.LOW;

  return { score: totalScore, level, components };
}

/**
 * Calculate 30-day Readmission Risk Score
 * Uses multiple factors to predict readmission risk
 */
export function calculateReadmissionRisk(data: PatientClinicalData): RiskScore {
  const components: RiskComponent[] = [];
  let totalScore = 0;

  // Get LACE score as base
  const laceScore = calculateLACEScore(data);
  totalScore += laceScore.score * 5; // Weight LACE heavily

  components.push({
    name: "LACE Index",
    value: laceScore.score,
    weight: 5,
    contribution: laceScore.score * 5,
    description: `LACE score: ${laceScore.score}`,
  });

  // Medication count (polypharmacy)
  const medicationCount = data.medications?.length || 0;
  let medScore = 0;
  if (medicationCount >= 10) medScore = 15;
  else if (medicationCount >= 5) medScore = 10;
  else if (medicationCount >= 3) medScore = 5;

  if (medScore > 0) {
    components.push({
      name: "Medication Count",
      value: medicationCount,
      weight: 1,
      contribution: medScore,
      description: `${medicationCount} medications`,
    });
    totalScore += medScore;
  }

  // Prior admissions (past year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const priorAdmissions = data.encounters.filter(
    (e) =>
      e.class === "INPATIENT" &&
      e.status === "COMPLETED" &&
      e.startTime >= oneYearAgo,
  ).length;

  const admissionScore = Math.min(priorAdmissions * 10, 30);
  if (admissionScore > 0) {
    components.push({
      name: "Prior Admissions (1 year)",
      value: priorAdmissions,
      weight: 10,
      contribution: admissionScore,
      description: `${priorAdmissions} admissions`,
    });
    totalScore += admissionScore;
  }

  // Social factors (if available)
  // Living alone, poor social support, etc.
  // This would integrate with SDOH data

  // Normalize score to 0-100
  const normalizedScore = Math.min(totalScore, 100);

  // Determine risk level
  let level: RiskLevel;
  if (normalizedScore >= 75) level = RiskLevel.CRITICAL;
  else if (normalizedScore >= 60) level = RiskLevel.VERY_HIGH;
  else if (normalizedScore >= 40) level = RiskLevel.HIGH;
  else if (normalizedScore >= 20) level = RiskLevel.MEDIUM;
  else level = RiskLevel.LOW;

  const readmissionProbability = normalizedScore / 100;

  const predictedOutcomes: PredictedOutcome[] = [
    {
      outcome: "30-day readmission",
      probability: readmissionProbability,
      timeframe: "30 days",
      confidence: 0.8,
      factors: components.map((c) => c.name),
    },
  ];

  const riskScore: RiskScore = {
    id: generateId(),
    organizationId: "",
    patientId: data.patient.id,
    registryId: null,
    scoreType: RiskScoreType.READMISSION_RISK,
    score: normalizedScore,
    level,
    components,
    calculatedDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trends: [],
    predictedOutcomes,
    interventionRecommendations: getInterventionRecommendations(
      "READMISSION",
      level,
      normalizedScore,
    ),
    notes: `Readmission risk score: ${normalizedScore}/100`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return riskScore;
}

/**
 * Calculate Composite Risk Score
 * Combines multiple risk scores for overall patient risk
 */
export function calculateCompositeRisk(data: PatientClinicalData): RiskScore {
  const lace = calculateLACEScore(data);
  const charlson = calculateCharlsonComorbidityIndex(data);
  const readmission = calculateReadmissionRisk(data);

  const components: RiskComponent[] = [
    {
      name: "LACE Score",
      value: lace.score,
      weight: 0.3,
      contribution: lace.score * 0.3,
      description: `${lace.score}/18`,
    },
    {
      name: "Charlson Index",
      value: charlson.score,
      weight: 0.3,
      contribution: charlson.score * 0.3,
      description: `${charlson.score} comorbidities`,
    },
    {
      name: "Readmission Risk",
      value: readmission.score,
      weight: 0.4,
      contribution: readmission.score * 0.4,
      description: `${readmission.score}/100`,
    },
  ];

  // Weighted average, normalized to 0-100
  const compositeScore = Math.round(
    (lace.score / 18) * 30 +
      (Math.min(charlson.score, 10) / 10) * 30 +
      (readmission.score / 100) * 40,
  );

  let level: RiskLevel;
  if (compositeScore >= 75) level = RiskLevel.CRITICAL;
  else if (compositeScore >= 60) level = RiskLevel.VERY_HIGH;
  else if (compositeScore >= 40) level = RiskLevel.HIGH;
  else if (compositeScore >= 20) level = RiskLevel.MEDIUM;
  else level = RiskLevel.LOW;

  const riskScore: RiskScore = {
    id: generateId(),
    organizationId: "",
    patientId: data.patient.id,
    registryId: null,
    scoreType: RiskScoreType.COMPOSITE,
    score: compositeScore,
    level,
    components,
    calculatedDate: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    trends: [],
    predictedOutcomes: [
      ...lace.predictedOutcomes,
      ...readmission.predictedOutcomes,
    ],
    interventionRecommendations: getInterventionRecommendations(
      "COMPOSITE",
      level,
      compositeScore,
    ),
    notes: `Composite risk score: ${compositeScore}/100`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return riskScore;
}

/**
 * Helper: Calculate readmission probability from LACE score
 */
function calculateReadmissionProbability(laceScore: number): number {
  // Based on published LACE research
  if (laceScore >= 10) return 0.28; // 28% readmission rate
  if (laceScore >= 7) return 0.18;
  if (laceScore >= 4) return 0.12;
  return 0.06;
}

/**
 * Helper: Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Helper: Get intervention recommendations based on risk level
 */
function getInterventionRecommendations(
  scoreType: string,
  level: RiskLevel,
  score: number,
): string[] {
  const recommendations: string[] = [];

  if (level === RiskLevel.CRITICAL || level === RiskLevel.VERY_HIGH) {
    recommendations.push("Enroll in intensive care management program");
    recommendations.push("Schedule follow-up within 48 hours of discharge");
    recommendations.push("Arrange home health services");
    recommendations.push("Medication reconciliation and adherence support");
    recommendations.push("Assess and address social determinants of health");
  }

  if (level === RiskLevel.HIGH || level === RiskLevel.VERY_HIGH) {
    recommendations.push("Care transition support");
    recommendations.push("Weekly care manager outreach");
    recommendations.push("Review and optimize medication regimen");
    recommendations.push("Coordinate with primary care provider");
  }

  if (level === RiskLevel.MEDIUM || level === RiskLevel.HIGH) {
    recommendations.push("Schedule follow-up within 7-14 days");
    recommendations.push("Patient education on warning signs");
    recommendations.push("Ensure timely access to primary care");
  }

  if (scoreType === "LACE" || scoreType === "READMISSION") {
    recommendations.push("Ensure discharge instructions are understood");
    recommendations.push("Confirm follow-up appointments scheduled");
  }

  return recommendations;
}

/**
 * Helper: Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate Fall Risk Score
 * Assesses risk of falls for elderly patients
 */
export function calculateFallRisk(data: PatientClinicalData): RiskScore {
  const components: RiskComponent[] = [];
  let totalScore = 0;

  const age = calculateAge(data.patient.dateOfBirth);

  // Age factor
  if (age >= 65) {
    const ageScore = age >= 80 ? 3 : age >= 75 ? 2 : 1;
    components.push({
      name: "Age",
      value: age,
      weight: 1,
      contribution: ageScore,
      description: `${age} years old`,
    });
    totalScore += ageScore;
  }

  // History of falls
  const fallDiagnoses = data.diagnoses.filter(
    (d) => d.icdCode.startsWith("W") || d.icdCode.startsWith("R29.6"),
  );

  if (fallDiagnoses.length > 0) {
    const fallScore = Math.min(fallDiagnoses.length * 2, 6);
    components.push({
      name: "History of Falls",
      value: fallDiagnoses.length,
      weight: 2,
      contribution: fallScore,
      description: `${fallDiagnoses.length} documented falls`,
    });
    totalScore += fallScore;
  }

  // Mobility issues
  const mobilityDiagnoses = data.problemList.filter(
    (d) =>
      d.icdCode.startsWith("M") || // Musculoskeletal
      d.icdCode.startsWith("G") || // Neurological
      d.problem.toLowerCase().includes("mobility"),
  );

  if (mobilityDiagnoses.length > 0) {
    components.push({
      name: "Mobility Impairment",
      value: mobilityDiagnoses.length,
      weight: 2,
      contribution: 2,
      description: "Documented mobility issues",
    });
    totalScore += 2;
  }

  // High-risk medications
  const highRiskMedCount =
    data.medications?.filter((m) =>
      // Benzodiazepines, sedatives, opioids, antipsychotics
      ["benzodiazepine", "sedative", "opioid", "antipsychotic"].some((type) =>
        m.class?.toLowerCase().includes(type),
      ),
    ).length || 0;

  if (highRiskMedCount > 0) {
    const medScore = Math.min(highRiskMedCount, 3);
    components.push({
      name: "High-Risk Medications",
      value: highRiskMedCount,
      weight: 1,
      contribution: medScore,
      description: `${highRiskMedCount} high-risk medications`,
    });
    totalScore += medScore;
  }

  let level: RiskLevel;
  if (totalScore >= 10) level = RiskLevel.CRITICAL;
  else if (totalScore >= 7) level = RiskLevel.HIGH;
  else if (totalScore >= 4) level = RiskLevel.MEDIUM;
  else level = RiskLevel.LOW;

  const riskScore: RiskScore = {
    id: generateId(),
    organizationId: "",
    patientId: data.patient.id,
    registryId: null,
    scoreType: RiskScoreType.FALL_RISK,
    score: totalScore,
    level,
    components,
    calculatedDate: new Date(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    trends: [],
    predictedOutcomes: [
      {
        outcome: "Fall in next 6 months",
        probability: Math.min(totalScore / 15, 0.9),
        timeframe: "6 months",
        confidence: 0.7,
        factors: components.map((c) => c.name),
      },
    ],
    interventionRecommendations: [
      "Physical therapy assessment",
      "Home safety evaluation",
      "Review and optimize medications",
      "Fall prevention education",
      "Consider assistive devices",
    ],
    notes: `Fall risk score: ${totalScore}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
  };

  return riskScore;
}

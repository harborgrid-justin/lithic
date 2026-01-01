/**
 * ACO Risk Adjustment Engine
 * HCC (Hierarchical Condition Category) risk scoring and RAF calculation
 * Based on CMS-HCC model for Medicare Advantage and ACO programs
 */

export interface HCCCategory {
  hccCode: string;
  hccLabel: string;
  weight: number;
  description: string;
  icdCodes: string[];
  category: "chronic" | "acute" | "cancer" | "mental-health" | "substance-abuse";
  severity: "low" | "moderate" | "severe";
}

export interface PatientRiskProfile {
  patientId: string;
  age: number;
  gender: "M" | "F";
  medicaidStatus: boolean;
  disabilityStatus: boolean;
  institutionalized: boolean;
  hccCategories: string[];
  activeDiagnoses: string[];
  rafScore: number;
  rafScoreComponents: {
    demographic: number;
    disease: number;
    interactions: number;
  };
  riskCategory: "low" | "moderate" | "high" | "very-high";
  expectedAnnualCost: number;
  codingOpportunities: CodingOpportunity[];
}

export interface CodingOpportunity {
  hccCode: string;
  hccLabel: string;
  suspectDiagnosis: string;
  potentialWeight: number;
  rafImpact: number;
  evidenceStrength: "strong" | "moderate" | "weak";
  lastDocumented?: Date;
  recommendation: string;
}

// ============================================================================
// HCC Model Weights (CMS-HCC V28 - Medicare)
// ============================================================================

/**
 * Get HCC weight by code
 * Simplified subset - full model has 100+ HCCs
 */
export function getHCCWeight(hccCode: string, age: number): number {
  const hccWeights: Record<string, number> = {
    // Cancer
    "HCC8": 0.508,   // Metastatic Cancer and Acute Leukemia
    "HCC9": 0.212,   // Lung and Other Severe Cancers
    "HCC10": 0.173,  // Lymphoma and Other Cancers
    "HCC11": 0.107,  // Colorectal, Bladder, and Other Cancers
    "HCC12": 0.07,   // Breast, Prostate, and Other Cancers

    // Diabetes
    "HCC17": 0.104,  // Diabetes with Acute Complications
    "HCC18": 0.104,  // Diabetes with Chronic Complications
    "HCC19": 0.032,  // Diabetes without Complication

    // Heart Disease
    "HCC85": 0.195,  // Congestive Heart Failure
    "HCC86": 0.195,  // Acute Myocardial Infarction
    "HCC87": 0.046,  // Unstable Angina and Other Acute Ischemic Heart Disease
    "HCC88": 0.032,  // Angina Pectoris

    // Stroke
    "HCC99": 0.101,  // Cerebral Hemorrhage
    "HCC100": 0.177, // Ischemic or Unspecified Stroke
    "HCC103": 0.04,  // Hemiplegia/Hemiparesis

    // Chronic Kidney Disease
    "HCC134": 0.288, // Dialysis Status
    "HCC135": 0.288, // Acute Renal Failure
    "HCC136": 0.181, // Chronic Kidney Disease, Stage 5
    "HCC137": 0.075, // Chronic Kidney Disease, Severe (Stage 4)

    // Respiratory
    "HCC110": 0.34,  // Cystic Fibrosis
    "HCC111": 0.239, // Chronic Obstructive Pulmonary Disease
    "HCC112": 0.086, // Fibrosis of Lung and Other Chronic Lung Disorders

    // Mental Health
    "HCC54": 0.294,  // Substance Use Disorder, Moderate/Severe
    "HCC55": 0.294,  // Substance Use with Complications
    "HCC57": 0.237,  // Schizophrenia
    "HCC58": 0.237,  // Reactive and Unspecified Psychosis

    // Other Major Conditions
    "HCC46": 0.43,   // Severe Hematological Disorders
    "HCC47": 0.141,  // Disorders of Immunity
    "HCC48": 0.203,  // Coagulation Defects and Other Specified Hematological Disorders
  };

  const baseWeight = hccWeights[hccCode] || 0;

  // Age-gender interaction adjustments (simplified)
  if (age >= 80) {
    return baseWeight * 1.15; // Higher weight for very elderly
  } else if (age >= 70) {
    return baseWeight * 1.1;
  }

  return baseWeight;
}

// ============================================================================
// Demographic Component Calculation
// ============================================================================

/**
 * Calculate demographic RAF component
 */
export function calculateDemographicRaf(
  age: number,
  gender: "M" | "F",
  medicaidStatus: boolean,
  disabilityStatus: boolean,
  institutionalized: boolean,
): number {
  let demographicScore = 0;

  // Age-gender categories
  if (gender === "M") {
    if (age < 65) demographicScore = 0.454;
    else if (age < 70) demographicScore = 0.386;
    else if (age < 75) demographicScore = 0.505;
    else if (age < 80) demographicScore = 0.598;
    else if (age < 85) demographicScore = 0.699;
    else if (age < 90) demographicScore = 0.799;
    else demographicScore = 0.899;
  } else {
    if (age < 65) demographicScore = 0.454;
    else if (age < 70) demographicScore = 0.386;
    else if (age < 75) demographicScore = 0.48;
    else if (age < 80) demographicScore = 0.557;
    else if (age < 85) demographicScore = 0.639;
    else if (age < 90) demographicScore = 0.739;
    else demographicScore = 0.839;
  }

  // Medicaid adjustment
  if (medicaidStatus) {
    demographicScore += 0.166;
  }

  // Disability adjustment
  if (disabilityStatus) {
    demographicScore += 0.413;
  }

  // Institutionalized adjustment
  if (institutionalized) {
    demographicScore += 0.246;
  }

  return demographicScore;
}

// ============================================================================
// Disease Component Calculation
// ============================================================================

/**
 * Calculate disease RAF component from HCC categories
 */
export function calculateDiseaseRaf(
  hccCategories: string[],
  age: number,
): number {
  const uniqueHCCs = Array.from(new Set(hccCategories));

  let diseaseScore = 0;

  uniqueHCCs.forEach(hcc => {
    diseaseScore += getHCCWeight(hcc, age);
  });

  return diseaseScore;
}

// ============================================================================
// Interaction Component Calculation
// ============================================================================

/**
 * Calculate disease interaction RAF component
 * HCCs can interact to create additional risk
 */
export function calculateInteractionRaf(
  hccCategories: string[],
  age: number,
  disabilityStatus: boolean,
): number {
  const hccSet = new Set(hccCategories);
  let interactionScore = 0;

  // Diabetes and CHF
  if (hccSet.has("HCC18") && hccSet.has("HCC85")) {
    interactionScore += 0.154;
  }

  // Diabetes and Chronic Kidney Disease
  if (hccSet.has("HCC18") && (hccSet.has("HCC136") || hccSet.has("HCC137"))) {
    interactionScore += 0.11;
  }

  // CHF and Chronic Kidney Disease
  if (hccSet.has("HCC85") && (hccSet.has("HCC136") || hccSet.has("HCC137"))) {
    interactionScore += 0.133;
  }

  // COPD and CHF
  if (hccSet.has("HCC111") && hccSet.has("HCC85")) {
    interactionScore += 0.112;
  }

  // Diabetes and COPD
  if (hccSet.has("HCC18") && hccSet.has("HCC111")) {
    interactionScore += 0.099;
  }

  // Disability interactions
  if (disabilityStatus) {
    // Disabled with CHF
    if (hccSet.has("HCC85")) {
      interactionScore += 0.195;
    }
    // Disabled with Cancer
    if (hccSet.has("HCC8") || hccSet.has("HCC9")) {
      interactionScore += 0.219;
    }
  }

  return interactionScore;
}

// ============================================================================
// Complete RAF Score Calculation
// ============================================================================

/**
 * Calculate complete RAF score for a patient
 */
export function calculateRAFScore(
  age: number,
  gender: "M" | "F",
  medicaidStatus: boolean,
  disabilityStatus: boolean,
  institutionalized: boolean,
  hccCategories: string[],
): {
  rafScore: number;
  components: {
    demographic: number;
    disease: number;
    interactions: number;
  };
} {
  const demographic = calculateDemographicRaf(
    age,
    gender,
    medicaidStatus,
    disabilityStatus,
    institutionalized,
  );

  const disease = calculateDiseaseRaf(hccCategories, age);

  const interactions = calculateInteractionRaf(
    hccCategories,
    age,
    disabilityStatus,
  );

  const rafScore = demographic + disease + interactions;

  return {
    rafScore,
    components: {
      demographic,
      disease,
      interactions,
    },
  };
}

// ============================================================================
// Patient Risk Profiling
// ============================================================================

/**
 * Generate comprehensive risk profile for patient
 */
export function generatePatientRiskProfile(
  patientId: string,
  age: number,
  gender: "M" | "F",
  medicaidStatus: boolean,
  disabilityStatus: boolean,
  institutionalized: boolean,
  activeDiagnoses: string[],
  nationalAverageCost: number = 11000,
): PatientRiskProfile {
  // Map diagnoses to HCC categories (simplified)
  const hccCategories = mapDiagnosesToHCCs(activeDiagnoses);

  // Calculate RAF score
  const rafData = calculateRAFScore(
    age,
    gender,
    medicaidStatus,
    disabilityStatus,
    institutionalized,
    hccCategories,
  );

  // Determine risk category
  const riskCategory = categorizeRisk(rafData.rafScore);

  // Calculate expected cost
  const expectedAnnualCost = nationalAverageCost * rafData.rafScore;

  // Identify coding opportunities
  const codingOpportunities = identifyCodingOpportunities(
    age,
    gender,
    activeDiagnoses,
    hccCategories,
  );

  return {
    patientId,
    age,
    gender,
    medicaidStatus,
    disabilityStatus,
    institutionalized,
    hccCategories,
    activeDiagnoses,
    rafScore: rafData.rafScore,
    rafScoreComponents: rafData.components,
    riskCategory,
    expectedAnnualCost,
    codingOpportunities,
  };
}

/**
 * Map ICD-10 diagnoses to HCC categories
 */
function mapDiagnosesToHCCs(diagnoses: string[]): string[] {
  const hccMapping: Record<string, string> = {
    // Diabetes
    "E11.65": "HCC18",  // Type 2 diabetes with hyperglycemia
    "E11.9": "HCC19",   // Type 2 diabetes without complications

    // Heart Failure
    "I50.9": "HCC85",   // Heart failure, unspecified
    "I50.23": "HCC85",  // Acute on chronic systolic heart failure

    // COPD
    "J44.0": "HCC111",  // COPD with acute lower respiratory infection
    "J44.1": "HCC111",  // COPD with acute exacerbation

    // Cancer
    "C34.90": "HCC9",   // Malignant neoplasm of unspecified part of bronchus or lung
    "C50.919": "HCC12", // Malignant neoplasm of breast

    // CKD
    "N18.5": "HCC136",  // Chronic kidney disease, stage 5
    "N18.4": "HCC137",  // Chronic kidney disease, stage 4

    // Stroke
    "I63.9": "HCC100",  // Cerebral infarction, unspecified
    "I69.351": "HCC103", // Hemiplegia following cerebral infarction
  };

  const hccs: string[] = [];

  diagnoses.forEach(dx => {
    const hcc = hccMapping[dx];
    if (hcc && !hccs.includes(hcc)) {
      hccs.push(hcc);
    }
  });

  return hccs;
}

/**
 * Categorize patient risk level
 */
function categorizeRisk(rafScore: number): "low" | "moderate" | "high" | "very-high" {
  if (rafScore < 0.8) return "low";
  if (rafScore < 1.5) return "moderate";
  if (rafScore < 3.0) return "high";
  return "very-high";
}

/**
 * Identify potential coding opportunities
 */
function identifyCodingOpportunities(
  age: number,
  gender: "M" | "F",
  activeDiagnoses: string[],
  currentHCCs: string[],
): CodingOpportunity[] {
  const opportunities: CodingOpportunity[] = [];

  // Check for common comorbidities based on existing conditions
  const hccSet = new Set(currentHCCs);

  // If patient has diabetes, check for complications
  if (hccSet.has("HCC19") && !hccSet.has("HCC18") && !hccSet.has("HCC17")) {
    opportunities.push({
      hccCode: "HCC18",
      hccLabel: "Diabetes with Chronic Complications",
      suspectDiagnosis: "Consider documenting diabetic complications (neuropathy, retinopathy, nephropathy)",
      potentialWeight: 0.104 - 0.032,
      rafImpact: 0.072,
      evidenceStrength: "moderate",
      recommendation: "Review labs and symptoms for evidence of end-organ damage",
    });
  }

  // If patient has CHF, check for related conditions
  if (hccSet.has("HCC85")) {
    if (!hccSet.has("HCC137") && !hccSet.has("HCC136")) {
      opportunities.push({
        hccCode: "HCC137",
        hccLabel: "Chronic Kidney Disease, Stage 4",
        suspectDiagnosis: "Consider CKD screening in CHF patients",
        potentialWeight: 0.075,
        rafImpact: 0.075,
        evidenceStrength: "moderate",
        recommendation: "Review eGFR and creatinine values",
      });
    }
  }

  // Age-related screening
  if (age >= 75 && !hccSet.has("HCC111")) {
    opportunities.push({
      hccCode: "HCC111",
      hccLabel: "COPD",
      suspectDiagnosis: "Consider COPD screening in elderly patients",
      potentialWeight: 0.239,
      rafImpact: 0.239,
      evidenceStrength: "weak",
      recommendation: "Review spirometry and smoking history",
    });
  }

  return opportunities;
}

// ============================================================================
// Population Risk Adjustment
// ============================================================================

/**
 * Calculate average RAF score for population
 */
export function calculatePopulationRAF(
  patients: PatientRiskProfile[],
): {
  averageRAF: number;
  medianRAF: number;
  riskDistribution: Record<string, number>;
  totalExpectedCost: number;
} {
  if (patients.length === 0) {
    return {
      averageRAF: 0,
      medianRAF: 0,
      riskDistribution: {},
      totalExpectedCost: 0,
    };
  }

  const rafScores = patients.map(p => p.rafScore).sort((a, b) => a - b);
  const averageRAF = rafScores.reduce((a, b) => a + b, 0) / rafScores.length;
  const medianRAF = rafScores[Math.floor(rafScores.length / 2)];

  const riskDistribution: Record<string, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    "very-high": 0,
  };

  let totalExpectedCost = 0;

  patients.forEach(patient => {
    riskDistribution[patient.riskCategory] += 1;
    totalExpectedCost += patient.expectedAnnualCost;
  });

  return {
    averageRAF,
    medianRAF,
    riskDistribution,
    totalExpectedCost,
  };
}

/**
 * Calculate coding intensity and potential revenue impact
 */
export function analyzeCodingOpportunity(
  patients: PatientRiskProfile[],
  revenuePerRAFPoint: number = 9000, // Approximate Medicare payment per RAF point
): {
  totalOpportunities: number;
  potentialRAFIncrease: number;
  potentialRevenueIncrease: number;
  highPriorityPatients: string[];
} {
  let totalOpportunities = 0;
  let potentialRAFIncrease = 0;
  const highPriorityPatients: string[] = [];

  patients.forEach(patient => {
    const patientOpportunityValue = patient.codingOpportunities.reduce(
      (sum, opp) => sum + opp.rafImpact,
      0,
    );

    totalOpportunities += patient.codingOpportunities.length;
    potentialRAFIncrease += patientOpportunityValue;

    // High priority if opportunities could increase RAF by > 0.5
    if (patientOpportunityValue > 0.5) {
      highPriorityPatients.push(patient.patientId);
    }
  });

  const potentialRevenueIncrease = potentialRAFIncrease * revenuePerRAFPoint;

  return {
    totalOpportunities,
    potentialRAFIncrease,
    potentialRevenueIncrease,
    highPriorityPatients,
  };
}

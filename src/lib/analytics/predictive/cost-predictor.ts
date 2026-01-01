/**
 * Healthcare Cost Prediction Model
 * Predicts future healthcare costs for population health and financial planning
 */

import type { Prediction, PredictionFactor, RiskLevel } from "@/types/analytics-enterprise";

export interface CostPredictionInput {
  patientId: string;

  // Demographics
  age: number;
  gender: "M" | "F" | "O";

  // Historical costs (past 12 months)
  totalCosts: number;
  inpatientCosts: number;
  outpatientCosts: number;
  emergencyCosts: number;
  pharmacyCosts: number;
  imagingCosts: number;
  laboratoryCosts: number;

  // Utilization
  admissions: number;
  edVisits: number;
  outpatientVisits: number;
  procedureCount: number;

  // Clinical factors
  chronicConditions: number;
  activeDiagnoses: string[];
  comorbidityIndex: number; // Charlson or Elixhauser
  prescriptionCount: number;

  // High-cost conditions
  hasESRD: boolean;
  hasHemophilia: boolean;
  hasOrganTransplant: boolean;
  hasActiveCancer: boolean;
  hasChf: boolean;
  hasDiabetes: boolean;
  hasCopd: boolean;

  // Social & behavioral
  hasSubstanceAbuse: boolean;
  hasMentalHealth: boolean;
  smokingStatus: "never" | "former" | "current";

  // Risk indicators
  recentDiagnoses: number;
  recentSurgery: boolean;
  onBiologics: boolean;
  onChemotherapy: boolean;
  onDialysis: boolean;

  // Insurance & access
  insuranceType: "commercial" | "medicare" | "medicaid" | "uninsured";
  hasHighDeductible: boolean;
}

export interface CostPredictionOutput extends Prediction {
  predictedTotalCost: number;
  predictedInpatientCost: number;
  predictedOutpatientCost: number;
  predictedPharmacyCost: number;
  costCategory: "low" | "moderate" | "high" | "catastrophic";
  percentile: number;
  costDrivers: Array<{ category: string; amount: number; percentage: number }>;
  interventionOpportunities: string[];
  potentialSavings: number;
}

/**
 * Average annual healthcare costs by category (in USD)
 */
const BASELINE_COSTS = {
  healthy: 5000,
  chronic1: 8000,
  chronic2: 12000,
  chronic3plus: 18000,
  highCost: 50000,
  catastrophic: 150000,
};

/**
 * Cost multipliers for various conditions and factors
 */
const COST_MULTIPLIERS = {
  // Extremely high-cost conditions
  esrd: 8.5,
  hemophilia: 12.0,
  organTransplant: 9.0,
  activeCancer: 6.5,
  onDialysis: 8.0,
  onChemotherapy: 5.5,

  // High-cost chronic conditions
  chf: 2.8,
  copd: 2.2,
  diabetes: 1.8,

  // Behavioral health
  substanceAbuse: 2.0,
  mentalHealth: 1.5,

  // Utilization-based
  frequentEd: 1.6,
  frequentAdmissions: 3.2,
  recentSurgery: 2.5,

  // Pharmacy
  biologics: 4.0,
  polypharmacy: 1.4,

  // Age
  elderly: 1.6,
  veryElderly: 2.2,

  // Comorbidity
  comorbidityPerPoint: 1.15,
};

/**
 * Predict future healthcare costs
 */
export function predictCosts(input: CostPredictionInput): CostPredictionOutput {
  const factors: PredictionFactor[] = [];
  let predictedTotalCost = 0;
  let inpatientCost = 0;
  let outpatientCost = 0;
  let pharmacyCost = 0;

  // Start with baseline from historical costs (persistence model)
  const historicalBaseline = input.totalCosts;
  let costMultiplier = 1.0;

  // Extremely high-cost conditions
  if (input.hasESRD || input.onDialysis) {
    const multiplier = COST_MULTIPLIERS.esrd;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.catastrophic * (multiplier - 1);
    factors.push({
      feature: "End-Stage Renal Disease / Dialysis",
      value: "Present",
      contribution,
      description: "ESRD is among the highest cost conditions ($90K+ annually)",
    });
  }

  if (input.hasHemophilia) {
    const multiplier = COST_MULTIPLIERS.hemophilia;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.catastrophic * (multiplier - 1);
    factors.push({
      feature: "Hemophilia",
      value: "Present",
      contribution,
      description: "Factor replacement therapy drives extremely high costs",
    });
  }

  if (input.hasOrganTransplant) {
    const multiplier = COST_MULTIPLIERS.organTransplant;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.catastrophic * (multiplier - 1);
    factors.push({
      feature: "Organ Transplant",
      value: "Present",
      contribution,
      description: "Immunosuppression and monitoring require ongoing high costs",
    });
  }

  if (input.hasActiveCancer || input.onChemotherapy) {
    const multiplier = input.onChemotherapy
      ? COST_MULTIPLIERS.onChemotherapy
      : COST_MULTIPLIERS.activeCancer;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.highCost * (multiplier - 1);
    factors.push({
      feature: "Active Cancer Treatment",
      value: input.onChemotherapy ? "On chemotherapy" : "Present",
      contribution,
      description: "Cancer treatment including drugs, procedures, and supportive care",
    });
  }

  // High-cost chronic conditions
  if (input.hasChf) {
    const multiplier = COST_MULTIPLIERS.chf;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic3plus * (multiplier - 1);
    factors.push({
      feature: "Congestive Heart Failure",
      value: "Present",
      contribution,
      description: "CHF drives high costs through admissions and medications",
    });
  }

  if (input.hasCopd) {
    const multiplier = COST_MULTIPLIERS.copd;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic2 * (multiplier - 1);
    factors.push({
      feature: "COPD",
      value: "Present",
      contribution,
      description: "COPD exacerbations and medications increase costs",
    });
  }

  if (input.hasDiabetes) {
    const multiplier = COST_MULTIPLIERS.diabetes;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic2 * (multiplier - 1);
    factors.push({
      feature: "Diabetes",
      value: "Present",
      contribution,
      description: "Diabetes medications and complications management",
    });
  }

  // Utilization-based cost drivers
  if (input.edVisits >= 4) {
    const multiplier = COST_MULTIPLIERS.frequentEd;
    costMultiplier *= multiplier;
    const contribution = input.edVisits * 1500; // Average ED cost
    factors.push({
      feature: "Frequent ED Use",
      value: `${input.edVisits} visits`,
      contribution,
      description: "Multiple ED visits at ~$1,500 each",
    });
  }

  if (input.admissions >= 2) {
    const multiplier = COST_MULTIPLIERS.frequentAdmissions;
    costMultiplier *= multiplier;
    const contribution = input.admissions * 15000; // Average admission cost
    factors.push({
      feature: "Multiple Hospitalizations",
      value: `${input.admissions} admissions`,
      contribution,
      description: "Hospital admissions at ~$15,000 each",
    });
  }

  if (input.recentSurgery) {
    const multiplier = COST_MULTIPLIERS.recentSurgery;
    costMultiplier *= multiplier;
    const contribution = 25000;
    factors.push({
      feature: "Recent Surgery",
      value: "Yes",
      contribution,
      description: "Surgical procedures and perioperative care",
    });
  }

  // Pharmacy cost drivers
  if (input.onBiologics) {
    const multiplier = COST_MULTIPLIERS.biologics;
    costMultiplier *= multiplier;
    const contribution = 40000; // Average biologic cost per year
    factors.push({
      feature: "Biologic Medications",
      value: "Yes",
      contribution,
      description: "Biologic drugs average $40K+ annually",
    });
    pharmacyCost += contribution;
  }

  if (input.prescriptionCount >= 10) {
    const multiplier = COST_MULTIPLIERS.polypharmacy;
    costMultiplier *= multiplier;
    const contribution = input.prescriptionCount * 1200; // $100/month per med
    factors.push({
      feature: "Polypharmacy",
      value: `${input.prescriptionCount} medications`,
      contribution,
      description: "Multiple medications increase pharmacy costs",
    });
    pharmacyCost += contribution;
  }

  // Behavioral health
  if (input.hasSubstanceAbuse) {
    const multiplier = COST_MULTIPLIERS.substanceAbuse;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic2 * (multiplier - 1);
    factors.push({
      feature: "Substance Use Disorder",
      value: "Present",
      contribution,
      description: "SUD associated with higher ED use and hospitalizations",
    });
  }

  if (input.hasMentalHealth) {
    const multiplier = COST_MULTIPLIERS.mentalHealth;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic1 * (multiplier - 1);
    factors.push({
      feature: "Mental Health Diagnosis",
      value: "Present",
      contribution,
      description: "Mental health comorbidity increases overall costs",
    });
  }

  // Comorbidity burden (Charlson/Elixhauser index)
  if (input.comorbidityIndex > 0) {
    const multiplier = Math.pow(
      COST_MULTIPLIERS.comorbidityPerPoint,
      input.comorbidityIndex,
    );
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic3plus * (multiplier - 1);
    factors.push({
      feature: "Comorbidity Index",
      value: input.comorbidityIndex,
      contribution,
      description: `Comorbidity score of ${input.comorbidityIndex} increases complexity`,
    });
  }

  // Age factors
  if (input.age >= 85) {
    const multiplier = COST_MULTIPLIERS.veryElderly;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic2 * (multiplier - 1);
    factors.push({
      feature: "Very Elderly",
      value: input.age,
      contribution,
      description: "Age 85+ associated with higher utilization",
    });
  } else if (input.age >= 65) {
    const multiplier = COST_MULTIPLIERS.elderly;
    costMultiplier *= multiplier;
    const contribution = BASELINE_COSTS.chronic1 * (multiplier - 1);
    factors.push({
      feature: "Elderly",
      value: input.age,
      contribution,
      description: "Age 65+ increases healthcare costs",
    });
  }

  // Calculate predicted total cost
  if (historicalBaseline > 0) {
    // Use combination of historical costs and multipliers
    predictedTotalCost = historicalBaseline * 0.7 + historicalBaseline * costMultiplier * 0.3;
  } else {
    // New patient - use baseline estimates
    const baseCost =
      input.chronicConditions >= 3
        ? BASELINE_COSTS.chronic3plus
        : input.chronicConditions === 2
          ? BASELINE_COSTS.chronic2
          : input.chronicConditions === 1
            ? BASELINE_COSTS.chronic1
            : BASELINE_COSTS.healthy;
    predictedTotalCost = baseCost * costMultiplier;
  }

  // Distribute costs across categories
  if (input.admissions >= 2 || input.hasChf || input.hasCopd) {
    inpatientCost = predictedTotalCost * 0.5; // 50% inpatient for high utilizers
    outpatientCost = predictedTotalCost * 0.3;
    pharmacyCost = Math.max(pharmacyCost, predictedTotalCost * 0.2);
  } else if (input.onBiologics || input.prescriptionCount >= 10) {
    inpatientCost = predictedTotalCost * 0.2;
    outpatientCost = predictedTotalCost * 0.3;
    pharmacyCost = Math.max(pharmacyCost, predictedTotalCost * 0.5);
  } else {
    inpatientCost = predictedTotalCost * 0.3;
    outpatientCost = predictedTotalCost * 0.5;
    pharmacyCost = Math.max(pharmacyCost, predictedTotalCost * 0.2);
  }

  // Calculate cost drivers by category
  const costDrivers = [
    {
      category: "Inpatient Care",
      amount: inpatientCost,
      percentage: (inpatientCost / predictedTotalCost) * 100,
    },
    {
      category: "Outpatient Care",
      amount: outpatientCost,
      percentage: (outpatientCost / predictedTotalCost) * 100,
    },
    {
      category: "Pharmacy",
      amount: pharmacyCost,
      percentage: (pharmacyCost / predictedTotalCost) * 100,
    },
  ];

  // Determine cost category and percentile
  const costCategory = getCostCategory(predictedTotalCost);
  const percentile = calculateCostPercentile(predictedTotalCost);

  // Generate intervention opportunities
  const interventionOpportunities = identifyInterventionOpportunities(input, factors);

  // Calculate potential savings
  const potentialSavings = calculatePotentialSavings(
    input,
    predictedTotalCost,
    interventionOpportunities,
  );

  // Determine risk level based on predicted costs
  const riskLevel = getCostRiskLevel(predictedTotalCost);
  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    id: `cost-${input.patientId}-${Date.now()}`,
    patientId: input.patientId,
    modelId: "cost-predictor-v1",
    modelVersion: "1.0",
    predictionType: "cost_prediction",
    score: totalScore,
    probability: Math.min(100, (predictedTotalCost / 100000) * 100),
    riskLevel,
    predictedAt: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    factors,
    recommendations: interventionOpportunities,
    confidence: 75,
    predictedTotalCost,
    predictedInpatientCost: inpatientCost,
    predictedOutpatientCost: outpatientCost,
    predictedPharmacyCost: pharmacyCost,
    costCategory,
    percentile,
    costDrivers,
    interventionOpportunities,
    potentialSavings,
  };
}

/**
 * Determine cost category
 */
function getCostCategory(cost: number): "low" | "moderate" | "high" | "catastrophic" {
  if (cost >= 100000) return "catastrophic";
  if (cost >= 50000) return "high";
  if (cost >= 15000) return "moderate";
  return "low";
}

/**
 * Calculate cost percentile
 */
function calculateCostPercentile(cost: number): number {
  // Simplified percentile calculation
  // In reality, would compare against population distribution
  if (cost >= 100000) return 99;
  if (cost >= 50000) return 95;
  if (cost >= 25000) return 85;
  if (cost >= 15000) return 70;
  if (cost >= 10000) return 50;
  return 30;
}

/**
 * Get risk level based on cost
 */
function getCostRiskLevel(cost: number): RiskLevel {
  if (cost >= 100000) return "very_high";
  if (cost >= 50000) return "high";
  if (cost >= 25000) return "moderate";
  return "low";
}

/**
 * Identify intervention opportunities
 */
function identifyInterventionOpportunities(
  input: CostPredictionInput,
  factors: PredictionFactor[],
): string[] {
  const opportunities: string[] = [];

  // High-cost condition management
  if (input.hasChf) {
    opportunities.push("Enroll in CHF disease management program to reduce admissions");
    opportunities.push("Home telemonitoring to prevent exacerbations");
  }

  if (input.hasCopd) {
    opportunities.push("COPD action plan and pulmonary rehabilitation");
    opportunities.push("Smoking cessation if current smoker");
  }

  if (input.hasDiabetes) {
    opportunities.push("Diabetes self-management education");
    opportunities.push("Continuous glucose monitoring for better control");
  }

  // Utilization reduction
  if (input.admissions >= 3) {
    opportunities.push("Transitional care management to prevent readmissions");
    opportunities.push("High-risk care management program");
  }

  if (input.edVisits >= 4) {
    opportunities.push("Establish primary care medical home");
    opportunities.push("24/7 nurse hotline access for triage");
    opportunities.push("Urgent care education and access");
  }

  // Pharmacy optimization
  if (input.onBiologics) {
    opportunities.push("Explore biosimilar options when available");
    opportunities.push("Patient assistance programs for high-cost medications");
  }

  if (input.prescriptionCount >= 10) {
    opportunities.push("Medication therapy management and deprescribing");
    opportunities.push("Generic substitution where appropriate");
    opportunities.push("90-day supplies to reduce costs");
  }

  // Preventive interventions
  if (input.recentDiagnoses >= 3) {
    opportunities.push("Care coordination to manage new diagnoses");
    opportunities.push("Prevent complications through tight disease control");
  }

  // Social support
  if (input.hasSubstanceAbuse) {
    opportunities.push("Substance abuse treatment to reduce ED utilization");
  }

  if (input.hasMentalHealth) {
    opportunities.push("Integrated behavioral health services");
  }

  // High-cost procedures
  if (input.procedureCount >= 5) {
    opportunities.push("Utilize appropriate use criteria to avoid unnecessary procedures");
    opportunities.push("Explore conservative management options");
  }

  return opportunities;
}

/**
 * Calculate potential savings from interventions
 */
function calculatePotentialSavings(
  input: CostPredictionInput,
  predictedCost: number,
  interventions: string[],
): number {
  let potentialSavings = 0;

  // Estimate savings from various interventions (conservative estimates)
  if (input.hasChf && input.admissions >= 2) {
    potentialSavings += 15000; // CHF program can prevent ~1 admission
  }

  if (input.hasCopd && input.edVisits >= 3) {
    potentialSavings += 4500; // COPD management reduces ~3 ED visits
  }

  if (input.edVisits >= 5) {
    potentialSavings += 6000; // Medical home reduces inappropriate ED use
  }

  if (input.prescriptionCount >= 15) {
    potentialSavings += 3000; // Medication optimization
  }

  if (input.admissions >= 3) {
    potentialSavings += 12000; // Transitional care reduces readmissions
  }

  // Cap savings at 30% of predicted costs (realistic maximum)
  return Math.min(potentialSavings, predictedCost * 0.3);
}

/**
 * Batch prediction
 */
export function batchPredictCosts(inputs: CostPredictionInput[]): CostPredictionOutput[] {
  return inputs.map((input) => predictCosts(input));
}

/**
 * Identify high-cost patients for intervention
 */
export function identifyHighCostPatients(
  predictions: CostPredictionOutput[],
  threshold: number = 50000,
): CostPredictionOutput[] {
  return predictions
    .filter((p) => p.predictedTotalCost >= threshold)
    .sort((a, b) => b.predictedTotalCost - a.predictedTotalCost);
}

/**
 * Calculate total population cost forecast
 */
export function calculatePopulationCostForecast(
  predictions: CostPredictionOutput[],
): {
  totalPredictedCost: number;
  averageCost: number;
  medianCost: number;
  top10PercentCost: number;
  top10PercentPatients: number;
  byCategory: Record<string, { count: number; totalCost: number; percentage: number }>;
} {
  const totalCost = predictions.reduce((sum, p) => sum + p.predictedTotalCost, 0);
  const sortedCosts = predictions
    .map((p) => p.predictedTotalCost)
    .sort((a, b) => a - b);

  const top10Count = Math.ceil(predictions.length * 0.1);
  const top10Costs = sortedCosts.slice(-top10Count);
  const top10Total = top10Costs.reduce((sum, c) => sum + c, 0);

  const byCategory: Record<string, { count: number; totalCost: number; percentage: number }> = {};
  ["low", "moderate", "high", "catastrophic"].forEach((cat) => {
    const catPredictions = predictions.filter((p) => p.costCategory === cat);
    const catTotal = catPredictions.reduce((sum, p) => sum + p.predictedTotalCost, 0);
    byCategory[cat] = {
      count: catPredictions.length,
      totalCost: catTotal,
      percentage: (catTotal / totalCost) * 100,
    };
  });

  return {
    totalPredictedCost: totalCost,
    averageCost: totalCost / predictions.length,
    medianCost: sortedCosts[Math.floor(sortedCosts.length / 2)],
    top10PercentCost: top10Total,
    top10PercentPatients: top10Count,
    byCategory,
  };
}

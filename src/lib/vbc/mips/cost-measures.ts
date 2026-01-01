/**
 * MIPS Cost Category
 * Administrative claims-based cost measures
 * Automatically calculated by CMS - no submission required
 */

export type CostMeasureType = "total-per-capita" | "episode-based" | "procedural";

export interface CostMeasure {
  measureId: string;
  measureName: string;
  description: string;
  measureType: CostMeasureType;
  specialty: string[];

  // Performance
  attributedCases: number;
  averageCost: number;
  nationalAverage: number;
  benchmark: number;

  // Scoring
  percentile: number;
  measurePoints: number;
  maxPoints: number;

  // Breakdown
  costComponents?: CostComponent[];
}

export interface CostComponent {
  category: string;
  cost: number;
  percent: number;
}

export interface CostCategory {
  totalMeasures: number;
  measuresScored: number;
  totalPoints: number;
  maxPoints: number;
  categoryScore: number;
  categoryWeight: number;
  weightedScore: number;

  measures: CostMeasure[];
}

// ============================================================================
// Total Per Capita Cost Measures
// ============================================================================

/**
 * Calculate Total Per Capita Cost (TPCC) measure
 */
export function calculateTotalPerCapitaCost(
  attributedBeneficiaries: number,
  totalCost: number,
  nationalAveragePMPM: number,
  memberMonths: number,
): CostMeasure {
  const averageCost = memberMonths > 0 ? totalCost / memberMonths : 0;
  const benchmark = nationalAveragePMPM;

  // Calculate percentile (simplified - CMS uses complex methodology)
  const variance = ((averageCost - benchmark) / benchmark) * 100;
  const percentile = calculateCostPercentile(variance);

  const { measurePoints, maxPoints } = calculateCostPoints(percentile);

  return {
    measureId: "COST_TPCC",
    measureName: "Total Per Capita Cost",
    description: "Total cost of care for all attributed beneficiaries",
    measureType: "total-per-capita",
    specialty: ["All"],
    attributedCases: attributedBeneficiaries,
    averageCost,
    nationalAverage: nationalAveragePMPM,
    benchmark,
    percentile,
    measurePoints,
    maxPoints,
  };
}

// ============================================================================
// Episode-Based Cost Measures
// ============================================================================

/**
 * Get episode-based cost measure definition
 */
export function getEpisodeCostMeasureDefinition(measureId: string): Partial<CostMeasure> {
  const measures: Record<string, Partial<CostMeasure>> = {
    "COST_AMI": {
      measureId: "COST_AMI",
      measureName: "Acute Myocardial Infarction (AMI)",
      description: "Cost of care for acute myocardial infarction episodes",
      measureType: "episode-based",
      specialty: ["Cardiology", "Internal Medicine"],
    },

    "COST_CABG": {
      measureId: "COST_CABG",
      measureName: "Coronary Artery Bypass Graft (CABG)",
      description: "Cost of care for CABG procedures",
      measureType: "episode-based",
      specialty: ["Cardiothoracic Surgery", "Cardiology"],
    },

    "COST_COPD": {
      measureId: "COST_COPD",
      measureName: "Chronic Obstructive Pulmonary Disease (COPD)",
      description: "Cost of care for COPD exacerbation episodes",
      measureType: "episode-based",
      specialty: ["Pulmonology", "Internal Medicine"],
    },

    "COST_HF": {
      measureId: "COST_HF",
      measureName: "Heart Failure",
      description: "Cost of care for heart failure episodes",
      measureType: "episode-based",
      specialty: ["Cardiology", "Internal Medicine"],
    },

    "COST_PNEUMONIA": {
      measureId: "COST_PNEUMONIA",
      measureName: "Pneumonia",
      description: "Cost of care for pneumonia episodes",
      measureType: "episode-based",
      specialty: ["Pulmonology", "Internal Medicine", "Family Medicine"],
    },

    "COST_THA_TKA": {
      measureId: "COST_THA_TKA",
      measureName: "Total Hip/Knee Arthroplasty",
      description: "Cost of care for total hip or knee replacement procedures",
      measureType: "episode-based",
      specialty: ["Orthopedic Surgery"],
    },

    "COST_DIABETES": {
      measureId: "COST_DIABETES",
      measureName: "Diabetes",
      description: "Cost of care for diabetes management",
      measureType: "episode-based",
      specialty: ["Endocrinology", "Internal Medicine", "Family Medicine"],
    },

    "COST_ASTHMA": {
      measureId: "COST_ASTHMA",
      measureName: "Asthma/COPD",
      description: "Cost of care for asthma or COPD episodes",
      measureType: "episode-based",
      specialty: ["Pulmonology", "Allergy/Immunology"],
    },

    "COST_CKD": {
      measureId: "COST_CKD",
      measureName: "Chronic Kidney Disease",
      description: "Cost of care for chronic kidney disease management",
      measureType: "episode-based",
      specialty: ["Nephrology", "Internal Medicine"],
    },
  };

  return measures[measureId] || {};
}

/**
 * Calculate episode-based cost measure
 */
export function calculateEpisodeCostMeasure(
  measureId: string,
  episodeCount: number,
  totalCost: number,
  nationalAveragePerEpisode: number,
  costBreakdown: CostComponent[] = [],
): CostMeasure {
  const definition = getEpisodeCostMeasureDefinition(measureId);

  const averageCost = episodeCount > 0 ? totalCost / episodeCount : 0;
  const benchmark = nationalAveragePerEpisode;

  // Calculate variance and percentile
  const variance = benchmark > 0 ? ((averageCost - benchmark) / benchmark) * 100 : 0;
  const percentile = calculateCostPercentile(variance);

  const { measurePoints, maxPoints } = calculateCostPoints(percentile);

  return {
    measureId,
    measureName: definition.measureName || "",
    description: definition.description || "",
    measureType: "episode-based",
    specialty: definition.specialty || [],
    attributedCases: episodeCount,
    averageCost,
    nationalAverage: nationalAveragePerEpisode,
    benchmark,
    percentile,
    measurePoints,
    maxPoints,
    costComponents: costBreakdown,
  };
}

// ============================================================================
// Procedural Episode Cost Measures
// ============================================================================

/**
 * Calculate procedural episode cost
 */
export function calculateProceduralCost(
  procedureName: string,
  procedureCount: number,
  totalCost: number,
  nationalAveragePerProcedure: number,
): CostMeasure {
  const averageCost = procedureCount > 0 ? totalCost / procedureCount : 0;
  const benchmark = nationalAveragePerProcedure;

  const variance = benchmark > 0 ? ((averageCost - benchmark) / benchmark) * 100 : 0;
  const percentile = calculateCostPercentile(variance);

  const { measurePoints, maxPoints } = calculateCostPoints(percentile);

  return {
    measureId: `COST_PROC_${procedureName.toUpperCase().replace(/\s+/g, "_")}`,
    measureName: `${procedureName} Procedural Episode`,
    description: `Cost of care for ${procedureName} procedures`,
    measureType: "procedural",
    specialty: [],
    attributedCases: procedureCount,
    averageCost,
    nationalAverage: nationalAveragePerProcedure,
    benchmark,
    percentile,
    measurePoints,
    maxPoints,
  };
}

// ============================================================================
// Cost Scoring
// ============================================================================

/**
 * Calculate percentile from cost variance
 * Lower cost = higher percentile (better performance)
 */
function calculateCostPercentile(variancePercent: number): number {
  // Simplified percentile calculation
  // In reality, CMS uses complex methodology with national distribution

  if (variancePercent <= -20) return 95; // 20%+ below benchmark
  if (variancePercent <= -15) return 85;
  if (variancePercent <= -10) return 75;
  if (variancePercent <= -5) return 65;
  if (variancePercent <= 0) return 55;
  if (variancePercent <= 5) return 45;
  if (variancePercent <= 10) return 35;
  if (variancePercent <= 15) return 25;
  if (variancePercent <= 20) return 15;
  return 5; // 20%+ above benchmark
}

/**
 * Calculate cost measure points based on percentile
 */
function calculateCostPoints(percentile: number): {
  measurePoints: number;
  maxPoints: number;
} {
  const maxPoints = 10;

  let measurePoints = 0;

  if (percentile >= 90) {
    measurePoints = maxPoints; // Top decile
  } else if (percentile >= 80) {
    measurePoints = maxPoints * 0.9;
  } else if (percentile >= 70) {
    measurePoints = maxPoints * 0.8;
  } else if (percentile >= 60) {
    measurePoints = maxPoints * 0.7;
  } else if (percentile >= 50) {
    measurePoints = maxPoints * 0.6;
  } else if (percentile >= 40) {
    measurePoints = maxPoints * 0.5;
  } else if (percentile >= 30) {
    measurePoints = maxPoints * 0.4;
  } else if (percentile >= 20) {
    measurePoints = maxPoints * 0.3;
  } else if (percentile >= 10) {
    measurePoints = maxPoints * 0.2;
  } else {
    measurePoints = maxPoints * 0.1;
  }

  return { measurePoints, maxPoints };
}

// ============================================================================
// Cost Category Scoring
// ============================================================================

/**
 * Calculate overall cost category score
 */
export function calculateCostCategoryScore(
  measures: CostMeasure[],
  categoryWeight: number = 0.30, // 30% in 2024+
): CostCategory {
  // Filter measures with minimum case count (20 cases typically)
  const scoredMeasures = measures.filter(m => m.attributedCases >= 20);

  if (scoredMeasures.length === 0) {
    return {
      totalMeasures: measures.length,
      measuresScored: 0,
      totalPoints: 0,
      maxPoints: 0,
      categoryScore: 0,
      categoryWeight,
      weightedScore: 0,
      measures: [],
    };
  }

  const totalPoints = scoredMeasures.reduce((sum, m) => sum + m.measurePoints, 0);
  const maxPoints = scoredMeasures.reduce((sum, m) => sum + m.maxPoints, 0);

  const categoryScore = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
  const weightedScore = categoryScore * categoryWeight;

  return {
    totalMeasures: measures.length,
    measuresScored: scoredMeasures.length,
    totalPoints,
    maxPoints,
    categoryScore,
    categoryWeight,
    weightedScore,
    measures: scoredMeasures,
  };
}

// ============================================================================
// Cost Analysis and Drivers
// ============================================================================

/**
 * Analyze cost drivers for episode
 */
export function analyzeCostDrivers(
  totalCost: number,
  inpatientCost: number,
  outpatientCost: number,
  professionalCost: number,
  prescriptionCost: number,
  dmeost: number, // Durable Medical Equipment and Other
): CostComponent[] {
  const components: CostComponent[] = [
    {
      category: "Inpatient",
      cost: inpatientCost,
      percent: totalCost > 0 ? (inpatientCost / totalCost) * 100 : 0,
    },
    {
      category: "Outpatient",
      cost: outpatientCost,
      percent: totalCost > 0 ? (outpatientCost / totalCost) * 100 : 0,
    },
    {
      category: "Professional",
      cost: professionalCost,
      percent: totalCost > 0 ? (professionalCost / totalCost) * 100 : 0,
    },
    {
      category: "Prescription Drugs",
      cost: prescriptionCost,
      percent: totalCost > 0 ? (prescriptionCost / totalCost) * 100 : 0,
    },
    {
      category: "DME & Other",
      cost: dmeost,
      percent: totalCost > 0 ? (dmeost / totalCost) * 100 : 0,
    },
  ];

  return components.sort((a, b) => b.cost - a.cost);
}

/**
 * Identify high-cost outlier episodes
 */
export function identifyOutlierEpisodes(
  episodes: Array<{ episodeId: string; cost: number }>,
  threshold: number = 2.0, // 2x average
): {
  outliers: Array<{ episodeId: string; cost: number; excessCost: number }>;
  averageCost: number;
  outlierThreshold: number;
  totalExcessCost: number;
} {
  if (episodes.length === 0) {
    return {
      outliers: [],
      averageCost: 0,
      outlierThreshold: 0,
      totalExcessCost: 0,
    };
  }

  const totalCost = episodes.reduce((sum, e) => sum + e.cost, 0);
  const averageCost = totalCost / episodes.length;
  const outlierThreshold = averageCost * threshold;

  const outliers = episodes
    .filter(e => e.cost > outlierThreshold)
    .map(e => ({
      episodeId: e.episodeId,
      cost: e.cost,
      excessCost: e.cost - averageCost,
    }))
    .sort((a, b) => b.cost - a.cost);

  const totalExcessCost = outliers.reduce((sum, o) => sum + o.excessCost, 0);

  return {
    outliers,
    averageCost,
    outlierThreshold,
    totalExcessCost,
  };
}

// ============================================================================
// Cost Reduction Opportunities
// ============================================================================

/**
 * Identify cost reduction opportunities
 */
export function identifyCostReductionOpportunities(
  measure: CostMeasure,
  nationalBenchmark: number,
): {
  potentialSavings: number;
  savingsPerEpisode: number;
  topOpportunities: Array<{
    area: string;
    currentCost: number;
    targetCost: number;
    savings: number;
  }>;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  const topOpportunities: Array<{
    area: string;
    currentCost: number;
    targetCost: number;
    savings: number;
  }> = [];

  const savingsPerEpisode = Math.max(0, measure.averageCost - nationalBenchmark);
  const potentialSavings = savingsPerEpisode * measure.attributedCases;

  if (savingsPerEpisode > 0) {
    recommendations.push(
      `Average cost ($${measure.averageCost.toFixed(2)}) exceeds benchmark ($${nationalBenchmark.toFixed(2)})`
    );

    // Analyze cost components if available
    if (measure.costComponents && measure.costComponents.length > 0) {
      const topDrivers = measure.costComponents
        .filter(c => c.percent > 20) // Focus on components >20% of total
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 3);

      topDrivers.forEach(driver => {
        const targetReduction = 0.1; // Target 10% reduction
        const targetCost = driver.cost * (1 - targetReduction);
        const savings = driver.cost - targetCost;

        topOpportunities.push({
          area: driver.category,
          currentCost: driver.cost,
          targetCost,
          savings,
        });

        recommendations.push(
          `${driver.category}: $${driver.cost.toFixed(2)} (${driver.percent.toFixed(1)}% of total) - target 10% reduction`
        );
      });
    }

    // Episode-specific recommendations
    if (measure.measureType === "episode-based") {
      recommendations.push("Review high-cost episodes for avoidable complications");
      recommendations.push("Implement care pathways to standardize treatment");
      recommendations.push("Evaluate post-acute care utilization patterns");
    }
  } else {
    recommendations.push(
      `Cost performance is good - ${measure.percentile}th percentile nationally`
    );
  }

  return {
    potentialSavings,
    savingsPerEpisode,
    topOpportunities,
    recommendations,
  };
}

// ============================================================================
// Cost Trend Analysis
// ============================================================================

/**
 * Analyze cost trends over time
 */
export function analyzeCostTrends(
  historicalCosts: Array<{ period: string; averageCost: number; volume: number }>,
): {
  trend: "improving" | "worsening" | "stable";
  percentChange: number;
  volumeChange: number;
  projection: number;
} {
  if (historicalCosts.length < 2) {
    return {
      trend: "stable",
      percentChange: 0,
      volumeChange: 0,
      projection: historicalCosts[0]?.averageCost || 0,
    };
  }

  const latest = historicalCosts[historicalCosts.length - 1];
  const previous = historicalCosts[historicalCosts.length - 2];

  const percentChange = previous.averageCost > 0
    ? ((latest.averageCost - previous.averageCost) / previous.averageCost) * 100
    : 0;

  const volumeChange = previous.volume > 0
    ? ((latest.volume - previous.volume) / previous.volume) * 100
    : 0;

  let trend: "improving" | "worsening" | "stable" = "stable";
  if (Math.abs(percentChange) > 5) {
    trend = percentChange < 0 ? "improving" : "worsening";
  }

  // Simple linear projection for next period
  const projection = latest.averageCost * (1 + percentChange / 100);

  return {
    trend,
    percentChange,
    volumeChange,
    projection,
  };
}

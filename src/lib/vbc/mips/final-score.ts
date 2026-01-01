/**
 * MIPS Final Score Calculator
 * Combines Quality, Cost, Improvement Activities, and Promoting Interoperability
 * Calculates payment adjustment and exceptional performance determination
 */

import type { QualityCategory } from "./quality-measures";
import type { PICategory } from "./promoting-interoperability";
import type { IACategory } from "./improvement-activities";
import type { CostCategory } from "./cost-measures";

export interface MIPSFinalScore {
  performanceYear: number;
  clinicianNPI?: string;
  groupTIN?: string;

  // Category scores
  qualityScore: number;
  costScore: number;
  iaScore: number;
  piScore: number;

  // Category weights
  qualityWeight: number;
  costWeight: number;
  iaWeight: number;
  piWeight: number;

  // Weighted scores
  qualityWeighted: number;
  costWeighted: number;
  iaWeighted: number;
  piWeighted: number;

  // Final score (0-100)
  finalScore: number;

  // Payment adjustment
  paymentAdjustmentPercent: number;
  paymentAdjustmentDirection: "positive" | "negative" | "neutral";

  // Performance thresholds
  performanceThreshold: number;
  exceptionalPerformanceThreshold: number;
  meetsPerformanceThreshold: boolean;
  achievesExceptionalPerformance: boolean;

  // Additional details
  complexPatientBonus: number;
  smallPracticeBonus: number;
  totalBonus: number;
}

export interface PerformanceThresholds {
  performanceYear: number;
  performanceThreshold: number;
  exceptionalPerformanceThreshold: number;
  maxPositiveAdjustment: number;
  maxNegativeAdjustment: number;
}

// ============================================================================
// Performance Thresholds by Year
// ============================================================================

/**
 * Get MIPS performance thresholds for a given year
 */
export function getPerformanceThresholds(year: number): PerformanceThresholds {
  const thresholds: Record<number, PerformanceThresholds> = {
    2024: {
      performanceYear: 2024,
      performanceThreshold: 75,
      exceptionalPerformanceThreshold: 89,
      maxPositiveAdjustment: 9.0,
      maxNegativeAdjustment: -9.0,
    },
    2025: {
      performanceYear: 2025,
      performanceThreshold: 75,
      exceptionalPerformanceThreshold: 90,
      maxPositiveAdjustment: 9.0,
      maxNegativeAdjustment: -9.0,
    },
    2026: {
      performanceYear: 2026,
      performanceThreshold: 75,
      exceptionalPerformanceThreshold: 90,
      maxPositiveAdjustment: 9.0,
      maxNegativeAdjustment: -9.0,
    },
  };

  return thresholds[year] || thresholds[2024];
}

// ============================================================================
// Category Weights
// ============================================================================

/**
 * Get category weights for performance year
 */
export function getCategoryWeights(
  performanceYear: number,
  isAPMParticipant: boolean = false,
): {
  quality: number;
  cost: number;
  ia: number;
  pi: number;
} {
  // Standard weights for 2024+
  if (isAPMParticipant) {
    // APM participants have reweighted categories
    return {
      quality: 0.55, // 55%
      cost: 0.0,     // 0% (waived for APM)
      ia: 0.15,      // 15%
      pi: 0.30,      // 30%
    };
  }

  return {
    quality: 0.30,  // 30%
    cost: 0.30,     // 30%
    ia: 0.15,       // 15%
    pi: 0.25,       // 25%
  };
}

// ============================================================================
// Final Score Calculation
// ============================================================================

/**
 * Calculate MIPS final score
 */
export function calculateMIPSFinalScore(
  performanceYear: number,
  qualityCategory: QualityCategory,
  costCategory: CostCategory,
  iaCategory: IACategory,
  piCategory: PICategory,
  options: {
    isSmallPractice?: boolean;
    isAPMParticipant?: boolean;
    complexPatientBonus?: number;
    clinicianNPI?: string;
    groupTIN?: string;
  } = {},
): MIPSFinalScore {
  const thresholds = getPerformanceThresholds(performanceYear);
  const weights = getCategoryWeights(performanceYear, options.isAPMParticipant);

  // Category scores (0-100)
  const qualityScore = qualityCategory.categoryScore;
  const costScore = costCategory.categoryScore;
  const iaScore = iaCategory.categoryScore;
  const piScore = piCategory.categoryScore;

  // Calculate weighted scores
  const qualityWeighted = qualityScore * weights.quality;
  const costWeighted = costScore * weights.cost;
  const iaWeighted = iaScore * weights.ia;
  const piWeighted = piScore * weights.pi;

  // Calculate base final score
  let finalScore = qualityWeighted + costWeighted + iaWeighted + piWeighted;

  // Apply bonuses
  const complexPatientBonus = options.complexPatientBonus || 0;
  const smallPracticeBonus = options.isSmallPractice ? 5 : 0;
  const totalBonus = complexPatientBonus + smallPracticeBonus;

  finalScore = Math.min(100, finalScore + totalBonus);

  // Determine threshold achievement
  const meetsPerformanceThreshold = finalScore >= thresholds.performanceThreshold;
  const achievesExceptionalPerformance = finalScore >= thresholds.exceptionalPerformanceThreshold;

  // Calculate payment adjustment
  const paymentAdjustment = calculatePaymentAdjustment(
    finalScore,
    thresholds,
  );

  return {
    performanceYear,
    clinicianNPI: options.clinicianNPI,
    groupTIN: options.groupTIN,

    qualityScore,
    costScore,
    iaScore,
    piScore,

    qualityWeight: weights.quality,
    costWeight: weights.cost,
    iaWeight: weights.ia,
    piWeight: weights.pi,

    qualityWeighted,
    costWeighted,
    iaWeighted,
    piWeighted,

    finalScore,

    paymentAdjustmentPercent: paymentAdjustment.percent,
    paymentAdjustmentDirection: paymentAdjustment.direction,

    performanceThreshold: thresholds.performanceThreshold,
    exceptionalPerformanceThreshold: thresholds.exceptionalPerformanceThreshold,
    meetsPerformanceThreshold,
    achievesExceptionalPerformance,

    complexPatientBonus,
    smallPracticeBonus,
    totalBonus,
  };
}

// ============================================================================
// Payment Adjustment Calculation
// ============================================================================

/**
 * Calculate payment adjustment based on final score
 */
function calculatePaymentAdjustment(
  finalScore: number,
  thresholds: PerformanceThresholds,
): {
  percent: number;
  direction: "positive" | "negative" | "neutral";
} {
  // Exceptional performance bonus
  if (finalScore >= thresholds.exceptionalPerformanceThreshold) {
    return {
      percent: thresholds.maxPositiveAdjustment,
      direction: "positive",
    };
  }

  // Above performance threshold - positive adjustment (scaled)
  if (finalScore >= thresholds.performanceThreshold) {
    const range = thresholds.exceptionalPerformanceThreshold - thresholds.performanceThreshold;
    const scoreAboveThreshold = finalScore - thresholds.performanceThreshold;
    const scaledAdjustment = (scoreAboveThreshold / range) * thresholds.maxPositiveAdjustment;

    return {
      percent: Math.min(scaledAdjustment, thresholds.maxPositiveAdjustment),
      direction: "positive",
    };
  }

  // Below performance threshold - negative adjustment (scaled)
  const range = thresholds.performanceThreshold;
  const percentBelow = (thresholds.performanceThreshold - finalScore) / range;
  const negativeAdjustment = percentBelow * Math.abs(thresholds.maxNegativeAdjustment);

  if (negativeAdjustment > 0) {
    return {
      percent: -Math.min(negativeAdjustment, Math.abs(thresholds.maxNegativeAdjustment)),
      direction: "negative",
    };
  }

  return {
    percent: 0,
    direction: "neutral",
  };
}

// ============================================================================
// Payment Impact Projection
// ============================================================================

/**
 * Project payment impact in dollars
 */
export function projectPaymentImpact(
  finalScore: MIPSFinalScore,
  estimatedMedicarePartBPayments: number,
): {
  adjustmentPercent: number;
  adjustmentDollars: number;
  projectedPayments: number;
  paymentYear: number;
} {
  const paymentYear = finalScore.performanceYear + 2; // 2-year lag
  const adjustmentDollars = estimatedMedicarePartBPayments * (finalScore.paymentAdjustmentPercent / 100);
  const projectedPayments = estimatedMedicarePartBPayments + adjustmentDollars;

  return {
    adjustmentPercent: finalScore.paymentAdjustmentPercent,
    adjustmentDollars,
    projectedPayments,
    paymentYear,
  };
}

// ============================================================================
// Complex Patient Bonus
// ============================================================================

/**
 * Calculate complex patient bonus
 * Based on HCC risk scores and dual-eligible beneficiaries
 */
export function calculateComplexPatientBonus(
  averageHCCRiskScore: number,
  dualEligiblePercent: number,
): number {
  // Bonus awarded if practice sees complex patients
  // Simplified calculation - CMS uses complex methodology

  let bonus = 0;

  // High-risk patient bonus (average HCC > 1.5)
  if (averageHCCRiskScore >= 2.0) {
    bonus += 5;
  } else if (averageHCCRiskScore >= 1.5) {
    bonus += 3;
  }

  // Dual-eligible bonus (> 25% dual eligible)
  if (dualEligiblePercent >= 50) {
    bonus += 3;
  } else if (dualEligiblePercent >= 25) {
    bonus += 2;
  }

  return Math.min(bonus, 5); // Cap at 5 points
}

// ============================================================================
// APM Performance Pathway
// ============================================================================

/**
 * Check eligibility for APM Performance Pathway (APP)
 */
export function checkAPPEligibility(
  participationLevel: "mips-apm" | "advanced-apm" | "other-apm" | "none",
  thresholdPercent: number,
): {
  eligible: boolean;
  pathway: string;
  benefit: string;
} {
  if (participationLevel === "advanced-apm" && thresholdPercent >= 75) {
    return {
      eligible: true,
      pathway: "Advanced APM",
      benefit: "5% bonus payment + MIPS exemption",
    };
  }

  if (participationLevel === "mips-apm" && thresholdPercent >= 50) {
    return {
      eligible: true,
      pathway: "MIPS APM",
      benefit: "APM scoring standard with favorable reweighting",
    };
  }

  return {
    eligible: false,
    pathway: "Traditional MIPS",
    benefit: "Standard MIPS scoring",
  };
}

// ============================================================================
// Score Insights and Recommendations
// ============================================================================

/**
 * Generate insights and recommendations for MIPS performance
 */
export function generateMIPSInsights(
  finalScore: MIPSFinalScore,
): {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  projectedOutcome: string;
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Overall assessment
  let summary: string;
  if (finalScore.achievesExceptionalPerformance) {
    summary = `Exceptional Performance! Final score of ${finalScore.finalScore.toFixed(1)} exceeds the exceptional performance threshold.`;
  } else if (finalScore.meetsPerformanceThreshold) {
    summary = `Good Performance. Final score of ${finalScore.finalScore.toFixed(1)} meets the performance threshold.`;
  } else {
    summary = `Below Threshold. Final score of ${finalScore.finalScore.toFixed(1)} is below the performance threshold.`;
  }

  // Category analysis
  const categories = [
    { name: "Quality", score: finalScore.qualityScore, weight: finalScore.qualityWeight },
    { name: "Cost", score: finalScore.costScore, weight: finalScore.costWeight },
    { name: "Improvement Activities", score: finalScore.iaScore, weight: finalScore.iaWeight },
    { name: "Promoting Interoperability", score: finalScore.piScore, weight: finalScore.piWeight },
  ];

  categories.forEach(cat => {
    if (cat.weight === 0) return; // Skip zero-weighted categories

    if (cat.score >= 90) {
      strengths.push(`${cat.name}: Excellent performance (${cat.score.toFixed(1)}%)`);
    } else if (cat.score >= 75) {
      strengths.push(`${cat.name}: Strong performance (${cat.score.toFixed(1)}%)`);
    } else if (cat.score >= 60) {
      opportunities.push(`${cat.name}: Moderate performance (${cat.score.toFixed(1)}%) - room for improvement`);
    } else {
      weaknesses.push(`${cat.name}: Below target (${cat.score.toFixed(1)}%)`);
      recommendations.push(`Focus on improving ${cat.name} category`);
    }
  });

  // Payment adjustment insights
  let projectedOutcome: string;
  if (finalScore.paymentAdjustmentDirection === "positive") {
    projectedOutcome = `Projected ${finalScore.paymentAdjustmentPercent.toFixed(2)}% positive payment adjustment in ${finalScore.performanceYear + 2}`;
  } else if (finalScore.paymentAdjustmentDirection === "negative") {
    projectedOutcome = `Projected ${Math.abs(finalScore.paymentAdjustmentPercent).toFixed(2)}% negative payment adjustment in ${finalScore.performanceYear + 2}`;
    recommendations.push("URGENT: Improve performance to avoid payment penalty");
  } else {
    projectedOutcome = "Neutral payment adjustment (no penalty or bonus)";
  }

  // Bonus opportunities
  if (finalScore.totalBonus > 0) {
    strengths.push(`Earned ${finalScore.totalBonus} bonus points`);
  } else {
    opportunities.push("No bonus points earned - check eligibility for small practice or complex patient bonuses");
  }

  // Threshold proximity
  if (!finalScore.meetsPerformanceThreshold) {
    const pointsNeeded = finalScore.performanceThreshold - finalScore.finalScore;
    recommendations.push(`Need ${pointsNeeded.toFixed(1)} more points to meet performance threshold`);
  } else if (!finalScore.achievesExceptionalPerformance) {
    const pointsToExceptional = finalScore.exceptionalPerformanceThreshold - finalScore.finalScore;
    opportunities.push(`${pointsToExceptional.toFixed(1)} points away from exceptional performance`);
  }

  return {
    summary,
    strengths,
    weaknesses,
    opportunities,
    recommendations,
    projectedOutcome,
  };
}

// ============================================================================
// Score Simulation
// ============================================================================

/**
 * Simulate impact of category improvements
 */
export function simulateScoreImpact(
  currentScore: MIPSFinalScore,
  categoryImprovements: {
    qualityIncrease?: number;
    costIncrease?: number;
    iaIncrease?: number;
    piIncrease?: number;
  },
): {
  newFinalScore: number;
  scoreDifference: number;
  newPaymentAdjustment: number;
  paymentAdjustmentDifference: number;
  crossedThreshold: boolean;
  achievedExceptional: boolean;
} {
  const newQualityScore = Math.min(100, currentScore.qualityScore + (categoryImprovements.qualityIncrease || 0));
  const newCostScore = Math.min(100, currentScore.costScore + (categoryImprovements.costIncrease || 0));
  const newIAScore = Math.min(100, currentScore.iaScore + (categoryImprovements.iaIncrease || 0));
  const newPIScore = Math.min(100, currentScore.piScore + (categoryImprovements.piIncrease || 0));

  const newFinalScore = Math.min(100,
    (newQualityScore * currentScore.qualityWeight) +
    (newCostScore * currentScore.costWeight) +
    (newIAScore * currentScore.iaWeight) +
    (newPIScore * currentScore.piWeight) +
    currentScore.totalBonus
  );

  const scoreDifference = newFinalScore - currentScore.finalScore;

  const thresholds = getPerformanceThresholds(currentScore.performanceYear);
  const newPaymentAdjustment = calculatePaymentAdjustment(newFinalScore, thresholds);

  const crossedThreshold = !currentScore.meetsPerformanceThreshold &&
    newFinalScore >= thresholds.performanceThreshold;

  const achievedExceptional = !currentScore.achievesExceptionalPerformance &&
    newFinalScore >= thresholds.exceptionalPerformanceThreshold;

  return {
    newFinalScore,
    scoreDifference,
    newPaymentAdjustment: newPaymentAdjustment.percent,
    paymentAdjustmentDifference: newPaymentAdjustment.percent - currentScore.paymentAdjustmentPercent,
    crossedThreshold,
    achievedExceptional,
  };
}

// ============================================================================
// Historical Comparison
// ============================================================================

/**
 * Compare performance across years
 */
export function comparePerformanceYears(
  currentYear: MIPSFinalScore,
  previousYear: MIPSFinalScore,
): {
  scoreTrend: "improving" | "declining" | "stable";
  scoreChange: number;
  categoryChanges: Record<string, number>;
  paymentImpactChange: number;
} {
  const scoreChange = currentYear.finalScore - previousYear.finalScore;

  let scoreTrend: "improving" | "declining" | "stable" = "stable";
  if (Math.abs(scoreChange) >= 5) {
    scoreTrend = scoreChange > 0 ? "improving" : "declining";
  }

  const categoryChanges = {
    quality: currentYear.qualityScore - previousYear.qualityScore,
    cost: currentYear.costScore - previousYear.costScore,
    ia: currentYear.iaScore - previousYear.iaScore,
    pi: currentYear.piScore - previousYear.piScore,
  };

  const paymentImpactChange = currentYear.paymentAdjustmentPercent - previousYear.paymentAdjustmentPercent;

  return {
    scoreTrend,
    scoreChange,
    categoryChanges,
    paymentImpactChange,
  };
}

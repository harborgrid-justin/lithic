/**
 * ACO Performance Tracker
 * Track quality measures, cost efficiency, and overall ACO performance
 */

export interface QualityMeasurePerformance {
  measureId: string;
  measureName: string;
  measureType: "process" | "outcome" | "patient-experience" | "efficiency";
  domain: string;
  numerator: number;
  denominator: number;
  rate: number;
  benchmark: number;
  percentile: number;
  points: number;
  maxPoints: number;
  metBenchmark: boolean;
  trend: "improving" | "declining" | "stable";
  yearOverYearChange: number;
}

export interface CostEfficiencyMetric {
  category: string;
  totalCost: number;
  pmpm: number;
  benchmarkPMPM: number;
  variance: number;
  variancePercent: number;
  trend: "improving" | "worsening" | "stable";
  topCostDrivers: Array<{
    driver: string;
    cost: number;
    percent: number;
  }>;
}

export interface UtilizationMetric {
  category: string;
  volume: number;
  ratePerThousand: number;
  benchmarkRate: number;
  variance: number;
  variancePercent: number;
}

export interface ACOPerformanceSnapshot {
  acoId: string;
  performanceYear: number;
  measurementPeriod: {
    start: Date;
    end: Date;
  };

  // Attribution metrics
  assignedBeneficiaries: number;
  attributionChanges: number;
  attributionStabilityRate: number;

  // Quality performance
  overallQualityScore: number;
  qualityMeasures: QualityMeasurePerformance[];
  qualityDomainScores: Record<string, number>;

  // Cost performance
  totalExpenditure: number;
  benchmark: number;
  savings: number;
  savingsRate: number;
  costEfficiency: CostEfficiencyMetric[];

  // Utilization
  utilization: UtilizationMetric[];

  // Risk adjustment
  averageRiskScore: number;
  riskScoreChange: number;

  // Financial outcome
  projectedPayment: number;
  finalPayment?: number;
}

// ============================================================================
// Quality Measure Tracking
// ============================================================================

/**
 * Calculate quality measure performance
 */
export function calculateQualityMeasurePerformance(
  measureId: string,
  measureName: string,
  measureType: QualityMeasurePerformance["measureType"],
  domain: string,
  numerator: number,
  denominator: number,
  benchmark: number,
  previousYearRate?: number,
): QualityMeasurePerformance {
  const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;
  const metBenchmark = rate >= benchmark;

  // Calculate percentile (simplified - would use actual national distribution)
  const percentile = calculatePercentileFromBenchmark(rate, benchmark);

  // Award points based on performance
  const maxPoints = 10; // CMS MSSP typically uses 10 points per measure
  const points = calculateMeasurePoints(rate, benchmark, maxPoints);

  // Determine trend
  let trend: "improving" | "declining" | "stable" = "stable";
  let yearOverYearChange = 0;

  if (previousYearRate !== undefined) {
    yearOverYearChange = rate - previousYearRate;
    if (Math.abs(yearOverYearChange) >= 2) {
      trend = yearOverYearChange > 0 ? "improving" : "declining";
    }
  }

  return {
    measureId,
    measureName,
    measureType,
    domain,
    numerator,
    denominator,
    rate,
    benchmark,
    percentile,
    points,
    maxPoints,
    metBenchmark,
    trend,
    yearOverYearChange,
  };
}

/**
 * Calculate points awarded for a measure
 */
function calculateMeasurePoints(
  rate: number,
  benchmark: number,
  maxPoints: number,
): number {
  // Sliding scale based on benchmark achievement
  if (rate >= benchmark + 20) return maxPoints; // Exceptional performance
  if (rate >= benchmark + 10) return maxPoints * 0.9;
  if (rate >= benchmark) return maxPoints * 0.8;
  if (rate >= benchmark - 10) return maxPoints * 0.6;
  if (rate >= benchmark - 20) return maxPoints * 0.4;
  return 0; // Below acceptable range
}

/**
 * Estimate percentile from benchmark (simplified)
 */
function calculatePercentileFromBenchmark(rate: number, benchmark: number): number {
  // Simplified: assume benchmark is 50th percentile
  const variance = rate - benchmark;
  const percentile = 50 + (variance * 2); // Rough estimate
  return Math.max(0, Math.min(100, percentile));
}

// ============================================================================
// Overall Quality Score Calculation
// ============================================================================

/**
 * Calculate overall quality score for ACO
 */
export function calculateOverallQualityScore(
  measures: QualityMeasurePerformance[],
): {
  overallScore: number;
  domainScores: Record<string, number>;
  totalPoints: number;
  maxTotalPoints: number;
} {
  if (measures.length === 0) {
    return {
      overallScore: 0,
      domainScores: {},
      totalPoints: 0,
      maxTotalPoints: 0,
    };
  }

  // Calculate domain scores
  const domainScores: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  measures.forEach(measure => {
    if (!domainScores[measure.domain]) {
      domainScores[measure.domain] = 0;
      domainCounts[measure.domain] = 0;
    }
    domainScores[measure.domain] += measure.rate;
    domainCounts[measure.domain] += 1;
  });

  // Average domain scores
  Object.keys(domainScores).forEach(domain => {
    domainScores[domain] = domainScores[domain] / domainCounts[domain];
  });

  // Calculate total points
  const totalPoints = measures.reduce((sum, m) => sum + m.points, 0);
  const maxTotalPoints = measures.reduce((sum, m) => sum + m.maxPoints, 0);

  // Overall score as percentage of possible points
  const overallScore = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints) * 100 : 0;

  return {
    overallScore,
    domainScores,
    totalPoints,
    maxTotalPoints,
  };
}

// ============================================================================
// Cost Efficiency Tracking
// ============================================================================

/**
 * Calculate cost efficiency by category
 */
export function calculateCostEfficiency(
  category: string,
  totalCost: number,
  memberMonths: number,
  benchmarkPMPM: number,
  costDetails: Array<{ driver: string; cost: number }>,
  previousPMPM?: number,
): CostEfficiencyMetric {
  const pmpm = memberMonths > 0 ? totalCost / memberMonths : 0;
  const variance = pmpm - benchmarkPMPM;
  const variancePercent = benchmarkPMPM > 0 ? (variance / benchmarkPMPM) * 100 : 0;

  // Determine trend
  let trend: "improving" | "worsening" | "stable" = "stable";
  if (previousPMPM !== undefined) {
    const change = pmpm - previousPMPM;
    if (Math.abs(change) >= benchmarkPMPM * 0.05) {
      trend = change < 0 ? "improving" : "worsening";
    }
  }

  // Calculate top cost drivers
  const sortedDrivers = [...costDetails].sort((a, b) => b.cost - a.cost);
  const topCostDrivers = sortedDrivers.slice(0, 5).map(driver => ({
    driver: driver.driver,
    cost: driver.cost,
    percent: totalCost > 0 ? (driver.cost / totalCost) * 100 : 0,
  }));

  return {
    category,
    totalCost,
    pmpm,
    benchmarkPMPM,
    variance,
    variancePercent,
    trend,
    topCostDrivers,
  };
}

// ============================================================================
// Utilization Tracking
// ============================================================================

/**
 * Calculate utilization metrics
 */
export function calculateUtilization(
  category: string,
  volume: number,
  assignedBeneficiaries: number,
  benchmarkRate: number,
): UtilizationMetric {
  const ratePerThousand = assignedBeneficiaries > 0
    ? (volume / assignedBeneficiaries) * 1000
    : 0;

  const variance = ratePerThousand - benchmarkRate;
  const variancePercent = benchmarkRate > 0 ? (variance / benchmarkRate) * 100 : 0;

  return {
    category,
    volume,
    ratePerThousand,
    benchmarkRate,
    variance,
    variancePercent,
  };
}

// ============================================================================
// Performance Dashboard Metrics
// ============================================================================

/**
 * Generate comprehensive ACO performance snapshot
 */
export function generatePerformanceSnapshot(
  acoId: string,
  performanceYear: number,
  measurementStart: Date,
  measurementEnd: Date,
  qualityMeasures: QualityMeasurePerformance[],
  costMetrics: CostEfficiencyMetric[],
  utilizationMetrics: UtilizationMetric[],
  financialData: {
    totalExpenditure: number;
    benchmark: number;
    assignedBeneficiaries: number;
    attributionChanges: number;
    averageRiskScore: number;
    previousRiskScore: number;
    projectedPayment: number;
    finalPayment?: number;
  },
): ACOPerformanceSnapshot {
  const qualityScoreData = calculateOverallQualityScore(qualityMeasures);

  const savings = financialData.benchmark - financialData.totalExpenditure;
  const savingsRate = financialData.benchmark > 0
    ? (savings / financialData.benchmark) * 100
    : 0;

  const attributionStabilityRate = financialData.assignedBeneficiaries > 0
    ? ((financialData.assignedBeneficiaries - financialData.attributionChanges) /
       financialData.assignedBeneficiaries) * 100
    : 0;

  const riskScoreChange = financialData.averageRiskScore - financialData.previousRiskScore;

  return {
    acoId,
    performanceYear,
    measurementPeriod: {
      start: measurementStart,
      end: measurementEnd,
    },
    assignedBeneficiaries: financialData.assignedBeneficiaries,
    attributionChanges: financialData.attributionChanges,
    attributionStabilityRate,
    overallQualityScore: qualityScoreData.overallScore,
    qualityMeasures,
    qualityDomainScores: qualityScoreData.domainScores,
    totalExpenditure: financialData.totalExpenditure,
    benchmark: financialData.benchmark,
    savings,
    savingsRate,
    costEfficiency: costMetrics,
    utilization: utilizationMetrics,
    averageRiskScore: financialData.averageRiskScore,
    riskScoreChange,
    projectedPayment: financialData.projectedPayment,
    finalPayment: financialData.finalPayment,
  };
}

// ============================================================================
// Performance Alerts
// ============================================================================

export interface PerformanceAlert {
  severity: "critical" | "warning" | "info";
  category: "quality" | "cost" | "utilization" | "attribution";
  message: string;
  impact: string;
  recommendation: string;
}

/**
 * Generate performance alerts based on snapshot
 */
export function generatePerformanceAlerts(
  snapshot: ACOPerformanceSnapshot,
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  // Quality alerts
  if (snapshot.overallQualityScore < 60) {
    alerts.push({
      severity: "critical",
      category: "quality",
      message: `Overall quality score (${snapshot.overallQualityScore.toFixed(1)}%) is below 60%`,
      impact: "Quality multiplier will be 0.85 or lower, reducing shared savings",
      recommendation: "Focus on improving underperforming quality measures",
    });
  }

  // Cost alerts
  if (snapshot.savingsRate < 0) {
    alerts.push({
      severity: "critical",
      category: "cost",
      message: `ACO is experiencing losses (${Math.abs(snapshot.savingsRate).toFixed(1)}% above benchmark)`,
      impact: "May owe shared losses in two-sided models",
      recommendation: "Review high-cost patients and implement cost reduction strategies",
    });
  }

  // Utilization alerts
  snapshot.utilization.forEach(util => {
    if (util.variancePercent > 20 && util.category.includes("admission")) {
      alerts.push({
        severity: "warning",
        category: "utilization",
        message: `${util.category} is ${util.variancePercent.toFixed(1)}% above benchmark`,
        impact: "Driving excess costs",
        recommendation: "Implement care management programs to reduce avoidable admissions",
      });
    }
  });

  // Attribution alerts
  if (snapshot.attributionStabilityRate < 80) {
    alerts.push({
      severity: "warning",
      category: "attribution",
      message: `Attribution stability is ${snapshot.attributionStabilityRate.toFixed(1)}%`,
      impact: "High patient churn may affect performance consistency",
      recommendation: "Strengthen patient engagement and primary care relationships",
    });
  }

  // Risk score alerts
  if (Math.abs(snapshot.riskScoreChange) > 0.1) {
    const direction = snapshot.riskScoreChange > 0 ? "increased" : "decreased";
    alerts.push({
      severity: "info",
      category: "attribution",
      message: `Average risk score ${direction} by ${Math.abs(snapshot.riskScoreChange).toFixed(2)}`,
      impact: direction === "increased" ? "May benefit from higher benchmark" : "Benchmark may be adjusted lower",
      recommendation: "Ensure accurate documentation and coding of patient conditions",
    });
  }

  return alerts;
}

// ============================================================================
// Peer Comparison
// ============================================================================

/**
 * Compare ACO performance to peer benchmarks
 */
export function compareToPeers(
  acoSnapshot: ACOPerformanceSnapshot,
  peerSnapshots: ACOPerformanceSnapshot[],
): {
  qualityPercentile: number;
  costPercentile: number;
  overallPercentile: number;
  betterThanPeers: number;
  worseThanPeers: number;
} {
  if (peerSnapshots.length === 0) {
    return {
      qualityPercentile: 50,
      costPercentile: 50,
      overallPercentile: 50,
      betterThanPeers: 0,
      worseThanPeers: 0,
    };
  }

  // Calculate percentiles
  const qualityScores = peerSnapshots.map(p => p.overallQualityScore).sort((a, b) => a - b);
  const savingsRates = peerSnapshots.map(p => p.savingsRate).sort((a, b) => a - b);

  const qualityPercentile = calculatePercentile(qualityScores, acoSnapshot.overallQualityScore);
  const costPercentile = calculatePercentile(savingsRates, acoSnapshot.savingsRate);
  const overallPercentile = (qualityPercentile + costPercentile) / 2;

  // Count better/worse performers
  const betterThanPeers = peerSnapshots.filter(p =>
    p.overallQualityScore < acoSnapshot.overallQualityScore &&
    p.savingsRate < acoSnapshot.savingsRate
  ).length;

  const worseThanPeers = peerSnapshots.filter(p =>
    p.overallQualityScore > acoSnapshot.overallQualityScore &&
    p.savingsRate > acoSnapshot.savingsRate
  ).length;

  return {
    qualityPercentile,
    costPercentile,
    overallPercentile,
    betterThanPeers,
    worseThanPeers,
  };
}

/**
 * Calculate percentile rank
 */
function calculatePercentile(sortedValues: number[], value: number): number {
  const rank = sortedValues.filter(v => v <= value).length;
  return (rank / sortedValues.length) * 100;
}

/**
 * ACO Shared Savings/Losses Calculator
 * Calculates financial performance for MSSP, ACO REACH, and other value-based models
 */

export type SavedShareModel = "one-sided" | "two-sided" | "reach-professional" | "reach-global";
export type PerformanceYear = number;

export interface BenchmarkData {
  year: PerformanceYear;
  totalBenchmark: number;
  trendFactor: number;
  regionalAdjustment: number;
  newEnrolleeAdjustment: number;
  historicalBenchmark: number;
}

export interface PerformanceMetrics {
  totalExpenditure: number;
  assignedBeneficiaries: number;
  perCapitaExpenditure: number;
  qualityScore: number;
  minimumSavingsRate: number;
  minLossRate?: number;
}

export interface SharedSavingsResult {
  model: SavedShareModel;
  performanceYear: PerformanceYear;
  benchmark: number;
  actualExpenditure: number;
  grossSavings: number;
  grossLosses: number;
  netSavings: number;
  qualityScore: number;
  qualityMultiplier: number;
  earnedSavings: number;
  owedLosses: number;
  sharingRate: number;
  meetsMinimumSavingsRate: boolean;
  meetsMinimumLossRate: boolean;
  finalPayment: number;
  updatedBenchmark: number;
}

// ============================================================================
// Benchmark Calculation
// ============================================================================

/**
 * Calculate ACO benchmark with trend factors and adjustments
 */
export function calculateBenchmark(
  historicalExpenditure: number[],
  trendFactor: number,
  regionalAdjustment: number = 0,
  newEnrolleeAdjustment: number = 0,
): BenchmarkData {
  // Calculate 3-year historical average (typical MSSP approach)
  const historicalBenchmark = historicalExpenditure.reduce((a, b) => a + b, 0) / historicalExpenditure.length;

  // Apply trend factor
  const trendedBenchmark = historicalBenchmark * (1 + trendFactor);

  // Apply regional adjustment
  const regionallyAdjusted = trendedBenchmark * (1 + regionalAdjustment);

  // Apply new enrollee adjustment
  const totalBenchmark = regionallyAdjusted + newEnrolleeAdjustment;

  return {
    year: new Date().getFullYear(),
    totalBenchmark,
    trendFactor,
    regionalAdjustment,
    newEnrolleeAdjustment,
    historicalBenchmark,
  };
}

/**
 * Update benchmark for subsequent years with capping
 */
export function updateBenchmark(
  previousBenchmark: number,
  nationalTrendRate: number,
  performanceYearExpenditure: number,
  capPercentage: number = 0.5,
): number {
  // Blend performance year expenditure with national trend
  const blendedUpdate =
    (performanceYearExpenditure * capPercentage) +
    (previousBenchmark * (1 + nationalTrendRate) * (1 - capPercentage));

  return blendedUpdate;
}

// ============================================================================
// Shared Savings Calculation (One-Sided Model)
// ============================================================================

/**
 * Calculate shared savings for one-sided risk model (Track 1 MSSP)
 */
export function calculateOneSidedSavings(
  benchmark: BenchmarkData,
  performance: PerformanceMetrics,
): SharedSavingsResult {
  const grossSavings = Math.max(0, benchmark.totalBenchmark - performance.totalExpenditure);
  const savingsRate = benchmark.totalBenchmark > 0
    ? (grossSavings / benchmark.totalBenchmark) * 100
    : 0;

  const meetsMinimumSavingsRate = savingsRate >= performance.minimumSavingsRate;

  // Quality multiplier (0.4 to 1.0 based on quality score)
  const qualityMultiplier = calculateQualityMultiplier(performance.qualityScore);

  // Sharing rate for one-sided: up to 50%
  const sharingRate = 0.50;

  // Calculate earned savings
  let earnedSavings = 0;
  if (meetsMinimumSavingsRate) {
    earnedSavings = grossSavings * sharingRate * qualityMultiplier;
  }

  return {
    model: "one-sided",
    performanceYear: benchmark.year,
    benchmark: benchmark.totalBenchmark,
    actualExpenditure: performance.totalExpenditure,
    grossSavings,
    grossLosses: 0,
    netSavings: grossSavings,
    qualityScore: performance.qualityScore,
    qualityMultiplier,
    earnedSavings,
    owedLosses: 0,
    sharingRate,
    meetsMinimumSavingsRate,
    meetsMinimumLossRate: true,
    finalPayment: earnedSavings,
    updatedBenchmark: updateBenchmark(
      benchmark.totalBenchmark,
      benchmark.trendFactor,
      performance.totalExpenditure,
    ),
  };
}

// ============================================================================
// Shared Savings/Losses Calculation (Two-Sided Model)
// ============================================================================

/**
 * Calculate shared savings/losses for two-sided risk model (Track 2/3 MSSP)
 */
export function calculateTwoSidedSavings(
  benchmark: BenchmarkData,
  performance: PerformanceMetrics,
  sharingRate: number = 0.60,
  lossRate: number = 0.60,
): SharedSavingsResult {
  const difference = benchmark.totalBenchmark - performance.totalExpenditure;

  const grossSavings = Math.max(0, difference);
  const grossLosses = Math.max(0, -difference);

  const savingsRate = benchmark.totalBenchmark > 0
    ? (grossSavings / benchmark.totalBenchmark) * 100
    : 0;

  const lossRatePercent = benchmark.totalBenchmark > 0
    ? (grossLosses / benchmark.totalBenchmark) * 100
    : 0;

  const meetsMinimumSavingsRate = savingsRate >= performance.minimumSavingsRate;
  const meetsMinimumLossRate = lossRatePercent >= (performance.minLossRate || 0);

  const qualityMultiplier = calculateQualityMultiplier(performance.qualityScore);

  let earnedSavings = 0;
  let owedLosses = 0;

  // Calculate shared savings
  if (meetsMinimumSavingsRate) {
    earnedSavings = grossSavings * sharingRate * qualityMultiplier;
  }

  // Calculate shared losses
  if (meetsMinimumLossRate) {
    owedLosses = grossLosses * lossRate;
  }

  const finalPayment = earnedSavings - owedLosses;

  return {
    model: "two-sided",
    performanceYear: benchmark.year,
    benchmark: benchmark.totalBenchmark,
    actualExpenditure: performance.totalExpenditure,
    grossSavings,
    grossLosses,
    netSavings: difference,
    qualityScore: performance.qualityScore,
    qualityMultiplier,
    earnedSavings,
    owedLosses,
    sharingRate,
    meetsMinimumSavingsRate,
    meetsMinimumLossRate,
    finalPayment,
    updatedBenchmark: updateBenchmark(
      benchmark.totalBenchmark,
      benchmark.trendFactor,
      performance.totalExpenditure,
    ),
  };
}

// ============================================================================
// ACO REACH Model Calculation
// ============================================================================

/**
 * Calculate payments for ACO REACH Professional model
 */
export function calculateReachProfessional(
  benchmark: BenchmarkData,
  performance: PerformanceMetrics,
  primaryCareCapitation: number = 0,
): SharedSavingsResult {
  const difference = benchmark.totalBenchmark - performance.totalExpenditure;

  const grossSavings = Math.max(0, difference);
  const grossLosses = Math.max(0, -difference);

  // REACH Professional: 50% savings / 50% losses
  const sharingRate = 0.50;
  const lossRate = 0.50;

  const qualityMultiplier = calculateQualityMultiplier(performance.qualityScore);

  // Calculate shared savings
  const earnedSavings = grossSavings * sharingRate * qualityMultiplier;

  // Calculate shared losses
  const owedLosses = grossLosses * lossRate;

  // Include primary care capitation payments
  const finalPayment = earnedSavings - owedLosses + primaryCareCapitation;

  return {
    model: "reach-professional",
    performanceYear: benchmark.year,
    benchmark: benchmark.totalBenchmark,
    actualExpenditure: performance.totalExpenditure,
    grossSavings,
    grossLosses,
    netSavings: difference,
    qualityScore: performance.qualityScore,
    qualityMultiplier,
    earnedSavings,
    owedLosses,
    sharingRate,
    meetsMinimumSavingsRate: true, // No MSR in REACH
    meetsMinimumLossRate: true, // No MLR in REACH
    finalPayment,
    updatedBenchmark: updateBenchmark(
      benchmark.totalBenchmark,
      benchmark.trendFactor,
      performance.totalExpenditure,
      0.5, // REACH uses 50% capping
    ),
  };
}

/**
 * Calculate payments for ACO REACH Global model
 */
export function calculateReachGlobal(
  benchmark: BenchmarkData,
  performance: PerformanceMetrics,
  primaryCareCapitation: number = 0,
  specialtyCapitation: number = 0,
): SharedSavingsResult {
  const difference = benchmark.totalBenchmark - performance.totalExpenditure;

  const grossSavings = Math.max(0, difference);
  const grossLosses = Math.max(0, -difference);

  // REACH Global: 100% savings / 100% losses (full risk)
  const sharingRate = 1.0;
  const lossRate = 1.0;

  const qualityMultiplier = calculateQualityMultiplier(performance.qualityScore);

  // Calculate shared savings
  const earnedSavings = grossSavings * sharingRate * qualityMultiplier;

  // Calculate shared losses
  const owedLosses = grossLosses * lossRate;

  // Include capitation payments
  const totalCapitation = primaryCareCapitation + specialtyCapitation;
  const finalPayment = earnedSavings - owedLosses + totalCapitation;

  return {
    model: "reach-global",
    performanceYear: benchmark.year,
    benchmark: benchmark.totalBenchmark,
    actualExpenditure: performance.totalExpenditure,
    grossSavings,
    grossLosses,
    netSavings: difference,
    qualityScore: performance.qualityScore,
    qualityMultiplier,
    earnedSavings,
    owedLosses,
    sharingRate,
    meetsMinimumSavingsRate: true,
    meetsMinimumLossRate: true,
    finalPayment,
    updatedBenchmark: updateBenchmark(
      benchmark.totalBenchmark,
      benchmark.trendFactor,
      performance.totalExpenditure,
      0.5,
    ),
  };
}

// ============================================================================
// Quality Performance Calculation
// ============================================================================

/**
 * Calculate quality multiplier based on quality score
 * CMS MSSP quality scoring:
 * - < 30%: 0.4x multiplier
 * - 30-60%: 0.7x multiplier
 * - 60-80%: 0.85x multiplier
 * - 80-90%: 0.95x multiplier
 * - >= 90%: 1.0x multiplier
 */
export function calculateQualityMultiplier(qualityScore: number): number {
  if (qualityScore >= 90) return 1.0;
  if (qualityScore >= 80) return 0.95;
  if (qualityScore >= 60) return 0.85;
  if (qualityScore >= 30) return 0.7;
  return 0.4;
}

// ============================================================================
// Minimum Savings/Loss Rate Calculation
// ============================================================================

/**
 * Calculate minimum savings rate based on beneficiary count
 * CMS MSSP formula varies by ACO size
 */
export function calculateMinimumSavingsRate(assignedBeneficiaries: number): number {
  if (assignedBeneficiaries >= 60000) return 2.0;
  if (assignedBeneficiaries >= 20000) return 2.5;
  if (assignedBeneficiaries >= 10000) return 3.0;
  if (assignedBeneficiaries >= 5000) return 3.5;
  return 3.9;
}

/**
 * Calculate minimum loss rate based on beneficiary count (two-sided models)
 */
export function calculateMinimumLossRate(assignedBeneficiaries: number): number {
  // Typically mirrors MSR in two-sided models
  return calculateMinimumSavingsRate(assignedBeneficiaries);
}

// ============================================================================
// Performance Projections
// ============================================================================

/**
 * Project shared savings based on current trends
 */
export function projectSharedSavings(
  currentPerformance: PerformanceMetrics,
  benchmark: BenchmarkData,
  projectionMonths: number,
  model: SavedShareModel = "two-sided",
): {
  projectedSavings: number;
  projectedLosses: number;
  projectedPayment: number;
  confidenceInterval: { low: number; high: number };
} {
  const monthsInYear = 12;
  const projectionFactor = projectionMonths / monthsInYear;

  // Annualize current performance
  const projectedExpenditure = currentPerformance.totalExpenditure / projectionFactor;

  const projectedPerformance: PerformanceMetrics = {
    ...currentPerformance,
    totalExpenditure: projectedExpenditure,
  };

  let result: SharedSavingsResult;

  switch (model) {
    case "one-sided":
      result = calculateOneSidedSavings(benchmark, projectedPerformance);
      break;
    case "two-sided":
      result = calculateTwoSidedSavings(benchmark, projectedPerformance);
      break;
    case "reach-professional":
      result = calculateReachProfessional(benchmark, projectedPerformance);
      break;
    case "reach-global":
      result = calculateReachGlobal(benchmark, projectedPerformance);
      break;
    default:
      result = calculateTwoSidedSavings(benchmark, projectedPerformance);
  }

  // Calculate 95% confidence interval (simplified)
  const variance = Math.abs(result.finalPayment) * 0.15; // Assume 15% variance
  const confidenceInterval = {
    low: result.finalPayment - variance,
    high: result.finalPayment + variance,
  };

  return {
    projectedSavings: result.earnedSavings,
    projectedLosses: result.owedLosses,
    projectedPayment: result.finalPayment,
    confidenceInterval,
  };
}

// ============================================================================
// Per-Member-Per-Month (PMPM) Calculations
// ============================================================================

/**
 * Calculate PMPM costs for trending
 */
export function calculatePMPM(
  totalExpenditure: number,
  memberMonths: number,
): number {
  if (memberMonths === 0) return 0;
  return totalExpenditure / memberMonths;
}

/**
 * Calculate PMPM savings
 */
export function calculatePMPMSavings(
  benchmarkPMPM: number,
  actualPMPM: number,
): number {
  return benchmarkPMPM - actualPMPM;
}

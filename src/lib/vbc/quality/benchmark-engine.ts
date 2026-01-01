/**
 * Benchmark Engine
 * Compare performance against peer groups, national benchmarks, and historical trends
 */

export type BenchmarkType = "national" | "regional" | "peer-group" | "specialty" | "historical";
export type BenchmarkSource = "cms" | "ncqa" | "leapfrog" | "internal" | "custom";

export interface Benchmark {
  benchmarkId: string;
  benchmarkName: string;
  benchmarkType: BenchmarkType;
  source: BenchmarkSource;

  // Values
  value: number;
  percentile10?: number;
  percentile25?: number;
  percentile50?: number;
  percentile75?: number;
  percentile90?: number;

  // Context
  measureId: string;
  measureName: string;
  year: number;
  sampleSize?: number;

  // Metadata
  geography?: string;
  specialty?: string;
  organizationType?: string;
}

export interface PerformanceComparison {
  measureId: string;
  measureName: string;
  actualValue: number;

  benchmarks: {
    national?: Benchmark;
    regional?: Benchmark;
    peerGroup?: Benchmark;
    historical?: Benchmark;
  };

  // Performance analysis
  nationalPercentile?: number;
  regionalPercentile?: number;
  peerPercentile?: number;

  // Variance
  varianceFromNational?: number;
  varianceFromPeer?: number;
  yearOverYearChange?: number;

  // Ratings
  performanceRating: "excellent" | "good" | "fair" | "poor";
  trend: "improving" | "stable" | "declining";
}

export interface BenchmarkReport {
  reportDate: Date;
  organization: string;
  measures: PerformanceComparison[];

  summary: {
    totalMeasures: number;
    abovePeerAverage: number;
    belowPeerAverage: number;
    excellentPerformance: number;
    needsImprovement: number;
  };

  insights: {
    strengths: string[];
    opportunities: string[];
    recommendations: string[];
  };
}

// ============================================================================
// Benchmark Database (Simplified)
// ============================================================================

/**
 * Get national benchmark for measure
 */
export function getNationalBenchmark(
  measureId: string,
  year: number = new Date().getFullYear(),
): Benchmark | undefined {
  const benchmarks: Record<string, Partial<Benchmark>> = {
    // MIPS Quality Measures
    "001": {
      measureId: "001",
      measureName: "Diabetes HbA1c Poor Control",
      percentile10: 15.0,
      percentile25: 20.0,
      percentile50: 25.0,
      percentile75: 32.0,
      percentile90: 40.0,
      value: 25.0,
    },

    "236": {
      measureId: "236",
      measureName: "Controlling High Blood Pressure",
      percentile10: 45.0,
      percentile25: 55.0,
      percentile50: 63.0,
      percentile75: 70.0,
      percentile90: 78.0,
      value: 63.0,
    },

    // HEDIS Measures
    "CDC-H": {
      measureId: "CDC-H",
      measureName: "Comprehensive Diabetes Care - HbA1c Testing",
      percentile10: 80.0,
      percentile25: 85.0,
      percentile50: 88.0,
      percentile75: 92.5,
      percentile90: 95.0,
      value: 88.0,
    },

    "BCS": {
      measureId: "BCS",
      measureName: "Breast Cancer Screening",
      percentile10: 62.0,
      percentile25: 68.0,
      percentile50: 72.0,
      percentile75: 77.0,
      percentile90: 81.0,
      value: 72.0,
    },

    "COL": {
      measureId: "COL",
      measureName: "Colorectal Cancer Screening",
      percentile10: 57.0,
      percentile25: 63.0,
      percentile50: 67.0,
      percentile75: 73.0,
      percentile90: 78.0,
      value: 67.0,
    },
  };

  const benchmarkData = benchmarks[measureId];
  if (!benchmarkData) return undefined;

  return {
    benchmarkId: `NAT-${measureId}-${year}`,
    benchmarkName: "National Benchmark",
    benchmarkType: "national",
    source: "cms",
    measureId,
    measureName: benchmarkData.measureName || "",
    year,
    value: benchmarkData.value || 0,
    percentile10: benchmarkData.percentile10,
    percentile25: benchmarkData.percentile25,
    percentile50: benchmarkData.percentile50,
    percentile75: benchmarkData.percentile75,
    percentile90: benchmarkData.percentile90,
    sampleSize: 100000,
  };
}

/**
 * Get regional benchmark for measure
 */
export function getRegionalBenchmark(
  measureId: string,
  region: string,
  year: number = new Date().getFullYear(),
): Benchmark | undefined {
  // Simplified - would query regional database
  const nationalBenchmark = getNationalBenchmark(measureId, year);
  if (!nationalBenchmark) return undefined;

  // Apply regional variation (simplified)
  const regionalVariations: Record<string, number> = {
    "northeast": 1.05,
    "southeast": 0.95,
    "midwest": 1.0,
    "southwest": 0.98,
    "west": 1.03,
  };

  const variation = regionalVariations[region.toLowerCase()] || 1.0;

  return {
    ...nationalBenchmark,
    benchmarkId: `REG-${region}-${measureId}-${year}`,
    benchmarkName: `${region} Regional Benchmark`,
    benchmarkType: "regional",
    value: nationalBenchmark.value * variation,
    percentile50: nationalBenchmark.percentile50
      ? nationalBenchmark.percentile50 * variation
      : undefined,
    geography: region,
  };
}

/**
 * Get peer group benchmark
 */
export function getPeerGroupBenchmark(
  measureId: string,
  organizationType: string,
  specialty?: string,
  year: number = new Date().getFullYear(),
): Benchmark | undefined {
  const nationalBenchmark = getNationalBenchmark(measureId, year);
  if (!nationalBenchmark) return undefined;

  // Peer group adjustments (simplified)
  let peerAdjustment = 1.0;

  if (organizationType === "academic-medical-center") peerAdjustment = 1.08;
  else if (organizationType === "community-hospital") peerAdjustment = 0.98;
  else if (organizationType === "large-group-practice") peerAdjustment = 1.05;
  else if (organizationType === "small-practice") peerAdjustment = 0.95;

  return {
    ...nationalBenchmark,
    benchmarkId: `PEER-${organizationType}-${measureId}-${year}`,
    benchmarkName: `${organizationType} Peer Group`,
    benchmarkType: "peer-group",
    value: nationalBenchmark.value * peerAdjustment,
    organizationType,
    specialty,
  };
}

// ============================================================================
// Performance Comparison
// ============================================================================

/**
 * Compare performance to benchmarks
 */
export function comparePerformance(
  measureId: string,
  measureName: string,
  actualValue: number,
  options: {
    includeNational?: boolean;
    includeRegional?: boolean;
    region?: string;
    includePeer?: boolean;
    organizationType?: string;
    specialty?: string;
    includeHistorical?: boolean;
    historicalValue?: number;
    year?: number;
  } = {},
): PerformanceComparison {
  const year = options.year || new Date().getFullYear();

  const benchmarks: PerformanceComparison["benchmarks"] = {};

  // National benchmark
  if (options.includeNational !== false) {
    benchmarks.national = getNationalBenchmark(measureId, year);
  }

  // Regional benchmark
  if (options.includeRegional && options.region) {
    benchmarks.regional = getRegionalBenchmark(measureId, options.region, year);
  }

  // Peer group benchmark
  if (options.includePeer && options.organizationType) {
    benchmarks.peerGroup = getPeerGroupBenchmark(
      measureId,
      options.organizationType,
      options.specialty,
      year,
    );
  }

  // Historical benchmark
  if (options.includeHistorical && options.historicalValue !== undefined) {
    benchmarks.historical = {
      benchmarkId: `HIST-${measureId}-${year - 1}`,
      benchmarkName: "Historical Performance",
      benchmarkType: "historical",
      source: "internal",
      measureId,
      measureName,
      year: year - 1,
      value: options.historicalValue,
    };
  }

  // Calculate percentiles
  const nationalPercentile = benchmarks.national
    ? calculatePercentileRank(actualValue, benchmarks.national)
    : undefined;

  const regionalPercentile = benchmarks.regional
    ? calculatePercentileRank(actualValue, benchmarks.regional)
    : undefined;

  const peerPercentile = benchmarks.peerGroup
    ? calculatePercentileRank(actualValue, benchmarks.peerGroup)
    : undefined;

  // Calculate variance
  const varianceFromNational = benchmarks.national
    ? actualValue - benchmarks.national.value
    : undefined;

  const varianceFromPeer = benchmarks.peerGroup
    ? actualValue - benchmarks.peerGroup.value
    : undefined;

  const yearOverYearChange = benchmarks.historical
    ? actualValue - benchmarks.historical.value
    : undefined;

  // Determine performance rating
  const performanceRating = determinePerformanceRating(
    actualValue,
    benchmarks.national || benchmarks.peerGroup,
  );

  // Determine trend
  const trend = determineTrend(yearOverYearChange);

  return {
    measureId,
    measureName,
    actualValue,
    benchmarks,
    nationalPercentile,
    regionalPercentile,
    peerPercentile,
    varianceFromNational,
    varianceFromPeer,
    yearOverYearChange,
    performanceRating,
    trend,
  };
}

/**
 * Calculate percentile rank
 */
function calculatePercentileRank(value: number, benchmark: Benchmark): number {
  if (!benchmark.percentile10 || !benchmark.percentile90) {
    // Simple comparison to median
    if (value >= benchmark.value) return 50;
    return 25;
  }

  if (value >= (benchmark.percentile90 || 0)) return 95;
  if (value >= (benchmark.percentile75 || 0)) return 80;
  if (value >= (benchmark.percentile50 || 0)) return 60;
  if (value >= (benchmark.percentile25 || 0)) return 35;
  if (value >= (benchmark.percentile10 || 0)) return 15;
  return 5;
}

/**
 * Determine performance rating
 */
function determinePerformanceRating(
  value: number,
  benchmark?: Benchmark,
): "excellent" | "good" | "fair" | "poor" {
  if (!benchmark) return "fair";

  if (value >= (benchmark.percentile90 || 0)) return "excellent";
  if (value >= (benchmark.percentile75 || 0)) return "good";
  if (value >= (benchmark.percentile50 || 0)) return "fair";
  return "poor";
}

/**
 * Determine trend
 */
function determineTrend(
  yearOverYearChange?: number,
): "improving" | "stable" | "declining" {
  if (yearOverYearChange === undefined) return "stable";

  if (Math.abs(yearOverYearChange) < 2) return "stable";
  return yearOverYearChange > 0 ? "improving" : "declining";
}

// ============================================================================
// Benchmark Report Generation
// ============================================================================

/**
 * Generate comprehensive benchmark report
 */
export function generateBenchmarkReport(
  organization: string,
  measures: Array<{
    measureId: string;
    measureName: string;
    actualValue: number;
    historicalValue?: number;
  }>,
  options: {
    region?: string;
    organizationType?: string;
    specialty?: string;
    year?: number;
  } = {},
): BenchmarkReport {
  const comparisons = measures.map(measure =>
    comparePerformance(measure.measureId, measure.measureName, measure.actualValue, {
      includeNational: true,
      includeRegional: !!options.region,
      region: options.region,
      includePeer: !!options.organizationType,
      organizationType: options.organizationType,
      specialty: options.specialty,
      includeHistorical: measure.historicalValue !== undefined,
      historicalValue: measure.historicalValue,
      year: options.year,
    })
  );

  // Calculate summary statistics
  const totalMeasures = comparisons.length;

  const abovePeerAverage = comparisons.filter(c =>
    c.benchmarks.peerGroup && c.actualValue > c.benchmarks.peerGroup.value
  ).length;

  const belowPeerAverage = comparisons.filter(c =>
    c.benchmarks.peerGroup && c.actualValue < c.benchmarks.peerGroup.value
  ).length;

  const excellentPerformance = comparisons.filter(c =>
    c.performanceRating === "excellent"
  ).length;

  const needsImprovement = comparisons.filter(c =>
    c.performanceRating === "poor"
  ).length;

  // Generate insights
  const insights = generateBenchmarkInsights(comparisons);

  return {
    reportDate: new Date(),
    organization,
    measures: comparisons,
    summary: {
      totalMeasures,
      abovePeerAverage,
      belowPeerAverage,
      excellentPerformance,
      needsImprovement,
    },
    insights,
  };
}

/**
 * Generate benchmark insights
 */
function generateBenchmarkInsights(
  comparisons: PerformanceComparison[],
): {
  strengths: string[];
  opportunities: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Identify strengths
  const excellentMeasures = comparisons.filter(c => c.performanceRating === "excellent");
  if (excellentMeasures.length > 0) {
    strengths.push(
      `${excellentMeasures.length} measure(s) in top 10% nationally (excellent performance)`
    );
    excellentMeasures.forEach(m => {
      strengths.push(`${m.measureName}: ${m.actualValue.toFixed(1)}% (${m.nationalPercentile}th percentile)`);
    });
  }

  // Identify improving measures
  const improvingMeasures = comparisons.filter(c => c.trend === "improving");
  if (improvingMeasures.length > 0) {
    strengths.push(`${improvingMeasures.length} measure(s) showing year-over-year improvement`);
  }

  // Identify opportunities
  const poorMeasures = comparisons.filter(c => c.performanceRating === "poor");
  if (poorMeasures.length > 0) {
    opportunities.push(
      `${poorMeasures.length} measure(s) below 50th percentile - significant improvement opportunity`
    );
    poorMeasures.forEach(m => {
      opportunities.push(
        `${m.measureName}: ${m.actualValue.toFixed(1)}% vs. national ${m.benchmarks.national?.value.toFixed(1)}%`
      );
    });
  }

  // Identify declining measures
  const decliningMeasures = comparisons.filter(c => c.trend === "declining");
  if (decliningMeasures.length > 0) {
    opportunities.push(`${decliningMeasures.length} measure(s) declining year-over-year`);
  }

  // Generate recommendations
  if (poorMeasures.length > 0) {
    recommendations.push("Focus quality improvement efforts on below-benchmark measures");
    recommendations.push("Implement best practices from high-performing peers");
  }

  if (decliningMeasures.length > 0) {
    recommendations.push("Investigate root causes of declining performance");
    recommendations.push("Review process changes that may have impacted performance");
  }

  const nearMissesBelow = comparisons.filter(c =>
    c.benchmarks.peerGroup &&
    c.actualValue < c.benchmarks.peerGroup.value &&
    c.benchmarks.peerGroup.value - c.actualValue < 5
  );

  if (nearMissesBelow.length > 0) {
    recommendations.push(
      `${nearMissesBelow.length} measure(s) within 5% of peer benchmark - quick wins possible`
    );
  }

  return {
    strengths,
    opportunities,
    recommendations,
  };
}

// ============================================================================
// Trend Analysis
// ============================================================================

/**
 * Analyze trends over multiple years
 */
export function analyzeTrends(
  measureId: string,
  measureName: string,
  historicalData: Array<{ year: number; value: number }>,
): {
  trend: "improving" | "declining" | "stable" | "volatile";
  averageChange: number;
  projectedNextYear: number;
  volatility: number;
} {
  if (historicalData.length < 2) {
    return {
      trend: "stable",
      averageChange: 0,
      projectedNextYear: historicalData[0]?.value || 0,
      volatility: 0,
    };
  }

  // Sort by year
  const sorted = [...historicalData].sort((a, b) => a.year - b.year);

  // Calculate year-over-year changes
  const changes: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    changes.push(sorted[i].value - sorted[i - 1].value);
  }

  const averageChange = changes.reduce((a, b) => a + b, 0) / changes.length;

  // Calculate volatility (standard deviation of changes)
  const variance = changes.reduce((sum, change) =>
    sum + Math.pow(change - averageChange, 2), 0
  ) / changes.length;
  const volatility = Math.sqrt(variance);

  // Determine trend
  let trend: "improving" | "declining" | "stable" | "volatile";

  if (volatility > Math.abs(averageChange) * 2) {
    trend = "volatile";
  } else if (Math.abs(averageChange) < 1) {
    trend = "stable";
  } else {
    trend = averageChange > 0 ? "improving" : "declining";
  }

  // Project next year
  const projectedNextYear = sorted[sorted.length - 1].value + averageChange;

  return {
    trend,
    averageChange,
    projectedNextYear,
    volatility,
  };
}

// ============================================================================
// Peer Comparison Matrix
// ============================================================================

export interface PeerComparisonMatrix {
  measures: string[];
  peers: Array<{
    peerId: string;
    peerName: string;
    values: number[];
  }>;
  yourOrganization: {
    values: number[];
    rank: number[];
  };
}

/**
 * Generate peer comparison matrix
 */
export function generatePeerComparisonMatrix(
  organizationName: string,
  yourValues: Record<string, number>,
  peerData: Array<{
    peerId: string;
    peerName: string;
    values: Record<string, number>;
  }>,
): PeerComparisonMatrix {
  const measures = Object.keys(yourValues);

  const peers = peerData.map(peer => ({
    peerId: peer.peerId,
    peerName: peer.peerName,
    values: measures.map(m => peer.values[m] || 0),
  }));

  const yourOrganization = {
    values: measures.map(m => yourValues[m]),
    rank: measures.map(m => {
      const allValues = [yourValues[m], ...peerData.map(p => p.values[m] || 0)];
      const sorted = allValues.sort((a, b) => b - a);
      return sorted.indexOf(yourValues[m]) + 1;
    }),
  };

  return {
    measures,
    peers,
    yourOrganization,
  };
}

/**
 * Benchmarking Utilities
 * Industry comparisons, peer group analysis, percentile calculations
 */

export interface BenchmarkData {
  metricId: string;
  metricName: string;
  organizationValue: number;
  industryAverage: number;
  industryMedian: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  organizationPercentile: number;
  comparison: "above" | "at" | "below";
  gap: number;
  gapPercent: number;
}

export interface PeerGroup {
  id: string;
  name: string;
  criteria: {
    bedCount?: { min: number; max: number };
    location?: string[];
    type?: string[];
    revenue?: { min: number; max: number };
  };
  memberCount: number;
}

export interface PeerComparison {
  metricId: string;
  organizationValue: number;
  peerGroupAverage: number;
  peerGroupMedian: number;
  organizationRank: number;
  totalPeers: number;
  percentile: number;
  bestInClass: number;
  gapToBest: number;
}

export interface IndustryBenchmark {
  category: string;
  metric: string;
  unit: string;
  national: {
    average: number;
    median: number;
    top10Percent: number;
    top25Percent: number;
  };
  regional?: {
    [region: string]: {
      average: number;
      median: number;
    };
  };
  bySize?: {
    small: { average: number; median: number };
    medium: { average: number; median: number };
    large: { average: number; median: number };
  };
}

/**
 * Industry benchmark data for healthcare metrics
 * Data source: CMS, HFMA, MGMA benchmarks (example values)
 */
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  days_in_ar: {
    category: "Financial",
    metric: "Days in A/R",
    unit: "days",
    national: {
      average: 38,
      median: 35,
      top10Percent: 25,
      top25Percent: 30,
    },
    bySize: {
      small: { average: 42, median: 40 },
      medium: { average: 36, median: 34 },
      large: { average: 32, median: 30 },
    },
  },

  collection_rate: {
    category: "Financial",
    metric: "Collection Rate",
    unit: "percentage",
    national: {
      average: 93.5,
      median: 95.0,
      top10Percent: 98.0,
      top25Percent: 96.5,
    },
    bySize: {
      small: { average: 91.0, median: 92.5 },
      medium: { average: 94.0, median: 95.0 },
      large: { average: 95.5, median: 96.5 },
    },
  },

  claim_denial_rate: {
    category: "Financial",
    metric: "Claim Denial Rate",
    unit: "percentage",
    national: {
      average: 8.5,
      median: 7.0,
      top10Percent: 3.0,
      top25Percent: 5.0,
    },
  },

  patient_wait_time: {
    category: "Operational",
    metric: "Patient Wait Time",
    unit: "minutes",
    national: {
      average: 24,
      median: 20,
      top10Percent: 12,
      top25Percent: 15,
    },
  },

  no_show_rate: {
    category: "Operational",
    metric: "No-Show Rate",
    unit: "percentage",
    national: {
      average: 7.5,
      median: 6.0,
      top10Percent: 3.0,
      top25Percent: 4.5,
    },
  },

  bed_occupancy_rate: {
    category: "Operational",
    metric: "Bed Occupancy Rate",
    unit: "percentage",
    national: {
      average: 76,
      median: 78,
      top10Percent: 88,
      top25Percent: 85,
    },
  },

  readmission_rate: {
    category: "Clinical",
    metric: "30-Day Readmission Rate",
    unit: "percentage",
    national: {
      average: 14.5,
      median: 13.8,
      top10Percent: 8.0,
      top25Percent: 10.5,
    },
  },

  patient_satisfaction: {
    category: "Quality",
    metric: "Patient Satisfaction Score",
    unit: "score",
    national: {
      average: 4.2,
      median: 4.3,
      top10Percent: 4.8,
      top25Percent: 4.6,
    },
  },

  provider_productivity: {
    category: "Productivity",
    metric: "Provider Productivity",
    unit: "patients_per_day",
    national: {
      average: 18,
      median: 20,
      top10Percent: 28,
      top25Percent: 24,
    },
  },
};

/**
 * Calculate organization's performance against industry benchmarks
 */
export function calculateBenchmark(
  metricId: string,
  organizationValue: number,
  higherIsBetter: boolean = true,
): BenchmarkData | null {
  const benchmark = INDUSTRY_BENCHMARKS[metricId];
  if (!benchmark) {
    return null;
  }

  const { national } = benchmark;

  // Calculate percentile based on organization value
  const percentile = calculatePercentileRank(
    organizationValue,
    {
      p10: national.top10Percent,
      p25: national.top25Percent,
      p50: national.median,
      p75: higherIsBetter
        ? national.average - (national.median - national.average)
        : national.average,
      p90: higherIsBetter
        ? national.average - 2 * (national.median - national.average)
        : national.average + (national.average - national.median),
      p95: higherIsBetter
        ? national.average - 3 * (national.median - national.average)
        : national.average + 2 * (national.average - national.median),
    },
    higherIsBetter,
  );

  // Determine comparison
  let comparison: "above" | "at" | "below" = "at";
  const tolerance = national.median * 0.05; // 5% tolerance

  if (higherIsBetter) {
    if (organizationValue > national.median + tolerance) {
      comparison = "above";
    } else if (organizationValue < national.median - tolerance) {
      comparison = "below";
    }
  } else {
    if (organizationValue < national.median - tolerance) {
      comparison = "above";
    } else if (organizationValue > national.median + tolerance) {
      comparison = "below";
    }
  }

  // Calculate gap
  const gap = organizationValue - national.median;
  const gapPercent = (gap / national.median) * 100;

  return {
    metricId,
    metricName: benchmark.metric,
    organizationValue,
    industryAverage: national.average,
    industryMedian: national.median,
    percentiles: {
      p10: national.top10Percent,
      p25: national.top25Percent,
      p50: national.median,
      p75: higherIsBetter
        ? national.average - (national.median - national.average)
        : national.average,
      p90: higherIsBetter
        ? national.average - 2 * (national.median - national.average)
        : national.average + (national.average - national.median),
      p95: higherIsBetter
        ? national.average - 3 * (national.median - national.average)
        : national.average + 2 * (national.average - national.median),
    },
    organizationPercentile: percentile,
    comparison,
    gap,
    gapPercent,
  };
}

/**
 * Calculate percentile rank
 */
function calculatePercentileRank(
  value: number,
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  },
  higherIsBetter: boolean = true,
): number {
  const { p10, p25, p50, p75, p90, p95 } = percentiles;

  if (higherIsBetter) {
    if (value >= p10) return 95;
    if (value >= p25) return 85;
    if (value >= p50) return 60;
    if (value >= p75) return 35;
    if (value >= p90) return 15;
    if (value >= p95) return 5;
    return 0;
  } else {
    if (value <= p10) return 95;
    if (value <= p25) return 85;
    if (value <= p50) return 60;
    if (value <= p75) return 35;
    if (value <= p90) return 15;
    if (value <= p95) return 5;
    return 0;
  }
}

/**
 * Compare against peer group
 */
export function compareToPeers(
  metricId: string,
  organizationValue: number,
  peerValues: number[],
  higherIsBetter: boolean = true,
): PeerComparison {
  if (peerValues.length === 0) {
    return {
      metricId,
      organizationValue,
      peerGroupAverage: organizationValue,
      peerGroupMedian: organizationValue,
      organizationRank: 1,
      totalPeers: 1,
      percentile: 50,
      bestInClass: organizationValue,
      gapToBest: 0,
    };
  }

  // Calculate peer statistics
  const sortedPeers = [...peerValues].sort((a, b) =>
    higherIsBetter ? b - a : a - b,
  );
  const peerGroupAverage =
    peerValues.reduce((sum, v) => sum + v, 0) / peerValues.length;
  const peerGroupMedian = sortedPeers[Math.floor(sortedPeers.length / 2)];
  const bestInClass = sortedPeers[0];

  // Calculate organization rank
  const allValues = [...peerValues, organizationValue].sort((a, b) =>
    higherIsBetter ? b - a : a - b,
  );
  const organizationRank = allValues.indexOf(organizationValue) + 1;

  // Calculate percentile
  const percentile =
    ((allValues.length - organizationRank) / allValues.length) * 100;

  // Calculate gap to best
  const gapToBest = higherIsBetter
    ? bestInClass - organizationValue
    : organizationValue - bestInClass;

  return {
    metricId,
    organizationValue,
    peerGroupAverage,
    peerGroupMedian,
    organizationRank,
    totalPeers: peerValues.length + 1,
    percentile: Math.round(percentile),
    bestInClass,
    gapToBest,
  };
}

/**
 * Identify performance gaps
 */
export function identifyPerformanceGaps(
  benchmarks: BenchmarkData[],
  threshold: number = 10,
): {
  critical: BenchmarkData[];
  moderate: BenchmarkData[];
  minor: BenchmarkData[];
} {
  const critical: BenchmarkData[] = [];
  const moderate: BenchmarkData[] = [];
  const minor: BenchmarkData[] = [];

  benchmarks.forEach((benchmark) => {
    const gapPercent = Math.abs(benchmark.gapPercent);

    if (benchmark.comparison === "below") {
      if (gapPercent >= threshold * 2) {
        critical.push(benchmark);
      } else if (gapPercent >= threshold) {
        moderate.push(benchmark);
      } else {
        minor.push(benchmark);
      }
    }
  });

  return { critical, moderate, minor };
}

/**
 * Calculate competitive position
 */
export function calculateCompetitivePosition(benchmarks: BenchmarkData[]): {
  score: number;
  position:
    | "leader"
    | "above-average"
    | "average"
    | "below-average"
    | "laggard";
  strengths: string[];
  weaknesses: string[];
} {
  if (benchmarks.length === 0) {
    return {
      score: 0,
      position: "average",
      strengths: [],
      weaknesses: [],
    };
  }

  // Calculate average percentile
  const avgPercentile =
    benchmarks.reduce((sum, b) => sum + b.organizationPercentile, 0) /
    benchmarks.length;

  // Determine position
  let position:
    | "leader"
    | "above-average"
    | "average"
    | "below-average"
    | "laggard";
  if (avgPercentile >= 85) position = "leader";
  else if (avgPercentile >= 65) position = "above-average";
  else if (avgPercentile >= 40) position = "average";
  else if (avgPercentile >= 20) position = "below-average";
  else position = "laggard";

  // Identify strengths (top 25%)
  const strengths = benchmarks
    .filter((b) => b.organizationPercentile >= 75)
    .map((b) => b.metricName);

  // Identify weaknesses (bottom 25%)
  const weaknesses = benchmarks
    .filter((b) => b.organizationPercentile <= 25)
    .map((b) => b.metricName);

  return {
    score: Math.round(avgPercentile),
    position,
    strengths,
    weaknesses,
  };
}

/**
 * Generate benchmark report summary
 */
export function generateBenchmarkReport(
  organizationName: string,
  benchmarks: BenchmarkData[],
): {
  organization: string;
  reportDate: Date;
  overallScore: number;
  position: string;
  metricsAboveAverage: number;
  metricsBelowAverage: number;
  topPerformers: BenchmarkData[];
  needsImprovement: BenchmarkData[];
  recommendations: string[];
} {
  const competitivePosition = calculateCompetitivePosition(benchmarks);
  const gaps = identifyPerformanceGaps(benchmarks);

  const metricsAboveAverage = benchmarks.filter(
    (b) => b.comparison === "above",
  ).length;
  const metricsBelowAverage = benchmarks.filter(
    (b) => b.comparison === "below",
  ).length;

  // Top 3 performers
  const topPerformers = [...benchmarks]
    .sort((a, b) => b.organizationPercentile - a.organizationPercentile)
    .slice(0, 3);

  // Bottom 3 performers
  const needsImprovement = [...benchmarks]
    .sort((a, b) => a.organizationPercentile - b.organizationPercentile)
    .slice(0, 3);

  // Generate recommendations
  const recommendations: string[] = [];

  gaps.critical.forEach((gap) => {
    recommendations.push(
      `Critical: Address ${gap.metricName} - currently ${Math.abs(gap.gapPercent).toFixed(1)}% below industry median`,
    );
  });

  gaps.moderate.forEach((gap) => {
    recommendations.push(
      `Moderate: Improve ${gap.metricName} to reach industry standards`,
    );
  });

  if (
    competitivePosition.position === "below-average" ||
    competitivePosition.position === "laggard"
  ) {
    recommendations.push(
      "Focus on operational efficiency improvements across all key metrics",
    );
  }

  return {
    organization: organizationName,
    reportDate: new Date(),
    overallScore: competitivePosition.score,
    position: competitivePosition.position,
    metricsAboveAverage,
    metricsBelowAverage,
    topPerformers,
    needsImprovement,
    recommendations,
  };
}

/**
 * Calculate trend vs. industry
 */
export function compareTrendToIndustry(
  organizationTrend: { period: string; value: number }[],
  industryTrend: { period: string; value: number }[],
  higherIsBetter: boolean = true,
): {
  organizationGrowth: number;
  industryGrowth: number;
  relativeDifference: number;
  outperforming: boolean;
} {
  if (organizationTrend.length < 2 || industryTrend.length < 2) {
    return {
      organizationGrowth: 0,
      industryGrowth: 0,
      relativeDifference: 0,
      outperforming: false,
    };
  }

  const orgStart = organizationTrend[0].value;
  const orgEnd = organizationTrend[organizationTrend.length - 1].value;
  const orgGrowth = ((orgEnd - orgStart) / orgStart) * 100;

  const indStart = industryTrend[0].value;
  const indEnd = industryTrend[industryTrend.length - 1].value;
  const indGrowth = ((indEnd - indStart) / indStart) * 100;

  const relativeDifference = orgGrowth - indGrowth;

  const outperforming = higherIsBetter
    ? orgGrowth > indGrowth
    : orgGrowth < indGrowth;

  return {
    organizationGrowth: orgGrowth,
    industryGrowth: indGrowth,
    relativeDifference,
    outperforming,
  };
}

/**
 * Match organization to appropriate peer group
 */
export function matchPeerGroup(
  organization: {
    bedCount?: number;
    location?: string;
    type?: string;
    revenue?: number;
  },
  peerGroups: PeerGroup[],
): PeerGroup | null {
  for (const group of peerGroups) {
    const { criteria } = group;
    let matches = true;

    if (criteria.bedCount && organization.bedCount) {
      if (
        organization.bedCount < criteria.bedCount.min ||
        organization.bedCount > criteria.bedCount.max
      ) {
        matches = false;
      }
    }

    if (criteria.location && organization.location) {
      if (!criteria.location.includes(organization.location)) {
        matches = false;
      }
    }

    if (criteria.type && organization.type) {
      if (!criteria.type.includes(organization.type)) {
        matches = false;
      }
    }

    if (criteria.revenue && organization.revenue) {
      if (
        organization.revenue < criteria.revenue.min ||
        organization.revenue > criteria.revenue.max
      ) {
        matches = false;
      }
    }

    if (matches) {
      return group;
    }
  }

  return null;
}

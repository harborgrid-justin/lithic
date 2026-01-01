import { NextRequest, NextResponse } from "next/server";
import {
  calculateBenchmark,
  compareToPeers,
  identifyPerformanceGaps,
  calculateCompetitivePosition,
  generateBenchmarkReport,
  compareTrendToIndustry,
  INDUSTRY_BENCHMARKS,
  BenchmarkData,
} from "@/lib/analytics/benchmarking";

/**
 * GET /api/analytics/benchmarking
 * Benchmarking analytics endpoint
 * Returns industry comparisons, peer analysis, and competitive positioning
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || "all";
    const includeHistory = searchParams.get("includeHistory") === "true";

    // Mock organization data
    // In production, fetch from database
    const organizationMetrics: Record<string, number> = {
      days_in_ar: 38,
      collection_rate: 93.2,
      claim_denial_rate: 6.2,
      patient_wait_time: 18,
      no_show_rate: 4.9,
      bed_occupancy_rate: 85,
      readmission_rate: 8.6,
      patient_satisfaction: 4.6,
      provider_productivity: 22,
    };

    // Filter benchmarks by category
    let metricsToCompare = Object.keys(INDUSTRY_BENCHMARKS);
    if (category !== "all") {
      metricsToCompare = metricsToCompare.filter(
        (key) =>
          INDUSTRY_BENCHMARKS[key].category.toLowerCase() ===
          category.toLowerCase(),
      );
    }

    // Calculate benchmarks for each metric
    const benchmarks: BenchmarkData[] = [];

    for (const metricId of metricsToCompare) {
      const orgValue = organizationMetrics[metricId];
      if (orgValue === undefined) continue;

      const benchmark = INDUSTRY_BENCHMARKS[metricId];
      const higherIsBetter = ![
        "days_in_ar",
        "claim_denial_rate",
        "patient_wait_time",
        "no_show_rate",
        "readmission_rate",
      ].includes(metricId);

      const benchmarkData = calculateBenchmark(
        metricId,
        orgValue,
        higherIsBetter,
      );
      if (benchmarkData) {
        benchmarks.push(benchmarkData);
      }
    }

    // Calculate competitive position
    const competitivePosition = calculateCompetitivePosition(benchmarks);

    // Identify performance gaps
    const gaps = identifyPerformanceGaps(benchmarks, 10);

    // Generate peer comparisons
    // Mock peer data - in production, fetch from database
    const peerComparisons = [];

    for (const metricId of metricsToCompare.slice(0, 5)) {
      const orgValue = organizationMetrics[metricId];
      if (orgValue === undefined) continue;

      // Generate mock peer values
      const benchmark = INDUSTRY_BENCHMARKS[metricId];
      const peerValues = Array.from({ length: 20 }, () => {
        const variation = benchmark.national.median * 0.15;
        return benchmark.national.median + (Math.random() - 0.5) * variation;
      });

      const higherIsBetter = ![
        "days_in_ar",
        "claim_denial_rate",
        "patient_wait_time",
        "no_show_rate",
        "readmission_rate",
      ].includes(metricId);

      const peerComparison = compareToPeers(
        metricId,
        orgValue,
        peerValues,
        higherIsBetter,
      );
      peerComparisons.push(peerComparison);
    }

    // Generate benchmark report
    const report = generateBenchmarkReport(
      "Your Healthcare Organization",
      benchmarks,
    );

    // Historical trend comparison
    let trendComparison = null;
    if (includeHistory) {
      // Mock historical data
      const orgTrend = Array.from({ length: 12 }, (_, i) => ({
        period: `Month ${i + 1}`,
        value: organizationMetrics.collection_rate + (Math.random() - 0.5) * 2,
      }));

      const industryTrend = Array.from({ length: 12 }, (_, i) => ({
        period: `Month ${i + 1}`,
        value:
          INDUSTRY_BENCHMARKS.collection_rate.national.median +
          (Math.random() - 0.5) * 1,
      }));

      trendComparison = compareTrendToIndustry(orgTrend, industryTrend, true);
    }

    // Generate improvement opportunities
    const opportunities = generateImprovementOpportunities(gaps, benchmarks);

    // Best practices recommendations
    const bestPractices = generateBestPractices(competitivePosition, gaps);

    return NextResponse.json({
      success: true,
      category,
      benchmarks,
      competitivePosition,
      gaps: {
        critical: gaps.critical.length,
        moderate: gaps.moderate.length,
        minor: gaps.minor.length,
        details: gaps,
      },
      peerComparisons: peerComparisons.slice(0, 5),
      report,
      trendComparison,
      opportunities,
      bestPractices,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalMetrics: benchmarks.length,
        dataSource: "CMS/HFMA/MGMA National Benchmarks",
        lastUpdated: "2025-01-01",
      },
    });
  } catch (error) {
    console.error("Error in benchmarking analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to generate benchmarking analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate improvement opportunities based on gaps
 */
function generateImprovementOpportunities(
  gaps: any,
  benchmarks: BenchmarkData[],
): any[] {
  const opportunities = [];

  // Critical gaps - highest priority
  gaps.critical.forEach((gap: BenchmarkData) => {
    const potentialImprovement = Math.abs(gap.gap);
    opportunities.push({
      metric: gap.metricName,
      priority: "critical",
      currentValue: gap.organizationValue,
      targetValue: gap.industryMedian,
      gap: gap.gap,
      gapPercent: gap.gapPercent,
      potentialImpact: calculateImpact(gap.metricId, potentialImprovement),
      timeframe: "3-6 months",
      difficulty: "high",
    });
  });

  // Moderate gaps - medium priority
  gaps.moderate.forEach((gap: BenchmarkData) => {
    const potentialImprovement = Math.abs(gap.gap);
    opportunities.push({
      metric: gap.metricName,
      priority: "moderate",
      currentValue: gap.organizationValue,
      targetValue: gap.industryMedian,
      gap: gap.gap,
      gapPercent: gap.gapPercent,
      potentialImpact: calculateImpact(gap.metricId, potentialImprovement),
      timeframe: "6-12 months",
      difficulty: "medium",
    });
  });

  // Find top performers to leverage
  const topPerformers = benchmarks
    .filter((b) => b.organizationPercentile >= 75)
    .slice(0, 3);

  topPerformers.forEach((perf) => {
    opportunities.push({
      metric: perf.metricName,
      priority: "leverage",
      currentValue: perf.organizationValue,
      targetValue: perf.percentiles.p10, // Top 10%
      gap: perf.percentiles.p10 - perf.organizationValue,
      potentialImpact: "Share best practices organization-wide",
      timeframe: "1-3 months",
      difficulty: "low",
    });
  });

  return opportunities;
}

/**
 * Calculate potential impact of improvement
 */
function calculateImpact(metricId: string, improvement: number): string {
  const impactMap: Record<string, (imp: number) => string> = {
    days_in_ar: (imp) =>
      `Potential cash flow improvement: $${Math.round(imp * 15000).toLocaleString()}`,
    collection_rate: (imp) =>
      `Additional revenue: $${Math.round(imp * 5000).toLocaleString()}/month`,
    claim_denial_rate: (imp) =>
      `Revenue recovery: $${Math.round(imp * 3000).toLocaleString()}/month`,
    patient_satisfaction: (imp) =>
      `Estimated patient retention increase: ${(imp * 2).toFixed(1)}%`,
    readmission_rate: (imp) =>
      `Cost savings: $${Math.round(imp * 8000).toLocaleString()}/month`,
    patient_wait_time: (imp) =>
      `Patient satisfaction improvement: ${(imp * 0.5).toFixed(1)} points`,
  };

  const calculator = impactMap[metricId];
  return calculator ? calculator(improvement) : "Positive impact on operations";
}

/**
 * Generate best practices recommendations
 */
function generateBestPractices(competitivePosition: any, gaps: any): any[] {
  const practices = [];

  // Based on competitive position
  if (
    competitivePosition.position === "below-average" ||
    competitivePosition.position === "laggard"
  ) {
    practices.push({
      category: "Overall",
      priority: "critical",
      title: "Comprehensive Performance Improvement Initiative",
      description:
        "Implement organization-wide performance improvement program focusing on key operational and financial metrics.",
      steps: [
        "Conduct detailed root cause analysis of underperforming areas",
        "Establish cross-functional improvement teams",
        "Set quarterly improvement targets",
        "Implement regular performance reviews",
      ],
    });
  }

  // Based on critical gaps
  if (gaps.critical.length > 0) {
    const topGap = gaps.critical[0];
    practices.push({
      category: topGap.metricName,
      priority: "critical",
      title: `Improve ${topGap.metricName}`,
      description: `Current performance is ${Math.abs(topGap.gapPercent).toFixed(1)}% below industry median`,
      steps: getImprovementSteps(topGap.metricId),
    });
  }

  // General best practices
  practices.push({
    category: "Technology",
    priority: "medium",
    title: "Leverage Analytics and Automation",
    description:
      "Use data-driven insights and process automation to improve efficiency",
    steps: [
      "Implement real-time dashboards for key metrics",
      "Automate routine processes",
      "Use predictive analytics for proactive management",
      "Integrate systems for seamless data flow",
    ],
  });

  practices.push({
    category: "Training",
    priority: "medium",
    title: "Staff Development and Engagement",
    description: "Invest in staff training and engagement programs",
    steps: [
      "Regular training on best practices",
      "Performance feedback and coaching",
      "Recognition programs for high performers",
      "Cross-training opportunities",
    ],
  });

  return practices;
}

/**
 * Get improvement steps for specific metrics
 */
function getImprovementSteps(metricId: string): string[] {
  const stepsMap: Record<string, string[]> = {
    days_in_ar: [
      "Implement automated claims scrubbing",
      "Enhance denial management process",
      "Optimize payment posting workflows",
      "Increase patient payment collection at point of service",
    ],
    claim_denial_rate: [
      "Conduct denial root cause analysis",
      "Improve pre-authorization processes",
      "Enhance coding accuracy training",
      "Implement real-time eligibility verification",
    ],
    patient_wait_time: [
      "Optimize scheduling templates",
      "Implement patient flow management system",
      "Adjust staffing based on demand patterns",
      "Use queue management technology",
    ],
    readmission_rate: [
      "Enhance discharge planning process",
      "Implement post-discharge follow-up program",
      "Improve care coordination",
      "Strengthen patient education initiatives",
    ],
  };

  return (
    stepsMap[metricId] || [
      "Analyze current processes",
      "Benchmark against top performers",
      "Implement targeted improvements",
      "Monitor and adjust",
    ]
  );
}

/**
 * POST /api/analytics/benchmarking
 * Custom benchmark comparison with user-provided data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, peerData } = body;

    if (!metrics || typeof metrics !== "object") {
      return NextResponse.json(
        { error: "metrics object is required" },
        { status: 400 },
      );
    }

    const benchmarks: BenchmarkData[] = [];

    for (const [metricId, value] of Object.entries(metrics)) {
      if (typeof value !== "number") continue;

      const higherIsBetter = ![
        "days_in_ar",
        "claim_denial_rate",
        "patient_wait_time",
        "no_show_rate",
        "readmission_rate",
      ].includes(metricId);

      const benchmark = calculateBenchmark(metricId, value, higherIsBetter);
      if (benchmark) {
        benchmarks.push(benchmark);
      }
    }

    const competitivePosition = calculateCompetitivePosition(benchmarks);
    const gaps = identifyPerformanceGaps(benchmarks, 10);

    return NextResponse.json({
      success: true,
      benchmarks,
      competitivePosition,
      gaps,
      metadata: {
        generatedAt: new Date().toISOString(),
        metricsAnalyzed: benchmarks.length,
      },
    });
  } catch (error) {
    console.error("Error in benchmarking analytics POST:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate benchmarks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

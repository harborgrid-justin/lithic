/**
 * HEDIS Measure Calculator
 * Healthcare Effectiveness Data and Information Set
 * NCQA quality measures for health plans and managed care organizations
 */

export type HEDISDomain =
  | "effectiveness-of-care"
  | "access-availability"
  | "experience-of-care"
  | "utilization"
  | "risk-adjusted-utilization"
  | "measures-reported-using-ehr";

export interface HEDISMeasure {
  measureCode: string;
  measureName: string;
  description: string;
  domain: HEDISDomain;
  productLine: "commercial" | "medicare" | "medicaid" | "marketplace";

  // Performance
  numerator: number;
  denominator: number;
  rate: number;

  // Exclusions
  exclusions: number;
  validExceptions?: number;

  // Age stratification (if applicable)
  ageStratification?: AgeStratum[];

  // Star ratings (for Medicare Advantage)
  starRating?: number;
  starThresholds?: StarThreshold[];

  // NCQA benchmarks
  ncqaBenchmark50th?: number;
  ncqaBenchmark75th?: number;
  ncqaBenchmark90th?: number;
  percentile?: number;
}

export interface AgeStratum {
  ageRange: string;
  numerator: number;
  denominator: number;
  rate: number;
}

export interface StarThreshold {
  stars: number;
  threshold: number;
}

// ============================================================================
// HEDIS Measure Definitions
// ============================================================================

/**
 * Get HEDIS measure specification
 */
export function getHEDISMeasureDefinition(measureCode: string): Partial<HEDISMeasure> {
  const measures: Record<string, Partial<HEDISMeasure>> = {
    // Diabetes Care
    "CDC-H": {
      measureCode: "CDC-H",
      measureName: "Comprehensive Diabetes Care - HbA1c Testing",
      description: "Percentage of members 18-75 years of age with diabetes who had HbA1c testing",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 88.0,
      ncqaBenchmark75th: 92.5,
      ncqaBenchmark90th: 95.0,
    },

    "CDC-C": {
      measureCode: "CDC-C",
      measureName: "Comprehensive Diabetes Care - HbA1c Control (<8%)",
      description: "Percentage of members 18-75 years of age with diabetes who had HbA1c control (<8%)",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 55.0,
      ncqaBenchmark75th: 62.0,
      ncqaBenchmark90th: 68.0,
    },

    "CDC-E": {
      measureCode: "CDC-E",
      measureName: "Comprehensive Diabetes Care - Eye Exam",
      description: "Percentage of members 18-75 years of age with diabetes who had a retinal eye exam",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 54.0,
      ncqaBenchmark75th: 61.0,
      ncqaBenchmark90th: 67.0,
    },

    "CDC-N": {
      measureCode: "CDC-N",
      measureName: "Comprehensive Diabetes Care - Kidney Screening",
      description: "Percentage of members 18-75 years of age with diabetes who had kidney screening",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 90.0,
      ncqaBenchmark75th: 94.0,
      ncqaBenchmark90th: 96.5,
    },

    "CDC-BP": {
      measureCode: "CDC-BP",
      measureName: "Comprehensive Diabetes Care - BP Control (<140/90)",
      description: "Percentage of members 18-75 years of age with diabetes who had BP control (<140/90 mm Hg)",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 67.0,
      ncqaBenchmark75th: 74.0,
      ncqaBenchmark90th: 79.0,
    },

    // Cardiovascular Care
    "CBP": {
      measureCode: "CBP",
      measureName: "Controlling High Blood Pressure",
      description: "Percentage of members 18-85 years of age with hypertension whose BP was adequately controlled",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 62.0,
      ncqaBenchmark75th: 69.0,
      ncqaBenchmark90th: 75.0,
    },

    "SPC": {
      measureCode: "SPC",
      measureName: "Statin Therapy for Patients with Cardiovascular Disease",
      description: "Percentage of members who were prescribed or dispensed statin therapy",
      domain: "effectiveness-of-care",
      productLine: "medicare",
      ncqaBenchmark50th: 82.0,
      ncqaBenchmark75th: 87.0,
      ncqaBenchmark90th: 90.5,
    },

    // Preventive Care
    "BCS": {
      measureCode: "BCS",
      measureName: "Breast Cancer Screening",
      description: "Percentage of women 50-74 years of age who had a mammogram to screen for breast cancer",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 72.0,
      ncqaBenchmark75th: 77.0,
      ncqaBenchmark90th: 81.0,
    },

    "COL": {
      measureCode: "COL",
      measureName: "Colorectal Cancer Screening",
      description: "Percentage of members 50-75 years of age who had appropriate screening for colorectal cancer",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 67.0,
      ncqaBenchmark75th: 73.0,
      ncqaBenchmark90th: 78.0,
    },

    "CIS-3": {
      measureCode: "CIS-3",
      measureName: "Childhood Immunization Status - Combo 3",
      description: "Percentage of children 2 years of age who had specified vaccinations by their second birthday",
      domain: "effectiveness-of-care",
      productLine: "medicaid",
      ncqaBenchmark50th: 73.0,
      ncqaBenchmark75th: 78.0,
      ncqaBenchmark90th: 83.0,
    },

    "IMA": {
      measureCode: "IMA",
      measureName: "Immunizations for Adolescents - Combo 1",
      description: "Percentage of adolescents 13 years of age who had specified vaccinations",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 82.0,
      ncqaBenchmark75th: 87.0,
      ncqaBenchmark90th: 91.0,
    },

    // Behavioral Health
    "AMM": {
      measureCode: "AMM",
      measureName: "Antidepressant Medication Management - Effective Acute Phase",
      description: "Percentage of members 18 years and older with depression who remained on antidepressant medication for at least 12 weeks",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 56.0,
      ncqaBenchmark75th: 62.0,
      ncqaBenchmark90th: 67.0,
    },

    "FUH-7": {
      measureCode: "FUH-7",
      measureName: "Follow-Up After Hospitalization for Mental Illness - 7 Days",
      description: "Percentage of discharges with follow-up within 7 days after hospitalization for mental illness",
      domain: "effectiveness-of-care",
      productLine: "commercial",
      ncqaBenchmark50th: 52.0,
      ncqaBenchmark75th: 61.0,
      ncqaBenchmark90th: 69.0,
    },

    // Utilization
    "AAP": {
      measureCode: "AAP",
      measureName: "Adults' Access to Preventive/Ambulatory Health Services",
      description: "Percentage of members 20 years and older who had an ambulatory or preventive care visit",
      domain: "access-availability",
      productLine: "commercial",
      ncqaBenchmark50th: 82.0,
      ncqaBenchmark75th: 86.0,
      ncqaBenchmark90th: 89.0,
    },
  };

  return measures[measureCode] || {};
}

// ============================================================================
// HEDIS Calculation
// ============================================================================

/**
 * Calculate HEDIS measure rate
 */
export function calculateHEDISMeasure(
  measureCode: string,
  numerator: number,
  denominator: number,
  exclusions: number = 0,
  validExceptions: number = 0,
  productLine: HEDISMeasure["productLine"] = "commercial",
): HEDISMeasure {
  const definition = getHEDISMeasureDefinition(measureCode);

  const eligiblePopulation = denominator - exclusions;
  const reportingDenominator = eligiblePopulation - validExceptions;

  const rate = reportingDenominator > 0
    ? (numerator / reportingDenominator) * 100
    : 0;

  // Calculate percentile
  const percentile = calculateNCAQPercentile(
    rate,
    definition.ncqaBenchmark50th,
    definition.ncqaBenchmark75th,
    definition.ncqaBenchmark90th,
  );

  // Calculate star rating (for Medicare Advantage)
  const starRating = productLine === "medicare"
    ? calculateStarRating(rate, measureCode)
    : undefined;

  return {
    measureCode,
    measureName: definition.measureName || "",
    description: definition.description || "",
    domain: definition.domain || "effectiveness-of-care",
    productLine,
    numerator,
    denominator,
    rate,
    exclusions,
    validExceptions,
    ncqaBenchmark50th: definition.ncqaBenchmark50th,
    ncqaBenchmark75th: definition.ncqaBenchmark75th,
    ncqaBenchmark90th: definition.ncqaBenchmark90th,
    percentile,
    starRating,
  };
}

/**
 * Calculate NCQA percentile
 */
function calculateNCAQPercentile(
  rate: number,
  benchmark50?: number,
  benchmark75?: number,
  benchmark90?: number,
): number | undefined {
  if (!benchmark50 || !benchmark75 || !benchmark90) return undefined;

  if (rate >= benchmark90) return 90;
  if (rate >= benchmark75) return 75;
  if (rate >= benchmark50) return 50;
  return 25;
}

// ============================================================================
// Star Ratings (Medicare Advantage)
// ============================================================================

/**
 * Calculate Medicare Star Rating for measure
 */
function calculateStarRating(rate: number, measureCode: string): number {
  // Star thresholds vary by measure - this is simplified
  const starThresholds = getStarThresholds(measureCode);

  for (let i = starThresholds.length - 1; i >= 0; i--) {
    if (rate >= starThresholds[i].threshold) {
      return starThresholds[i].stars;
    }
  }

  return 1;
}

/**
 * Get star rating thresholds for measure
 */
function getStarThresholds(measureCode: string): StarThreshold[] {
  // Simplified - actual thresholds published annually by CMS
  const defaultThresholds: StarThreshold[] = [
    { stars: 5, threshold: 85 },
    { stars: 4, threshold: 75 },
    { stars: 3, threshold: 60 },
    { stars: 2, threshold: 45 },
    { stars: 1, threshold: 0 },
  ];

  return defaultThresholds;
}

/**
 * Calculate overall Star Rating for plan
 */
export function calculateOverallStarRating(
  measures: HEDISMeasure[],
): {
  overallRating: number;
  categoryRatings: Record<string, number>;
  measureCount: number;
} {
  const measuresWithStars = measures.filter(m => m.starRating !== undefined);

  if (measuresWithStars.length === 0) {
    return {
      overallRating: 0,
      categoryRatings: {},
      measureCount: 0,
    };
  }

  // Group by domain
  const domainRatings: Record<string, number[]> = {};

  measuresWithStars.forEach(measure => {
    if (!domainRatings[measure.domain]) {
      domainRatings[measure.domain] = [];
    }
    if (measure.starRating) {
      domainRatings[measure.domain].push(measure.starRating);
    }
  });

  // Calculate average rating per domain
  const categoryRatings: Record<string, number> = {};
  Object.keys(domainRatings).forEach(domain => {
    const ratings = domainRatings[domain];
    categoryRatings[domain] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  });

  // Calculate overall rating (weighted average of domains)
  const overallRating = Object.values(categoryRatings).reduce((a, b) => a + b, 0) /
    Object.values(categoryRatings).length;

  // Round to nearest 0.5
  const roundedRating = Math.round(overallRating * 2) / 2;

  return {
    overallRating: roundedRating,
    categoryRatings,
    measureCount: measuresWithStars.length,
  };
}

// ============================================================================
// Age Stratification
// ============================================================================

/**
 * Calculate age-stratified rates
 */
export function calculateAgeStratifiedRates(
  measureCode: string,
  strata: Array<{
    ageRange: string;
    numerator: number;
    denominator: number;
  }>,
): AgeStratum[] {
  return strata.map(stratum => ({
    ageRange: stratum.ageRange,
    numerator: stratum.numerator,
    denominator: stratum.denominator,
    rate: stratum.denominator > 0
      ? (stratum.numerator / stratum.denominator) * 100
      : 0,
  }));
}

// ============================================================================
// HEDIS Reporting Package
// ============================================================================

export interface HEDISReportingPackage {
  reportingYear: number;
  productLine: HEDISMeasure["productLine"];
  totalMembers: number;

  measures: HEDISMeasure[];

  summaryByDomain: Record<HEDISDomain, {
    measureCount: number;
    averageRate: number;
    above90thPercentile: number;
    above75thPercentile: number;
    below50thPercentile: number;
  }>;

  overallStarRating?: number;
  categoryStarRatings?: Record<string, number>;
}

/**
 * Generate HEDIS reporting package
 */
export function generateHEDISReportingPackage(
  reportingYear: number,
  productLine: HEDISMeasure["productLine"],
  totalMembers: number,
  measures: HEDISMeasure[],
): HEDISReportingPackage {
  // Calculate summary by domain
  const summaryByDomain: Record<string, {
    measureCount: number;
    averageRate: number;
    above90thPercentile: number;
    above75thPercentile: number;
    below50thPercentile: number;
  }> = {};

  const domains: HEDISDomain[] = [
    "effectiveness-of-care",
    "access-availability",
    "experience-of-care",
    "utilization",
    "risk-adjusted-utilization",
    "measures-reported-using-ehr",
  ];

  domains.forEach(domain => {
    const domainMeasures = measures.filter(m => m.domain === domain);

    if (domainMeasures.length === 0) return;

    const averageRate = domainMeasures.reduce((sum, m) => sum + m.rate, 0) / domainMeasures.length;

    const above90th = domainMeasures.filter(m =>
      m.percentile !== undefined && m.percentile >= 90
    ).length;

    const above75th = domainMeasures.filter(m =>
      m.percentile !== undefined && m.percentile >= 75
    ).length;

    const below50th = domainMeasures.filter(m =>
      m.percentile !== undefined && m.percentile < 50
    ).length;

    summaryByDomain[domain] = {
      measureCount: domainMeasures.length,
      averageRate,
      above90thPercentile: above90th,
      above75thPercentile: above75th,
      below50thPercentile: below50th,
    };
  });

  // Calculate star ratings if Medicare
  let overallStarRating: number | undefined;
  let categoryStarRatings: Record<string, number> | undefined;

  if (productLine === "medicare") {
    const starData = calculateOverallStarRating(measures);
    overallStarRating = starData.overallRating;
    categoryStarRatings = starData.categoryRatings;
  }

  return {
    reportingYear,
    productLine,
    totalMembers,
    measures,
    summaryByDomain: summaryByDomain as any,
    overallStarRating,
    categoryStarRatings,
  };
}

// ============================================================================
// Performance Insights
// ============================================================================

/**
 * Generate HEDIS performance insights
 */
export function generateHEDISInsights(
  reportingPackage: HEDISReportingPackage,
): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  // Overall assessment
  if (reportingPackage.overallStarRating) {
    if (reportingPackage.overallStarRating >= 4) {
      strengths.push(`Strong overall Star Rating: ${reportingPackage.overallStarRating} stars`);
    } else if (reportingPackage.overallStarRating < 3) {
      weaknesses.push(`Low overall Star Rating: ${reportingPackage.overallStarRating} stars`);
      recommendations.push("Focus on improving low-performing measures to increase Star Rating");
    }
  }

  // Domain analysis
  Object.entries(reportingPackage.summaryByDomain).forEach(([domain, summary]) => {
    if (summary.above90thPercentile >= summary.measureCount * 0.5) {
      strengths.push(`${domain}: ${summary.above90thPercentile} measures above 90th percentile`);
    }

    if (summary.below50thPercentile > 0) {
      weaknesses.push(`${domain}: ${summary.below50thPercentile} measures below 50th percentile`);
    }

    if (summary.above75thPercentile < summary.measureCount) {
      const opportunity = summary.measureCount - summary.above75thPercentile;
      opportunities.push(`${domain}: ${opportunity} measures could reach 75th percentile`);
    }
  });

  // Measure-specific recommendations
  const poorPerformers = reportingPackage.measures.filter(m =>
    m.percentile !== undefined && m.percentile < 50
  );

  if (poorPerformers.length > 0) {
    poorPerformers.forEach(measure => {
      recommendations.push(
        `${measure.measureCode}: Current ${measure.rate.toFixed(1)}%, target ${measure.ncqaBenchmark50th?.toFixed(1)}%`
      );
    });
  }

  return {
    strengths,
    weaknesses,
    opportunities,
    recommendations,
  };
}

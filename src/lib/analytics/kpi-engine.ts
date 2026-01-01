/**
 * KPI Calculation Engine
 * KPI definitions, target tracking, alerts/thresholds, historical comparison
 */

export type KPICategory =
  | "financial"
  | "operational"
  | "clinical"
  | "quality"
  | "patient-satisfaction"
  | "productivity";

export type KPITrend = "up" | "down" | "stable";

export type ComparisonOperator = "gt" | "gte" | "lt" | "lte" | "eq" | "between";

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: KPICategory;
  formula: string;
  unit: string;
  format: "number" | "currency" | "percentage" | "duration";
  target?: number;
  threshold?: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
  };
  higherIsBetter: boolean;
  calculationFrequency: "realtime" | "hourly" | "daily" | "weekly" | "monthly";
}

export interface KPIValue {
  kpiId: string;
  value: number;
  timestamp: Date;
  target?: number;
  previousValue?: number;
  trend: KPITrend;
  performanceLevel: "excellent" | "good" | "warning" | "critical";
  metadata?: Record<string, any>;
}

export interface KPIAlert {
  kpiId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface KPIComparison {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
  trend: KPITrend;
}

/**
 * Healthcare-specific KPI Definitions
 */
export const HEALTHCARE_KPIS: Record<string, KPIDefinition> = {
  // Financial KPIs
  revenue_per_patient: {
    id: "revenue_per_patient",
    name: "Revenue Per Patient",
    description: "Average revenue generated per patient visit",
    category: "financial",
    formula: "total_revenue / total_patients",
    unit: "USD",
    format: "currency",
    target: 250,
    threshold: {
      excellent: 300,
      good: 250,
      warning: 200,
      critical: 150,
    },
    higherIsBetter: true,
    calculationFrequency: "daily",
  },

  collection_rate: {
    id: "collection_rate",
    name: "Collection Rate",
    description: "Percentage of billed amounts successfully collected",
    category: "financial",
    formula: "(collections / charges) * 100",
    unit: "%",
    format: "percentage",
    target: 95,
    threshold: {
      excellent: 98,
      good: 95,
      warning: 90,
      critical: 85,
    },
    higherIsBetter: true,
    calculationFrequency: "monthly",
  },

  days_in_ar: {
    id: "days_in_ar",
    name: "Days in A/R",
    description: "Average days to collect accounts receivable",
    category: "financial",
    formula: "(accounts_receivable / (charges / days)) ",
    unit: "days",
    format: "number",
    target: 30,
    threshold: {
      excellent: 25,
      good: 30,
      warning: 45,
      critical: 60,
    },
    higherIsBetter: false,
    calculationFrequency: "daily",
  },

  claim_denial_rate: {
    id: "claim_denial_rate",
    name: "Claim Denial Rate",
    description: "Percentage of claims denied by payers",
    category: "financial",
    formula: "(denied_claims / total_claims) * 100",
    unit: "%",
    format: "percentage",
    target: 5,
    threshold: {
      excellent: 3,
      good: 5,
      warning: 8,
      critical: 12,
    },
    higherIsBetter: false,
    calculationFrequency: "weekly",
  },

  // Operational KPIs
  patient_wait_time: {
    id: "patient_wait_time",
    name: "Average Patient Wait Time",
    description: "Average time patients wait before seeing provider",
    category: "operational",
    formula: "sum(wait_times) / patient_count",
    unit: "minutes",
    format: "duration",
    target: 15,
    threshold: {
      excellent: 10,
      good: 15,
      warning: 25,
      critical: 40,
    },
    higherIsBetter: false,
    calculationFrequency: "daily",
  },

  appointment_no_show_rate: {
    id: "appointment_no_show_rate",
    name: "No-Show Rate",
    description: "Percentage of scheduled appointments with patient no-shows",
    category: "operational",
    formula: "(no_shows / total_appointments) * 100",
    unit: "%",
    format: "percentage",
    target: 5,
    threshold: {
      excellent: 3,
      good: 5,
      warning: 8,
      critical: 12,
    },
    higherIsBetter: false,
    calculationFrequency: "daily",
  },

  bed_occupancy_rate: {
    id: "bed_occupancy_rate",
    name: "Bed Occupancy Rate",
    description: "Percentage of available beds currently occupied",
    category: "operational",
    formula: "(occupied_beds / total_beds) * 100",
    unit: "%",
    format: "percentage",
    target: 85,
    threshold: {
      excellent: 85,
      good: 75,
      warning: 95,
      critical: 98,
    },
    higherIsBetter: true,
    calculationFrequency: "realtime",
  },

  average_length_of_stay: {
    id: "average_length_of_stay",
    name: "Average Length of Stay",
    description: "Average number of days patients stay in facility",
    category: "operational",
    formula: "sum(length_of_stays) / patient_count",
    unit: "days",
    format: "number",
    target: 4.5,
    threshold: {
      excellent: 4,
      good: 4.5,
      warning: 5.5,
      critical: 7,
    },
    higherIsBetter: false,
    calculationFrequency: "daily",
  },

  // Clinical KPIs
  readmission_rate: {
    id: "readmission_rate",
    name: "30-Day Readmission Rate",
    description: "Percentage of patients readmitted within 30 days",
    category: "clinical",
    formula: "(readmissions_30d / total_discharges) * 100",
    unit: "%",
    format: "percentage",
    target: 8,
    threshold: {
      excellent: 5,
      good: 8,
      warning: 12,
      critical: 15,
    },
    higherIsBetter: false,
    calculationFrequency: "monthly",
  },

  medication_error_rate: {
    id: "medication_error_rate",
    name: "Medication Error Rate",
    description: "Number of medication errors per 1000 patient days",
    category: "clinical",
    formula: "(medication_errors / patient_days) * 1000",
    unit: "per 1000",
    format: "number",
    target: 2,
    threshold: {
      excellent: 1,
      good: 2,
      warning: 4,
      critical: 6,
    },
    higherIsBetter: false,
    calculationFrequency: "weekly",
  },

  // Quality KPIs
  patient_satisfaction_score: {
    id: "patient_satisfaction_score",
    name: "Patient Satisfaction Score",
    description: "Average patient satisfaction rating (1-5 scale)",
    category: "patient-satisfaction",
    formula: "sum(satisfaction_scores) / response_count",
    unit: "score",
    format: "number",
    target: 4.5,
    threshold: {
      excellent: 4.7,
      good: 4.5,
      warning: 4.0,
      critical: 3.5,
    },
    higherIsBetter: true,
    calculationFrequency: "daily",
  },

  // Productivity KPIs
  provider_productivity: {
    id: "provider_productivity",
    name: "Provider Productivity",
    description: "Average number of patients seen per provider per day",
    category: "productivity",
    formula: "total_encounters / provider_count / working_days",
    unit: "patients",
    format: "number",
    target: 20,
    threshold: {
      excellent: 25,
      good: 20,
      warning: 15,
      critical: 10,
    },
    higherIsBetter: true,
    calculationFrequency: "daily",
  },
};

/**
 * Calculate KPI value
 */
export function calculateKPI(
  definition: KPIDefinition,
  rawData: Record<string, number>,
  previousValue?: number,
): KPIValue {
  // Parse and evaluate formula
  const value = evaluateFormula(definition.formula, rawData);

  // Determine trend
  const trend = determineTrend(value, previousValue, definition.higherIsBetter);

  // Determine performance level
  const performanceLevel = determinePerformanceLevel(value, definition);

  return {
    kpiId: definition.id,
    value,
    timestamp: new Date(),
    target: definition.target,
    previousValue,
    trend,
    performanceLevel,
  };
}

/**
 * Evaluate KPI formula
 */
function evaluateFormula(
  formula: string,
  data: Record<string, number>,
): number {
  try {
    // Replace variable names with their values
    let expression = formula;
    for (const [key, value] of Object.entries(data)) {
      expression = expression.replace(new RegExp(key, "g"), String(value));
    }

    // Safely evaluate mathematical expression
    // In production, use a proper expression parser library
    const result = Function(`"use strict"; return (${expression})`)();
    return Number(result) || 0;
  } catch (error) {
    console.error("Error evaluating formula:", formula, error);
    return 0;
  }
}

/**
 * Determine KPI trend
 */
function determineTrend(
  current: number,
  previous?: number,
  higherIsBetter: boolean = true,
): KPITrend {
  if (previous === undefined || previous === null) {
    return "stable";
  }

  const changePercent = ((current - previous) / previous) * 100;

  // Consider stable if change is less than 1%
  if (Math.abs(changePercent) < 1) {
    return "stable";
  }

  if (higherIsBetter) {
    return current > previous ? "up" : "down";
  } else {
    return current < previous ? "up" : "down";
  }
}

/**
 * Determine performance level based on thresholds
 */
function determinePerformanceLevel(
  value: number,
  definition: KPIDefinition,
): "excellent" | "good" | "warning" | "critical" {
  if (!definition.threshold) {
    return "good";
  }

  const { excellent, good, warning, critical } = definition.threshold;

  if (definition.higherIsBetter) {
    if (value >= excellent) return "excellent";
    if (value >= good) return "good";
    if (value >= warning) return "warning";
    return "critical";
  } else {
    if (value <= excellent) return "excellent";
    if (value <= good) return "good";
    if (value <= warning) return "warning";
    return "critical";
  }
}

/**
 * Check if KPI requires alert
 */
export function checkKPIAlert(
  kpiValue: KPIValue,
  definition: KPIDefinition,
): KPIAlert | null {
  if (
    kpiValue.performanceLevel === "critical" ||
    kpiValue.performanceLevel === "warning"
  ) {
    const severity =
      kpiValue.performanceLevel === "critical" ? "critical" : "high";
    const threshold = definition.threshold?.[kpiValue.performanceLevel] || 0;

    return {
      kpiId: definition.id,
      severity,
      message: generateAlertMessage(definition, kpiValue),
      threshold,
      currentValue: kpiValue.value,
      timestamp: new Date(),
      acknowledged: false,
    };
  }

  return null;
}

/**
 * Generate alert message
 */
function generateAlertMessage(
  definition: KPIDefinition,
  kpiValue: KPIValue,
): string {
  const direction = definition.higherIsBetter ? "below" : "above";
  const threshold = definition.threshold?.[kpiValue.performanceLevel] || 0;

  return (
    `${definition.name} is ${direction} ${kpiValue.performanceLevel} threshold. ` +
    `Current: ${formatKPIValue(kpiValue.value, definition)}, ` +
    `Threshold: ${formatKPIValue(threshold, definition)}`
  );
}

/**
 * Format KPI value
 */
export function formatKPIValue(
  value: number,
  definition: KPIDefinition,
): string {
  switch (definition.format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "duration":
      return `${Math.round(value)} ${definition.unit}`;
    default:
      return `${value.toFixed(2)} ${definition.unit}`;
  }
}

/**
 * Compare KPI values over time
 */
export function compareKPIs(
  current: KPIValue,
  previous: KPIValue,
): KPIComparison {
  const change = current.value - previous.value;
  const percentChange =
    previous.value !== 0
      ? ((current.value - previous.value) / previous.value) * 100
      : 0;

  return {
    current: current.value,
    previous: previous.value,
    change,
    percentChange,
    trend: current.trend,
  };
}

/**
 * Calculate KPI achievement percentage
 */
export function calculateAchievement(
  value: number,
  target: number,
  higherIsBetter: boolean,
): number {
  if (target === 0) return 0;

  if (higherIsBetter) {
    return (value / target) * 100;
  } else {
    return (target / value) * 100;
  }
}

/**
 * Get KPIs by category
 */
export function getKPIsByCategory(category: KPICategory): KPIDefinition[] {
  return Object.values(HEALTHCARE_KPIS).filter(
    (kpi) => kpi.category === category,
  );
}

/**
 * Calculate composite KPI score
 */
export function calculateCompositeScore(kpiValues: KPIValue[]): {
  score: number;
  breakdown: Record<string, number>;
} {
  if (kpiValues.length === 0) {
    return { score: 0, breakdown: {} };
  }

  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  kpiValues.forEach((kpiValue) => {
    const definition = HEALTHCARE_KPIS[kpiValue.kpiId];
    if (!definition || !definition.target) return;

    const achievement = calculateAchievement(
      kpiValue.value,
      definition.target,
      definition.higherIsBetter,
    );

    // Cap at 150% to prevent outliers from skewing score
    const normalizedScore = Math.min(150, achievement);
    breakdown[kpiValue.kpiId] = normalizedScore;
    totalScore += normalizedScore;
  });

  const score = totalScore / kpiValues.length;

  return { score, breakdown };
}

/**
 * Generate KPI dashboard summary
 */
export function generateKPIDashboardSummary(kpiValues: KPIValue[]): {
  totalKPIs: number;
  excellent: number;
  good: number;
  warning: number;
  critical: number;
  overallHealth: "excellent" | "good" | "warning" | "critical";
} {
  const summary = {
    totalKPIs: kpiValues.length,
    excellent: 0,
    good: 0,
    warning: 0,
    critical: 0,
    overallHealth: "good" as "excellent" | "good" | "warning" | "critical",
  };

  kpiValues.forEach((kpi) => {
    summary[kpi.performanceLevel]++;
  });

  // Determine overall health
  if (summary.critical > 0) {
    summary.overallHealth = "critical";
  } else if (summary.warning > summary.totalKPIs * 0.3) {
    summary.overallHealth = "warning";
  } else if (summary.excellent > summary.totalKPIs * 0.5) {
    summary.overallHealth = "excellent";
  } else {
    summary.overallHealth = "good";
  }

  return summary;
}

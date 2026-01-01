/**
 * Clinical KPIs
 * Quality scores, patient safety metrics, readmission rates, and mortality indices
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const ClinicalDataSchema = z.object({
  date: z.string(),
  facility: z.string().optional(),
  department: z.string().optional(),

  // Patient volume
  admissions: z.number(),
  discharges: z.number(),
  censusCount: z.number(),

  // Quality metrics
  pressureUlcers: z.number(),
  fallsWithInjury: z.number(),
  medicationErrors: z.number(),
  hospitalAcquiredInfections: z.number(),

  // Readmissions
  readmissions30Day: z.number(),
  totalDischarges: z.number(),

  // Mortality
  observedMortality: z.number(),
  expectedMortality: z.number(),

  // Patient satisfaction
  hcahpsScore: z.number().optional(),

  // Core measures
  sepsisBundleCompliance: z.number().optional(),
  strokeCareCompliance: z.number().optional(),
  miCareCompliance: z.number().optional(),
});

export type ClinicalData = z.infer<typeof ClinicalDataSchema>;

export interface ClinicalKPI {
  id: string;
  name: string;
  description: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  target?: number;
  benchmark?: number;
  status?: 'success' | 'warning' | 'danger';
  format: 'number' | 'percentage' | 'rate' | 'ratio';
  category: 'quality' | 'safety' | 'readmissions' | 'mortality' | 'satisfaction' | 'compliance';
}

// ============================================================================
// Quality Scores
// ============================================================================

/**
 * Calculate Hospital-Acquired Condition (HAC) rate
 */
export function calculateHACRate(data: ClinicalData[]): ClinicalKPI {
  const totalConditions = data.reduce(
    (sum, d) =>
      sum +
      d.pressureUlcers +
      d.fallsWithInjury +
      d.hospitalAcquiredInfections,
    0
  );
  const totalPatientDays = data.reduce((sum, d) => sum + d.censusCount, 0);

  const rate = totalPatientDays > 0 ? (totalConditions / totalPatientDays) * 1000 : 0;

  return {
    id: 'hac-rate',
    name: 'Hospital-Acquired Condition Rate',
    description: 'HACs per 1000 patient days',
    value: rate,
    target: 2.5,
    benchmark: 3.0,
    format: 'rate',
    category: 'quality',
    status: rate <= 2.5 ? 'success' : rate <= 3.5 ? 'warning' : 'danger',
  };
}

/**
 * Calculate pressure ulcer rate
 */
export function calculatePressureUlcerRate(data: ClinicalData[]): ClinicalKPI {
  const totalUlcers = data.reduce((sum, d) => sum + d.pressureUlcers, 0);
  const totalPatientDays = data.reduce((sum, d) => sum + d.censusCount, 0);

  const rate = totalPatientDays > 0 ? (totalUlcers / totalPatientDays) * 1000 : 0;

  return {
    id: 'pressure-ulcer-rate',
    name: 'Pressure Ulcer Rate',
    description: 'Hospital-acquired pressure ulcers per 1000 patient days',
    value: rate,
    target: 0.5,
    benchmark: 1.0,
    format: 'rate',
    category: 'quality',
    status: rate <= 0.5 ? 'success' : rate <= 1.0 ? 'warning' : 'danger',
  };
}

/**
 * Calculate falls with injury rate
 */
export function calculateFallsRate(data: ClinicalData[]): ClinicalKPI {
  const totalFalls = data.reduce((sum, d) => sum + d.fallsWithInjury, 0);
  const totalPatientDays = data.reduce((sum, d) => sum + d.censusCount, 0);

  const rate = totalPatientDays > 0 ? (totalFalls / totalPatientDays) * 1000 : 0;

  return {
    id: 'falls-with-injury-rate',
    name: 'Falls with Injury Rate',
    description: 'Patient falls with injury per 1000 patient days',
    value: rate,
    target: 0.3,
    benchmark: 0.5,
    format: 'rate',
    category: 'safety',
    status: rate <= 0.3 ? 'success' : rate <= 0.5 ? 'warning' : 'danger',
  };
}

/**
 * Calculate Hospital-Acquired Infection (HAI) rate
 */
export function calculateHAIRate(data: ClinicalData[]): ClinicalKPI {
  const totalInfections = data.reduce((sum, d) => sum + d.hospitalAcquiredInfections, 0);
  const totalPatientDays = data.reduce((sum, d) => sum + d.censusCount, 0);

  const rate = totalPatientDays > 0 ? (totalInfections / totalPatientDays) * 1000 : 0;

  return {
    id: 'hai-rate',
    name: 'Hospital-Acquired Infection Rate',
    description: 'HAIs per 1000 patient days',
    value: rate,
    target: 1.0,
    benchmark: 1.5,
    format: 'rate',
    category: 'safety',
    status: rate <= 1.0 ? 'success' : rate <= 1.5 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Patient Safety
// ============================================================================

/**
 * Calculate medication error rate
 */
export function calculateMedicationErrorRate(data: ClinicalData[]): ClinicalKPI {
  const totalErrors = data.reduce((sum, d) => sum + d.medicationErrors, 0);
  const totalAdmissions = data.reduce((sum, d) => sum + d.admissions, 0);

  const rate = totalAdmissions > 0 ? (totalErrors / totalAdmissions) * 100 : 0;

  return {
    id: 'medication-error-rate',
    name: 'Medication Error Rate',
    description: 'Medication errors per 100 admissions',
    value: rate,
    target: 0.5,
    benchmark: 1.0,
    format: 'rate',
    category: 'safety',
    status: rate <= 0.5 ? 'success' : rate <= 1.0 ? 'warning' : 'danger',
  };
}

/**
 * Calculate patient safety composite score
 */
export function calculatePatientSafetyScore(data: ClinicalData[]): ClinicalKPI {
  const hacRate = calculateHACRate(data);
  const fallsRate = calculateFallsRate(data);
  const haiRate = calculateHAIRate(data);
  const medErrorRate = calculateMedicationErrorRate(data);

  // Calculate composite score (0-100, higher is better)
  const scores = [
    hacRate.target ? Math.max(0, (1 - hacRate.value / (hacRate.target * 2)) * 100) : 0,
    fallsRate.target ? Math.max(0, (1 - fallsRate.value / (fallsRate.target * 2)) * 100) : 0,
    haiRate.target ? Math.max(0, (1 - haiRate.value / (haiRate.target * 2)) * 100) : 0,
    medErrorRate.target ? Math.max(0, (1 - medErrorRate.value / (medErrorRate.target * 2)) * 100) : 0,
  ];

  const compositeScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return {
    id: 'patient-safety-score',
    name: 'Patient Safety Composite Score',
    description: 'Overall patient safety performance (0-100)',
    value: Math.round(compositeScore),
    target: 85,
    format: 'number',
    category: 'safety',
    status: compositeScore >= 85 ? 'success' : compositeScore >= 70 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Readmission Rates
// ============================================================================

/**
 * Calculate 30-day readmission rate
 */
export function calculate30DayReadmissionRate(data: ClinicalData[]): ClinicalKPI {
  const totalReadmissions = data.reduce((sum, d) => sum + d.readmissions30Day, 0);
  const totalDischarges = data.reduce((sum, d) => sum + d.totalDischarges, 0);

  const rate = totalDischarges > 0 ? (totalReadmissions / totalDischarges) * 100 : 0;

  return {
    id: 'readmission-30day-rate',
    name: '30-Day Readmission Rate',
    description: 'Percentage of patients readmitted within 30 days',
    value: rate,
    target: 12,
    benchmark: 15,
    format: 'percentage',
    category: 'readmissions',
    status: rate <= 12 ? 'success' : rate <= 15 ? 'warning' : 'danger',
  };
}

/**
 * Calculate readmissions prevented
 */
export function calculateReadmissionsAvoided(
  currentData: ClinicalData[],
  baselineRate: number
): ClinicalKPI {
  const currentRate = calculate30DayReadmissionRate(currentData);
  const totalDischarges = currentData.reduce((sum, d) => sum + d.totalDischarges, 0);

  const expectedReadmissions = totalDischarges * (baselineRate / 100);
  const actualReadmissions = totalDischarges * (currentRate.value / 100);
  const avoided = Math.max(0, expectedReadmissions - actualReadmissions);

  return {
    id: 'readmissions-avoided',
    name: 'Readmissions Avoided',
    description: 'Number of readmissions prevented vs baseline',
    value: Math.round(avoided),
    format: 'number',
    category: 'readmissions',
    status: avoided > 0 ? 'success' : 'warning',
  };
}

// ============================================================================
// Mortality Indices
// ============================================================================

/**
 * Calculate observed-to-expected mortality ratio
 */
export function calculateMortalityRatio(data: ClinicalData[]): ClinicalKPI {
  const observedMortality = data.reduce((sum, d) => sum + d.observedMortality, 0);
  const expectedMortality = data.reduce((sum, d) => sum + d.expectedMortality, 0);

  const ratio = expectedMortality > 0 ? observedMortality / expectedMortality : 0;

  return {
    id: 'mortality-ratio',
    name: 'Observed-to-Expected Mortality Ratio',
    description: 'O/E mortality ratio (lower is better)',
    value: ratio,
    target: 0.9,
    benchmark: 1.0,
    format: 'ratio',
    category: 'mortality',
    status: ratio <= 0.9 ? 'success' : ratio <= 1.0 ? 'warning' : 'danger',
  };
}

/**
 * Calculate mortality rate
 */
export function calculateMortalityRate(data: ClinicalData[]): ClinicalKPI {
  const totalDeaths = data.reduce((sum, d) => sum + d.observedMortality, 0);
  const totalDischarges = data.reduce((sum, d) => sum + d.totalDischarges, 0);

  const rate = totalDischarges > 0 ? (totalDeaths / totalDischarges) * 100 : 0;

  return {
    id: 'mortality-rate',
    name: 'Mortality Rate',
    description: 'In-hospital mortality rate',
    value: rate,
    target: 2.0,
    benchmark: 2.5,
    format: 'percentage',
    category: 'mortality',
    status: rate <= 2.0 ? 'success' : rate <= 2.5 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Patient Satisfaction
// ============================================================================

/**
 * Calculate HCAHPS composite score
 */
export function calculateHCAHPSScore(data: ClinicalData[]): ClinicalKPI {
  const scores = data
    .map(d => d.hcahpsScore)
    .filter((s): s is number => s !== undefined);

  const avgScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  return {
    id: 'hcahps-score',
    name: 'HCAHPS Composite Score',
    description: 'Hospital Consumer Assessment of Healthcare Providers and Systems',
    value: avgScore,
    target: 75,
    benchmark: 70,
    format: 'percentage',
    category: 'satisfaction',
    status: avgScore >= 75 ? 'success' : avgScore >= 70 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Core Measures Compliance
// ============================================================================

/**
 * Calculate sepsis bundle compliance
 */
export function calculateSepsisCompliance(data: ClinicalData[]): ClinicalKPI {
  const scores = data
    .map(d => d.sepsisBundleCompliance)
    .filter((s): s is number => s !== undefined);

  const avgCompliance = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  return {
    id: 'sepsis-bundle-compliance',
    name: 'Sepsis Bundle Compliance',
    description: '3-hour sepsis bundle compliance rate',
    value: avgCompliance,
    target: 90,
    benchmark: 85,
    format: 'percentage',
    category: 'compliance',
    status: avgCompliance >= 90 ? 'success' : avgCompliance >= 85 ? 'warning' : 'danger',
  };
}

/**
 * Calculate stroke care compliance
 */
export function calculateStrokeCompliance(data: ClinicalData[]): ClinicalKPI {
  const scores = data
    .map(d => d.strokeCareCompliance)
    .filter((s): s is number => s !== undefined);

  const avgCompliance = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  return {
    id: 'stroke-care-compliance',
    name: 'Stroke Care Compliance',
    description: 'Door-to-needle time compliance',
    value: avgCompliance,
    target: 85,
    benchmark: 80,
    format: 'percentage',
    category: 'compliance',
    status: avgCompliance >= 85 ? 'success' : avgCompliance >= 80 ? 'warning' : 'danger',
  };
}

/**
 * Calculate MI care compliance
 */
export function calculateMICompliance(data: ClinicalData[]): ClinicalKPI {
  const scores = data
    .map(d => d.miCareCompliance)
    .filter((s): s is number => s !== undefined);

  const avgCompliance = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  return {
    id: 'mi-care-compliance',
    name: 'MI Care Compliance',
    description: 'Myocardial infarction care bundle compliance',
    value: avgCompliance,
    target: 95,
    benchmark: 90,
    format: 'percentage',
    category: 'compliance',
    status: avgCompliance >= 95 ? 'success' : avgCompliance >= 90 ? 'warning' : 'danger',
  };
}

/**
 * Calculate core measures composite
 */
export function calculateCoreMeasuresComposite(data: ClinicalData[]): ClinicalKPI {
  const sepsis = calculateSepsisCompliance(data);
  const stroke = calculateStrokeCompliance(data);
  const mi = calculateMICompliance(data);

  const composite = (sepsis.value + stroke.value + mi.value) / 3;

  return {
    id: 'core-measures-composite',
    name: 'Core Measures Composite',
    description: 'Average of all core measure compliance rates',
    value: composite,
    target: 90,
    benchmark: 85,
    format: 'percentage',
    category: 'compliance',
    status: composite >= 90 ? 'success' : composite >= 85 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Comprehensive Dashboard Data
// ============================================================================

/**
 * Calculate all clinical KPIs
 */
export function calculateAllClinicalKPIs(data: ClinicalData[]): ClinicalKPI[] {
  const kpis: ClinicalKPI[] = [];

  // Quality metrics
  kpis.push(calculateHACRate(data));
  kpis.push(calculatePressureUlcerRate(data));

  // Safety metrics
  kpis.push(calculateFallsRate(data));
  kpis.push(calculateHAIRate(data));
  kpis.push(calculateMedicationErrorRate(data));
  kpis.push(calculatePatientSafetyScore(data));

  // Readmissions
  kpis.push(calculate30DayReadmissionRate(data));

  // Mortality
  kpis.push(calculateMortalityRatio(data));
  kpis.push(calculateMortalityRate(data));

  // Patient satisfaction
  kpis.push(calculateHCAHPSScore(data));

  // Core measures
  kpis.push(calculateSepsisCompliance(data));
  kpis.push(calculateStrokeCompliance(data));
  kpis.push(calculateMICompliance(data));
  kpis.push(calculateCoreMeasuresComposite(data));

  return kpis;
}

/**
 * Get clinical trends over time
 */
export function getClinicalTrends(
  data: ClinicalData[],
  groupBy: 'day' | 'week' | 'month'
): Array<{
  period: string;
  hacRate: number;
  readmissionRate: number;
  mortalityRatio: number;
  hcahpsScore: number;
}> {
  // Group data by period
  const grouped = new Map<string, ClinicalData[]>();

  data.forEach(d => {
    const period = formatPeriod(d.date, groupBy);
    if (!grouped.has(period)) {
      grouped.set(period, []);
    }
    grouped.get(period)!.push(d);
  });

  // Calculate metrics for each period
  return Array.from(grouped.entries())
    .map(([period, periodData]) => ({
      period,
      hacRate: calculateHACRate(periodData).value,
      readmissionRate: calculate30DayReadmissionRate(periodData).value,
      mortalityRatio: calculateMortalityRatio(periodData).value,
      hcahpsScore: calculateHCAHPSScore(periodData).value,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPeriod(date: string, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);

  switch (groupBy) {
    case 'day':
      return date;
    case 'week':
      const week = Math.floor(d.getDate() / 7);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-W${week}`;
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      return date;
  }
}

/**
 * Operational KPIs
 * Throughput metrics, wait times, capacity utilization, and staffing ratios
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const OperationalDataSchema = z.object({
  date: z.string(),
  facility: z.string().optional(),
  department: z.string().optional(),

  // Throughput
  edVisits: z.number(),
  admissions: z.number(),
  discharges: z.number(),
  transfers: z.number(),
  surgeries: z.number(),
  outpatientVisits: z.number(),

  // Wait times (in minutes)
  edWaitTime: z.number(),
  edLengthOfStay: z.number(),
  surgeryWaitTime: z.number(),
  appointmentWaitTime: z.number(),

  // Capacity
  licensedBeds: z.number(),
  staffedBeds: z.number(),
  occupiedBeds: z.number(),
  availableBeds: z.number(),
  erCapacity: z.number(),
  erOccupancy: z.number(),

  // Staffing
  nursesScheduled: z.number(),
  nursesWorked: z.number(),
  patientDays: z.number(),
  nursingHours: z.number(),

  // Efficiency
  avgLengthOfStay: z.number(),
  turnoverTime: z.number(), // OR turnover time
  dischargeBy11AM: z.number(),
});

export type OperationalData = z.infer<typeof OperationalDataSchema>;

export interface OperationalKPI {
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
  format: 'number' | 'percentage' | 'minutes' | 'hours' | 'ratio';
  category: 'throughput' | 'wait-times' | 'capacity' | 'staffing' | 'efficiency';
}

// ============================================================================
// Throughput Metrics
// ============================================================================

/**
 * Calculate ED throughput
 */
export function calculateEDThroughput(data: OperationalData[]): OperationalKPI {
  const totalVisits = data.reduce((sum, d) => sum + d.edVisits, 0);
  const days = data.length;

  const avgDailyVisits = days > 0 ? totalVisits / days : 0;

  return {
    id: 'ed-throughput',
    name: 'ED Daily Volume',
    description: 'Average daily emergency department visits',
    value: Math.round(avgDailyVisits),
    format: 'number',
    category: 'throughput',
  };
}

/**
 * Calculate admission rate
 */
export function calculateAdmissionRate(data: OperationalData[]): OperationalKPI {
  const totalAdmissions = data.reduce((sum, d) => sum + d.admissions, 0);
  const totalEDVisits = data.reduce((sum, d) => sum + d.edVisits, 0);

  const rate = totalEDVisits > 0 ? (totalAdmissions / totalEDVisits) * 100 : 0;

  return {
    id: 'ed-admission-rate',
    name: 'ED Admission Rate',
    description: 'Percentage of ED visits resulting in admission',
    value: rate,
    target: 15,
    benchmark: 18,
    format: 'percentage',
    category: 'throughput',
    status: rate <= 18 ? 'success' : rate <= 22 ? 'warning' : 'danger',
  };
}

/**
 * Calculate surgical volume
 */
export function calculateSurgicalVolume(data: OperationalData[]): OperationalKPI {
  const totalSurgeries = data.reduce((sum, d) => sum + d.surgeries, 0);
  const days = data.length;

  const avgDailySurgeries = days > 0 ? totalSurgeries / days : 0;

  return {
    id: 'surgical-volume',
    name: 'Daily Surgical Volume',
    description: 'Average daily surgical procedures',
    value: Math.round(avgDailySurgeries),
    format: 'number',
    category: 'throughput',
  };
}

/**
 * Calculate outpatient volume
 */
export function calculateOutpatientVolume(data: OperationalData[]): OperationalKPI {
  const totalVisits = data.reduce((sum, d) => sum + d.outpatientVisits, 0);
  const days = data.length;

  const avgDailyVisits = days > 0 ? totalVisits / days : 0;

  return {
    id: 'outpatient-volume',
    name: 'Daily Outpatient Volume',
    description: 'Average daily outpatient visits',
    value: Math.round(avgDailyVisits),
    format: 'number',
    category: 'throughput',
  };
}

// ============================================================================
// Wait Times
// ============================================================================

/**
 * Calculate average ED wait time
 */
export function calculateEDWaitTime(data: OperationalData[]): OperationalKPI {
  const totalWaitTime = data.reduce((sum, d) => sum + d.edWaitTime, 0);
  const count = data.length;

  const avgWaitTime = count > 0 ? totalWaitTime / count : 0;

  return {
    id: 'ed-wait-time',
    name: 'ED Wait Time',
    description: 'Average time from arrival to provider',
    value: Math.round(avgWaitTime),
    target: 30,
    benchmark: 45,
    format: 'minutes',
    category: 'wait-times',
    status: avgWaitTime <= 30 ? 'success' : avgWaitTime <= 45 ? 'warning' : 'danger',
  };
}

/**
 * Calculate ED length of stay
 */
export function calculateEDLengthOfStay(data: OperationalData[]): OperationalKPI {
  const totalLOS = data.reduce((sum, d) => sum + d.edLengthOfStay, 0);
  const count = data.length;

  const avgLOS = count > 0 ? totalLOS / count : 0;

  return {
    id: 'ed-length-of-stay',
    name: 'ED Length of Stay',
    description: 'Average time from arrival to departure',
    value: Math.round(avgLOS),
    target: 180,
    benchmark: 240,
    format: 'minutes',
    category: 'wait-times',
    status: avgLOS <= 180 ? 'success' : avgLOS <= 240 ? 'warning' : 'danger',
  };
}

/**
 * Calculate left without being seen rate
 */
export function calculateLWBSRate(
  edVisits: number,
  lwbsCount: number
): OperationalKPI {
  const rate = edVisits > 0 ? (lwbsCount / edVisits) * 100 : 0;

  return {
    id: 'lwbs-rate',
    name: 'Left Without Being Seen Rate',
    description: 'Percentage of patients who left before treatment',
    value: rate,
    target: 2,
    benchmark: 3,
    format: 'percentage',
    category: 'wait-times',
    status: rate <= 2 ? 'success' : rate <= 3 ? 'warning' : 'danger',
  };
}

/**
 * Calculate surgery wait time
 */
export function calculateSurgeryWaitTime(data: OperationalData[]): OperationalKPI {
  const totalWaitTime = data.reduce((sum, d) => sum + d.surgeryWaitTime, 0);
  const count = data.filter(d => d.surgeryWaitTime > 0).length;

  const avgWaitTime = count > 0 ? totalWaitTime / count : 0;

  // Convert minutes to days
  const avgWaitDays = avgWaitTime / (24 * 60);

  return {
    id: 'surgery-wait-time',
    name: 'Surgery Wait Time',
    description: 'Average days from scheduling to procedure',
    value: Math.round(avgWaitDays),
    target: 14,
    benchmark: 21,
    format: 'number',
    category: 'wait-times',
    status: avgWaitDays <= 14 ? 'success' : avgWaitDays <= 21 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Capacity Utilization
// ============================================================================

/**
 * Calculate bed occupancy rate
 */
export function calculateBedOccupancy(data: OperationalData[]): OperationalKPI {
  const totalOccupied = data.reduce((sum, d) => sum + d.occupiedBeds, 0);
  const totalStaffed = data.reduce((sum, d) => sum + d.staffedBeds, 0);

  const occupancyRate = totalStaffed > 0 ? (totalOccupied / totalStaffed) * 100 : 0;

  return {
    id: 'bed-occupancy',
    name: 'Bed Occupancy Rate',
    description: 'Percentage of staffed beds occupied',
    value: occupancyRate,
    target: 85,
    benchmark: 80,
    format: 'percentage',
    category: 'capacity',
    status: occupancyRate >= 75 && occupancyRate <= 90 ? 'success' : occupancyRate > 95 ? 'danger' : 'warning',
  };
}

/**
 * Calculate ED capacity utilization
 */
export function calculateEDCapacity(data: OperationalData[]): OperationalKPI {
  const totalOccupancy = data.reduce((sum, d) => sum + d.erOccupancy, 0);
  const totalCapacity = data.reduce((sum, d) => sum + d.erCapacity, 0);

  const utilizationRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  return {
    id: 'ed-capacity',
    name: 'ED Capacity Utilization',
    description: 'Percentage of ED capacity in use',
    value: utilizationRate,
    target: 80,
    benchmark: 75,
    format: 'percentage',
    category: 'capacity',
    status: utilizationRate >= 70 && utilizationRate <= 85 ? 'success' : utilizationRate > 95 ? 'danger' : 'warning',
  };
}

/**
 * Calculate bed turnover rate
 */
export function calculateBedTurnover(data: OperationalData[]): OperationalKPI {
  const totalDischarges = data.reduce((sum, d) => sum + d.discharges, 0);
  const avgStaffedBeds = data.reduce((sum, d) => sum + d.staffedBeds, 0) / data.length;
  const days = data.length;

  const turnoverRate = avgStaffedBeds > 0 && days > 0
    ? totalDischarges / avgStaffedBeds / days * 365
    : 0;

  return {
    id: 'bed-turnover',
    name: 'Annual Bed Turnover Rate',
    description: 'Number of patients per bed per year',
    value: Math.round(turnoverRate),
    target: 50,
    benchmark: 45,
    format: 'number',
    category: 'capacity',
  };
}

// ============================================================================
// Staffing Ratios
// ============================================================================

/**
 * Calculate nurse-to-patient ratio
 */
export function calculateNursePatientRatio(data: OperationalData[]): OperationalKPI {
  const totalNurses = data.reduce((sum, d) => sum + d.nursesWorked, 0);
  const totalPatients = data.reduce((sum, d) => sum + d.occupiedBeds, 0);

  const ratio = totalNurses > 0 ? totalPatients / totalNurses : 0;

  return {
    id: 'nurse-patient-ratio',
    name: 'Nurse-to-Patient Ratio',
    description: 'Average patients per nurse',
    value: ratio,
    target: 5,
    benchmark: 6,
    format: 'ratio',
    category: 'staffing',
    status: ratio <= 5 ? 'success' : ratio <= 6 ? 'warning' : 'danger',
  };
}

/**
 * Calculate nursing hours per patient day (HPPD)
 */
export function calculateNursingHPPD(data: OperationalData[]): OperationalKPI {
  const totalNursingHours = data.reduce((sum, d) => sum + d.nursingHours, 0);
  const totalPatientDays = data.reduce((sum, d) => sum + d.patientDays, 0);

  const hppd = totalPatientDays > 0 ? totalNursingHours / totalPatientDays : 0;

  return {
    id: 'nursing-hppd',
    name: 'Nursing Hours Per Patient Day',
    description: 'Direct nursing care hours per patient day',
    value: hppd,
    target: 8,
    benchmark: 7,
    format: 'hours',
    category: 'staffing',
    status: hppd >= 8 ? 'success' : hppd >= 7 ? 'warning' : 'danger',
  };
}

/**
 * Calculate nurse utilization rate
 */
export function calculateNurseUtilization(data: OperationalData[]): OperationalKPI {
  const totalWorked = data.reduce((sum, d) => sum + d.nursesWorked, 0);
  const totalScheduled = data.reduce((sum, d) => sum + d.nursesScheduled, 0);

  const utilizationRate = totalScheduled > 0 ? (totalWorked / totalScheduled) * 100 : 0;

  return {
    id: 'nurse-utilization',
    name: 'Nurse Utilization Rate',
    description: 'Percentage of scheduled nurses who worked',
    value: utilizationRate,
    target: 95,
    benchmark: 90,
    format: 'percentage',
    category: 'staffing',
    status: utilizationRate >= 95 ? 'success' : utilizationRate >= 90 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Efficiency Metrics
// ============================================================================

/**
 * Calculate average length of stay
 */
export function calculateAvgLengthOfStay(data: OperationalData[]): OperationalKPI {
  const totalLOS = data.reduce((sum, d) => sum + d.avgLengthOfStay, 0);
  const count = data.length;

  const avgLOS = count > 0 ? totalLOS / count : 0;

  return {
    id: 'avg-length-of-stay',
    name: 'Average Length of Stay',
    description: 'Average days from admission to discharge',
    value: avgLOS,
    target: 4.5,
    benchmark: 5.0,
    format: 'number',
    category: 'efficiency',
    status: avgLOS <= 4.5 ? 'success' : avgLOS <= 5.0 ? 'warning' : 'danger',
  };
}

/**
 * Calculate OR turnover time
 */
export function calculateORTurnover(data: OperationalData[]): OperationalKPI {
  const totalTurnover = data.reduce((sum, d) => sum + d.turnoverTime, 0);
  const count = data.filter(d => d.turnoverTime > 0).length;

  const avgTurnover = count > 0 ? totalTurnover / count : 0;

  return {
    id: 'or-turnover-time',
    name: 'OR Turnover Time',
    description: 'Average minutes between surgical cases',
    value: Math.round(avgTurnover),
    target: 30,
    benchmark: 45,
    format: 'minutes',
    category: 'efficiency',
    status: avgTurnover <= 30 ? 'success' : avgTurnover <= 45 ? 'warning' : 'danger',
  };
}

/**
 * Calculate early discharge rate
 */
export function calculateEarlyDischargeRate(data: OperationalData[]): OperationalKPI {
  const totalEarlyDischarges = data.reduce((sum, d) => sum + d.dischargeBy11AM, 0);
  const totalDischarges = data.reduce((sum, d) => sum + d.discharges, 0);

  const rate = totalDischarges > 0 ? (totalEarlyDischarges / totalDischarges) * 100 : 0;

  return {
    id: 'early-discharge-rate',
    name: 'Early Discharge Rate',
    description: 'Percentage of discharges before 11 AM',
    value: rate,
    target: 30,
    benchmark: 25,
    format: 'percentage',
    category: 'efficiency',
    status: rate >= 30 ? 'success' : rate >= 25 ? 'warning' : 'danger',
  };
}

/**
 * Calculate case mix index
 */
export function calculateCaseMixIndex(
  totalDRGWeight: number,
  totalDischarges: number
): OperationalKPI {
  const cmi = totalDischarges > 0 ? totalDRGWeight / totalDischarges : 0;

  return {
    id: 'case-mix-index',
    name: 'Case Mix Index',
    description: 'Average complexity of cases treated',
    value: cmi,
    benchmark: 1.4,
    format: 'ratio',
    category: 'efficiency',
  };
}

// ============================================================================
// Comprehensive Dashboard Data
// ============================================================================

/**
 * Calculate all operational KPIs
 */
export function calculateAllOperationalKPIs(data: OperationalData[]): OperationalKPI[] {
  const kpis: OperationalKPI[] = [];

  // Throughput
  kpis.push(calculateEDThroughput(data));
  kpis.push(calculateAdmissionRate(data));
  kpis.push(calculateSurgicalVolume(data));
  kpis.push(calculateOutpatientVolume(data));

  // Wait times
  kpis.push(calculateEDWaitTime(data));
  kpis.push(calculateEDLengthOfStay(data));
  kpis.push(calculateSurgeryWaitTime(data));

  // Capacity
  kpis.push(calculateBedOccupancy(data));
  kpis.push(calculateEDCapacity(data));
  kpis.push(calculateBedTurnover(data));

  // Staffing
  kpis.push(calculateNursePatientRatio(data));
  kpis.push(calculateNursingHPPD(data));
  kpis.push(calculateNurseUtilization(data));

  // Efficiency
  kpis.push(calculateAvgLengthOfStay(data));
  kpis.push(calculateORTurnover(data));
  kpis.push(calculateEarlyDischargeRate(data));

  return kpis;
}

/**
 * Get operational trends over time
 */
export function getOperationalTrends(
  data: OperationalData[],
  groupBy: 'day' | 'week' | 'month'
): Array<{
  period: string;
  edVisits: number;
  bedOccupancy: number;
  edWaitTime: number;
  avgLOS: number;
}> {
  // Group data by period
  const grouped = new Map<string, OperationalData[]>();

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
      edVisits: calculateEDThroughput(periodData).value,
      bedOccupancy: calculateBedOccupancy(periodData).value,
      edWaitTime: calculateEDWaitTime(periodData).value,
      avgLOS: calculateAvgLengthOfStay(periodData).value,
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

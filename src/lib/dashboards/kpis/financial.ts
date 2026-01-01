/**
 * Financial KPIs
 * Revenue metrics, collection rates, days in AR, payer mix, and financial performance indicators
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const FinancialDataSchema = z.object({
  revenue: z.number(),
  collections: z.number(),
  charges: z.number(),
  adjustments: z.number(),
  writeOffs: z.number(),
  ar: z.number(), // Accounts receivable
  daysInAR: z.number(),
  payerMix: z.record(z.number()),
  date: z.string(),
  facility: z.string().optional(),
  department: z.string().optional(),
});

export type FinancialData = z.infer<typeof FinancialDataSchema>;

export interface FinancialKPI {
  id: string;
  name: string;
  description: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  target?: number;
  status?: 'success' | 'warning' | 'danger';
  format: 'currency' | 'percentage' | 'number' | 'days';
  category: 'revenue' | 'collections' | 'ar' | 'efficiency' | 'payer';
}

// ============================================================================
// Revenue Metrics
// ============================================================================

/**
 * Calculate total net revenue
 */
export function calculateNetRevenue(data: FinancialData[]): FinancialKPI {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalAdjustments = data.reduce((sum, d) => sum + d.adjustments, 0);
  const totalWriteOffs = data.reduce((sum, d) => sum + d.writeOffs, 0);

  const netRevenue = totalRevenue - totalAdjustments - totalWriteOffs;

  return {
    id: 'net-revenue',
    name: 'Net Revenue',
    description: 'Total revenue after adjustments and write-offs',
    value: netRevenue,
    format: 'currency',
    category: 'revenue',
  };
}

/**
 * Calculate revenue per day
 */
export function calculateRevenuePerDay(data: FinancialData[]): FinancialKPI {
  const uniqueDays = new Set(data.map(d => d.date)).size;
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const revenuePerDay = uniqueDays > 0 ? totalRevenue / uniqueDays : 0;

  return {
    id: 'revenue-per-day',
    name: 'Revenue Per Day',
    description: 'Average daily revenue',
    value: revenuePerDay,
    format: 'currency',
    category: 'revenue',
  };
}

/**
 * Calculate revenue growth
 */
export function calculateRevenueGrowth(
  currentPeriod: FinancialData[],
  previousPeriod: FinancialData[]
): FinancialKPI {
  const currentRevenue = currentPeriod.reduce((sum, d) => sum + d.revenue, 0);
  const previousRevenue = previousPeriod.reduce((sum, d) => sum + d.revenue, 0);

  const growth = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  return {
    id: 'revenue-growth',
    name: 'Revenue Growth',
    description: 'Period-over-period revenue growth',
    value: growth,
    previousValue: 0,
    trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable',
    trendPercentage: Math.abs(growth),
    format: 'percentage',
    category: 'revenue',
    status: growth > 0 ? 'success' : growth < -5 ? 'danger' : 'warning',
  };
}

/**
 * Calculate gross collection rate
 */
export function calculateGrossCollectionRate(data: FinancialData[]): FinancialKPI {
  const totalCollections = data.reduce((sum, d) => sum + d.collections, 0);
  const totalCharges = data.reduce((sum, d) => sum + d.charges, 0);

  const rate = totalCharges > 0 ? (totalCollections / totalCharges) * 100 : 0;

  return {
    id: 'gross-collection-rate',
    name: 'Gross Collection Rate',
    description: 'Collections as percentage of charges',
    value: rate,
    target: 95,
    format: 'percentage',
    category: 'collections',
    status: rate >= 95 ? 'success' : rate >= 85 ? 'warning' : 'danger',
  };
}

/**
 * Calculate net collection rate
 */
export function calculateNetCollectionRate(data: FinancialData[]): FinancialKPI {
  const totalCollections = data.reduce((sum, d) => sum + d.collections, 0);
  const totalCharges = data.reduce((sum, d) => sum + d.charges, 0);
  const totalAdjustments = data.reduce((sum, d) => sum + d.adjustments, 0);

  const expectedCollections = totalCharges - totalAdjustments;
  const rate = expectedCollections > 0 ? (totalCollections / expectedCollections) * 100 : 0;

  return {
    id: 'net-collection-rate',
    name: 'Net Collection Rate',
    description: 'Collections as percentage of expected (charges minus adjustments)',
    value: rate,
    target: 98,
    format: 'percentage',
    category: 'collections',
    status: rate >= 98 ? 'success' : rate >= 90 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Days in AR
// ============================================================================

/**
 * Calculate average days in AR
 */
export function calculateDaysInAR(data: FinancialData[]): FinancialKPI {
  const totalAR = data.reduce((sum, d) => sum + d.ar, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const days = data.length;

  const averageDailyRevenue = days > 0 ? totalRevenue / days : 0;
  const daysInAR = averageDailyRevenue > 0 ? totalAR / averageDailyRevenue : 0;

  return {
    id: 'days-in-ar',
    name: 'Days in AR',
    description: 'Average days in accounts receivable',
    value: Math.round(daysInAR),
    target: 45,
    format: 'days',
    category: 'ar',
    status: daysInAR <= 45 ? 'success' : daysInAR <= 60 ? 'warning' : 'danger',
  };
}

/**
 * Calculate AR aging buckets
 */
export function calculateARAgingBuckets(data: FinancialData[]): {
  buckets: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  kpi: FinancialKPI;
} {
  const totalAR = data.reduce((sum, d) => sum + d.ar, 0);

  // This is simplified - in reality would calculate from actual aging data
  const buckets = [
    { name: '0-30 days', amount: totalAR * 0.5, percentage: 50 },
    { name: '31-60 days', amount: totalAR * 0.25, percentage: 25 },
    { name: '61-90 days', amount: totalAR * 0.15, percentage: 15 },
    { name: '91+ days', amount: totalAR * 0.1, percentage: 10 },
  ];

  const over90Days = buckets[3].percentage;

  return {
    buckets,
    kpi: {
      id: 'ar-over-90',
      name: 'AR Over 90 Days',
      description: 'Percentage of AR over 90 days old',
      value: over90Days,
      target: 15,
      format: 'percentage',
      category: 'ar',
      status: over90Days <= 15 ? 'success' : over90Days <= 25 ? 'warning' : 'danger',
    },
  };
}

// ============================================================================
// Payer Mix Analysis
// ============================================================================

/**
 * Calculate payer mix distribution
 */
export function calculatePayerMix(data: FinancialData[]): {
  distribution: Array<{
    payer: string;
    amount: number;
    percentage: number;
  }>;
  kpi: FinancialKPI;
} {
  const payerTotals = new Map<string, number>();
  let totalRevenue = 0;

  data.forEach(d => {
    Object.entries(d.payerMix).forEach(([payer, amount]) => {
      payerTotals.set(payer, (payerTotals.get(payer) || 0) + amount);
      totalRevenue += amount;
    });
  });

  const distribution = Array.from(payerTotals.entries())
    .map(([payer, amount]) => ({
      payer,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate commercial insurance percentage
  const commercialPayers = ['Blue Cross', 'Aetna', 'UnitedHealthcare', 'Cigna'];
  const commercialPercentage = distribution
    .filter(d => commercialPayers.includes(d.payer))
    .reduce((sum, d) => sum + d.percentage, 0);

  return {
    distribution,
    kpi: {
      id: 'commercial-payer-mix',
      name: 'Commercial Payer Mix',
      description: 'Percentage of revenue from commercial payers',
      value: commercialPercentage,
      target: 40,
      format: 'percentage',
      category: 'payer',
      status: commercialPercentage >= 40 ? 'success' : commercialPercentage >= 30 ? 'warning' : 'danger',
    },
  };
}

/**
 * Calculate payer-specific collection rate
 */
export function calculatePayerCollectionRate(
  data: FinancialData[],
  payer: string
): FinancialKPI {
  // Simplified - would need actual payer-specific collection data
  const payerRevenue = data.reduce(
    (sum, d) => sum + (d.payerMix[payer] || 0),
    0
  );

  // Estimate collection rate (would be from actual data)
  const estimatedRate = 95;

  return {
    id: `collection-rate-${payer.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${payer} Collection Rate`,
    description: `Collection rate for ${payer}`,
    value: estimatedRate,
    target: 95,
    format: 'percentage',
    category: 'collections',
  };
}

// ============================================================================
// Efficiency Metrics
// ============================================================================

/**
 * Calculate cost-to-collect ratio
 */
export function calculateCostToCollect(
  collectionCosts: number,
  collectionsAmount: number
): FinancialKPI {
  const ratio = collectionsAmount > 0
    ? (collectionCosts / collectionsAmount) * 100
    : 0;

  return {
    id: 'cost-to-collect',
    name: 'Cost to Collect',
    description: 'Collection costs as percentage of collections',
    value: ratio,
    target: 3,
    format: 'percentage',
    category: 'efficiency',
    status: ratio <= 3 ? 'success' : ratio <= 5 ? 'warning' : 'danger',
  };
}

/**
 * Calculate denial rate
 */
export function calculateDenialRate(
  denials: number,
  totalClaims: number
): FinancialKPI {
  const rate = totalClaims > 0 ? (denials / totalClaims) * 100 : 0;

  return {
    id: 'denial-rate',
    name: 'Denial Rate',
    description: 'Percentage of claims denied',
    value: rate,
    target: 5,
    format: 'percentage',
    category: 'efficiency',
    status: rate <= 5 ? 'success' : rate <= 10 ? 'warning' : 'danger',
  };
}

/**
 * Calculate clean claim rate
 */
export function calculateCleanClaimRate(
  cleanClaims: number,
  totalClaims: number
): FinancialKPI {
  const rate = totalClaims > 0 ? (cleanClaims / totalClaims) * 100 : 0;

  return {
    id: 'clean-claim-rate',
    name: 'Clean Claim Rate',
    description: 'Percentage of claims submitted without errors',
    value: rate,
    target: 95,
    format: 'percentage',
    category: 'efficiency',
    status: rate >= 95 ? 'success' : rate >= 85 ? 'warning' : 'danger',
  };
}

// ============================================================================
// Comprehensive Dashboard Data
// ============================================================================

/**
 * Calculate all financial KPIs
 */
export function calculateAllFinancialKPIs(
  currentPeriod: FinancialData[],
  previousPeriod?: FinancialData[]
): FinancialKPI[] {
  const kpis: FinancialKPI[] = [];

  // Revenue metrics
  kpis.push(calculateNetRevenue(currentPeriod));
  kpis.push(calculateRevenuePerDay(currentPeriod));

  if (previousPeriod) {
    kpis.push(calculateRevenueGrowth(currentPeriod, previousPeriod));
  }

  // Collection metrics
  kpis.push(calculateGrossCollectionRate(currentPeriod));
  kpis.push(calculateNetCollectionRate(currentPeriod));

  // AR metrics
  kpis.push(calculateDaysInAR(currentPeriod));
  kpis.push(calculateARAgingBuckets(currentPeriod).kpi);

  // Payer mix
  kpis.push(calculatePayerMix(currentPeriod).kpi);

  return kpis;
}

/**
 * Get financial trends over time
 */
export function getFinancialTrends(
  data: FinancialData[],
  groupBy: 'day' | 'week' | 'month'
): Array<{
  period: string;
  revenue: number;
  collections: number;
  ar: number;
  daysInAR: number;
}> {
  // Group data by period
  const grouped = new Map<string, FinancialData[]>();

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
      revenue: periodData.reduce((sum, d) => sum + d.revenue, 0),
      collections: periodData.reduce((sum, d) => sum + d.collections, 0),
      ar: periodData.reduce((sum, d) => sum + d.ar, 0),
      daysInAR: calculateDaysInAR(periodData).value,
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

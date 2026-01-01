/**
 * Data Aggregation Utilities
 * Time-series aggregations, dimension rollups, metric calculations, and moving averages
 */

export interface DataPoint {
  timestamp: Date | string;
  value: number;
  [key: string]: any;
}

export interface AggregationConfig {
  period: "hour" | "day" | "week" | "month" | "quarter" | "year";
  aggregationType: "sum" | "avg" | "min" | "max" | "count";
  groupBy?: string[];
}

export interface TimeSeriesResult {
  period: string;
  value: number;
  count: number;
  min?: number;
  max?: number;
  metadata?: Record<string, any>;
}

export interface DimensionRollup {
  dimension: string;
  value: string;
  metrics: Record<string, number>;
  count: number;
}

/**
 * Aggregate time-series data by period
 */
export function aggregateTimeSeries(
  data: DataPoint[],
  config: AggregationConfig,
): TimeSeriesResult[] {
  const { period, aggregationType } = config;
  const grouped = new Map<string, DataPoint[]>();

  // Group data by period
  data.forEach((point) => {
    const periodKey = getPeriodKey(
      typeof point.timestamp === "string"
        ? new Date(point.timestamp)
        : point.timestamp,
      period,
    );

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, []);
    }
    grouped.get(periodKey)!.push(point);
  });

  // Aggregate each period
  const results: TimeSeriesResult[] = [];

  for (const [periodKey, points] of grouped.entries()) {
    const values = points.map((p) => p.value);

    let aggregatedValue: number;
    switch (aggregationType) {
      case "sum":
        aggregatedValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case "avg":
        aggregatedValue =
          values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case "min":
        aggregatedValue = Math.min(...values);
        break;
      case "max":
        aggregatedValue = Math.max(...values);
        break;
      case "count":
        aggregatedValue = values.length;
        break;
      default:
        aggregatedValue = 0;
    }

    results.push({
      period: periodKey,
      value: aggregatedValue,
      count: points.length,
      min: Math.min(...values),
      max: Math.max(...values),
    });
  }

  // Sort by period
  return results.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get period key for grouping
 */
function getPeriodKey(date: Date, period: AggregationConfig["period"]): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");

  switch (period) {
    case "hour":
      return `${year}-${month}-${day} ${hour}:00`;
    case "day":
      return `${year}-${month}-${day}`;
    case "week":
      return getWeekKey(date);
    case "month":
      return `${year}-${month}`;
    case "quarter":
      return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    case "year":
      return String(year);
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get ISO week key
 */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Perform dimension rollups
 */
export function rollupByDimension<T extends Record<string, any>>(
  data: T[],
  dimension: string,
  metrics: string[],
): DimensionRollup[] {
  const grouped = new Map<string, T[]>();

  // Group by dimension
  data.forEach((item) => {
    const dimensionValue = String(item[dimension] || "Unknown");
    if (!grouped.has(dimensionValue)) {
      grouped.set(dimensionValue, []);
    }
    grouped.get(dimensionValue)!.push(item);
  });

  // Calculate metrics for each group
  const rollups: DimensionRollup[] = [];

  for (const [dimensionValue, items] of grouped.entries()) {
    const metricsResult: Record<string, number> = {};

    metrics.forEach((metric) => {
      const values = items.map((item) => Number(item[metric]) || 0);
      metricsResult[metric] = values.reduce((sum, val) => sum + val, 0);
      metricsResult[`${metric}_avg`] = metricsResult[metric] / values.length;
      metricsResult[`${metric}_min`] = Math.min(...values);
      metricsResult[`${metric}_max`] = Math.max(...values);
    });

    rollups.push({
      dimension,
      value: dimensionValue,
      metrics: metricsResult,
      count: items.length,
    });
  }

  return rollups.sort((a, b) => b.count - a.count);
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: DataPoint[],
  windowSize: number,
): DataPoint[] {
  if (data.length < windowSize) {
    return data;
  }

  const results: DataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      results.push({ ...data[i], movingAverage: data[i].value });
      continue;
    }

    const windowData = data.slice(i - windowSize + 1, i + 1);
    const sum = windowData.reduce((acc, point) => acc + point.value, 0);
    const avg = sum / windowSize;

    results.push({
      ...data[i],
      movingAverage: avg,
    });
  }

  return results;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMovingAverage(
  data: DataPoint[],
  smoothingFactor: number = 0.3,
): DataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const results: DataPoint[] = [];
  let ema = data[0].value;

  data.forEach((point, index) => {
    if (index === 0) {
      results.push({ ...point, ema });
    } else {
      ema = smoothingFactor * point.value + (1 - smoothingFactor) * ema;
      results.push({ ...point, ema });
    }
  });

  return results;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate compound growth rate
 */
export function calculateCompoundGrowthRate(
  startValue: number,
  endValue: number,
  periods: number,
): number {
  if (startValue <= 0 || periods <= 0) {
    return 0;
  }
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

/**
 * Calculate percentiles
 */
export function calculatePercentiles(
  values: number[],
  percentiles: number[] = [25, 50, 75, 90, 95, 99],
): Record<number, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const result: Record<number, number> = {};

  percentiles.forEach((p) => {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    result[p] = sorted[Math.max(0, index)];
  });

  return result;
}

/**
 * Calculate running total
 */
export function calculateRunningTotal(data: DataPoint[]): DataPoint[] {
  let runningTotal = 0;

  return data.map((point) => {
    runningTotal += point.value;
    return {
      ...point,
      runningTotal,
    };
  });
}

/**
 * Calculate year-over-year comparison
 */
export function calculateYoYComparison(
  currentPeriod: DataPoint[],
  previousPeriod: DataPoint[],
): {
  current: number;
  previous: number;
  change: number;
  percentChange: number;
} {
  const currentTotal = currentPeriod.reduce((sum, p) => sum + p.value, 0);
  const previousTotal = previousPeriod.reduce((sum, p) => sum + p.value, 0);
  const change = currentTotal - previousTotal;
  const percentChange = calculatePercentageChange(currentTotal, previousTotal);

  return {
    current: currentTotal,
    previous: previousTotal,
    change,
    percentChange,
  };
}

/**
 * Group data by multiple dimensions
 */
export function multiDimensionalRollup<T extends Record<string, any>>(
  data: T[],
  dimensions: string[],
  metrics: string[],
): Record<string, any> {
  if (dimensions.length === 0) {
    return {};
  }

  const [firstDimension, ...remainingDimensions] = dimensions;
  const grouped = new Map<string, T[]>();

  // Group by first dimension
  data.forEach((item) => {
    const key = String(item[firstDimension] || "Unknown");
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  const result: Record<string, any> = {};

  for (const [key, items] of grouped.entries()) {
    if (remainingDimensions.length > 0) {
      // Recursive rollup for remaining dimensions
      result[key] = multiDimensionalRollup(items, remainingDimensions, metrics);
    } else {
      // Calculate metrics
      const metricsResult: Record<string, number> = {};
      metrics.forEach((metric) => {
        const values = items.map((item) => Number(item[metric]) || 0);
        metricsResult[metric] = values.reduce((sum, val) => sum + val, 0);
        metricsResult[`${metric}_avg`] = metricsResult[metric] / values.length;
      });
      result[key] = { ...metricsResult, count: items.length };
    }
  }

  return result;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Normalize values to 0-100 scale
 */
export function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return values.map(() => 50);
  }

  return values.map((val) => ((val - min) / range) * 100);
}

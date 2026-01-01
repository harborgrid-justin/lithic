/**
 * Enterprise Analytics Engine
 * Real-time metrics aggregation, time-series processing, statistical calculations
 */

import type {
  TimeSeriesDataPoint,
  TimeSeries,
  TimeGranularity,
  AggregationMethod,
  StatisticalSummary,
  TrendAnalysis,
  TrendDirection,
} from "@/types/analytics-enterprise";

// ============================================================================
// Time Series Processing
// ============================================================================

/**
 * Aggregate time series data by granularity
 */
export function aggregateTimeSeries(
  data: TimeSeriesDataPoint[],
  granularity: TimeGranularity,
  method: AggregationMethod = "sum",
): TimeSeriesDataPoint[] {
  if (data.length === 0) return [];

  const buckets = new Map<string, TimeSeriesDataPoint[]>();

  data.forEach((point) => {
    const bucketKey = getBucketKey(point.timestamp, granularity);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(point);
  });

  const aggregated: TimeSeriesDataPoint[] = [];

  buckets.forEach((points, key) => {
    const values = points.map((p) => p.value);
    const aggregatedValue = applyAggregation(values, method);
    const timestamp = points[0].timestamp;

    aggregated.push({
      timestamp,
      value: aggregatedValue,
      label: key,
    });
  });

  return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Get bucket key for time series aggregation
 */
function getBucketKey(date: Date, granularity: TimeGranularity): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");

  switch (granularity) {
    case "hour":
      return `${year}-${month}-${day} ${hour}:00`;
    case "day":
      return `${year}-${month}-${day}`;
    case "week":
      const weekNumber = getWeekNumber(date);
      return `${year}-W${String(weekNumber).padStart(2, "0")}`;
    case "month":
      return `${year}-${month}`;
    case "quarter":
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${year}-Q${quarter}`;
    case "year":
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Apply aggregation method to values
 */
export function applyAggregation(values: number[], method: AggregationMethod): number {
  if (values.length === 0) return 0;

  switch (method) {
    case "sum":
      return values.reduce((acc, val) => acc + val, 0);
    case "avg":
      return values.reduce((acc, val) => acc + val, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "count":
      return values.length;
    case "median":
      return calculateMedian(values);
    case "percentile":
      return calculatePercentile(values, 95);
    default:
      return 0;
  }
}

// ============================================================================
// Statistical Calculations
// ============================================================================

/**
 * Calculate comprehensive statistical summary
 */
export function calculateStatistics(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      range: 0,
      variance: 0,
      standardDeviation: 0,
      percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;
  const median = calculateMedian(sorted);
  const mode = calculateMode(values);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  // Calculate variance
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
  const standardDeviation = Math.sqrt(variance);

  // Calculate percentiles
  const percentiles = {
    p25: calculatePercentile(sorted, 25),
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
  };

  return {
    count,
    sum,
    mean,
    median,
    mode,
    min,
    max,
    range,
    variance,
    standardDeviation,
    percentiles,
  };
}

/**
 * Calculate median
 */
export function calculateMedian(sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;

  const mid = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  } else {
    return sortedValues[mid];
  }
}

/**
 * Calculate mode (most frequent value)
 */
export function calculateMode(values: number[]): number | undefined {
  if (values.length === 0) return undefined;

  const frequency = new Map<number, number>();
  let maxFreq = 0;
  let mode: number | undefined;

  values.forEach((val) => {
    const freq = (frequency.get(val) || 0) + 1;
    frequency.set(val, freq);

    if (freq > maxFreq) {
      maxFreq = freq;
      mode = val;
    }
  });

  return maxFreq > 1 ? mode : undefined;
}

/**
 * Calculate percentile
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (percentile < 0 || percentile > 100) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: TimeSeriesDataPoint[],
  windowSize: number,
): TimeSeriesDataPoint[] {
  if (data.length < windowSize) return data;

  const result: TimeSeriesDataPoint[] = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((sum, p) => sum + p.value, 0) / windowSize;

    result.push({
      timestamp: data[i].timestamp,
      value: avg,
      label: data[i].label,
    });
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(
  data: TimeSeriesDataPoint[],
  alpha: number = 0.3,
): TimeSeriesDataPoint[] {
  if (data.length === 0) return [];

  const result: TimeSeriesDataPoint[] = [];
  let ema = data[0].value;

  data.forEach((point) => {
    ema = alpha * point.value + (1 - alpha) * ema;
    result.push({
      timestamp: point.timestamp,
      value: ema,
      label: point.label,
    });
  });

  return result;
}

// ============================================================================
// Trend Analysis
// ============================================================================

/**
 * Perform linear regression and trend analysis
 */
export function analyzeTrend(data: TimeSeriesDataPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: "stable",
      slope: 0,
      rSquared: 0,
      forecast: [],
      confidence: 0,
    };
  }

  // Convert timestamps to numeric values (days from first point)
  const firstTime = data[0].timestamp.getTime();
  const x = data.map((p) => (p.timestamp.getTime() - firstTime) / (1000 * 60 * 60 * 24));
  const y = data.map((p) => p.value);

  // Linear regression
  const { slope, intercept, rSquared } = linearRegression(x, y);

  // Determine trend direction
  const direction = determineTrendDirection(slope, y);

  // Generate forecast (next 7 periods)
  const lastX = x[x.length - 1];
  const forecast: number[] = [];
  for (let i = 1; i <= 7; i++) {
    forecast.push(slope * (lastX + i) + intercept);
  }

  // Calculate confidence based on R-squared
  const confidence = Math.min(100, rSquared * 100);

  // Detect seasonality
  const seasonality = detectSeasonality(data);

  return {
    direction,
    slope,
    rSquared,
    forecast,
    confidence,
    seasonality,
  };
}

/**
 * Linear regression calculation
 */
function linearRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number; rSquared: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  const ssTotal = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const ssResidual = y.reduce(
    (acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2),
    0,
  );
  const rSquared = 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared };
}

/**
 * Determine trend direction
 */
function determineTrendDirection(slope: number, values: number[]): TrendDirection {
  // Calculate coefficient of variation to detect volatility
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // High volatility
  if (cv > 50) {
    return "volatile";
  }

  // Check slope significance relative to mean
  const slopeSignificance = mean !== 0 ? Math.abs(slope) / mean : Math.abs(slope);

  if (slopeSignificance < 0.01) {
    return "stable";
  }

  return slope > 0 ? "increasing" : "decreasing";
}

/**
 * Detect seasonality in time series
 */
function detectSeasonality(
  data: TimeSeriesDataPoint[],
): { detected: boolean; period?: number } {
  if (data.length < 14) {
    return { detected: false };
  }

  // Simple autocorrelation-based seasonality detection
  const values = data.map((p) => p.value);
  const periods = [7, 14, 30]; // Weekly, bi-weekly, monthly

  let maxCorrelation = 0;
  let detectedPeriod: number | undefined;

  for (const period of periods) {
    if (values.length > period * 2) {
      const correlation = calculateAutocorrelation(values, period);
      if (correlation > maxCorrelation && correlation > 0.5) {
        maxCorrelation = correlation;
        detectedPeriod = period;
      }
    }
  }

  return {
    detected: maxCorrelation > 0.5,
    period: detectedPeriod,
  };
}

/**
 * Calculate autocorrelation at specific lag
 */
function calculateAutocorrelation(values: number[], lag: number): number {
  const n = values.length;
  if (n <= lag) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n - lag; i++) {
    numerator += (values[i] - mean) * (values[i + lag] - mean);
  }

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(values[i] - mean, 2);
  }

  return denominator !== 0 ? numerator / denominator : 0;
}

// ============================================================================
// Real-time Metrics Aggregation
// ============================================================================

export class MetricsAggregator {
  private cache: Map<string, any> = new Map();
  private updateListeners: Map<string, Set<(value: any) => void>> = new Map();

  /**
   * Register a metric for real-time updates
   */
  registerMetric(metricId: string, initialValue?: any): void {
    if (!this.cache.has(metricId)) {
      this.cache.set(metricId, initialValue);
      this.updateListeners.set(metricId, new Set());
    }
  }

  /**
   * Update metric value
   */
  updateMetric(metricId: string, value: any): void {
    this.cache.set(metricId, value);
    this.notifyListeners(metricId, value);
  }

  /**
   * Increment counter metric
   */
  incrementMetric(metricId: string, amount: number = 1): void {
    const current = this.cache.get(metricId) || 0;
    this.updateMetric(metricId, current + amount);
  }

  /**
   * Get current metric value
   */
  getMetric(metricId: string): any {
    return this.cache.get(metricId);
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(metricId: string, callback: (value: any) => void): () => void {
    if (!this.updateListeners.has(metricId)) {
      this.updateListeners.set(metricId, new Set());
    }

    this.updateListeners.get(metricId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.updateListeners.get(metricId)?.delete(callback);
    };
  }

  /**
   * Notify all listeners of metric update
   */
  private notifyListeners(metricId: string, value: any): void {
    const listeners = this.updateListeners.get(metricId);
    if (listeners) {
      listeners.forEach((callback) => callback(value));
    }
  }

  /**
   * Aggregate multiple metrics
   */
  aggregateMetrics(metricIds: string[], method: AggregationMethod): number {
    const values = metricIds
      .map((id) => this.cache.get(id))
      .filter((v) => typeof v === "number");

    return applyAggregation(values, method);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.cache.clear();
    this.updateListeners.clear();
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, any> {
    return Object.fromEntries(this.cache);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate rate of change
 */
export function calculateRateOfChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate year-over-year growth
 */
export function calculateYoYGrowth(currentYear: number, previousYear: number): number {
  return calculateRateOfChange(currentYear, previousYear);
}

/**
 * Normalize values to 0-100 scale
 */
export function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) return values.map(() => 50);

  return values.map((val) => ((val - min) / range) * 100);
}

/**
 * Calculate composite score from multiple metrics
 */
export function calculateCompositeScore(
  metrics: Array<{ value: number; weight: number; higherIsBetter: boolean }>,
): number {
  if (metrics.length === 0) return 0;

  const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = metrics.reduce((sum, metric) => {
    // Normalize to 0-100 scale where 100 is best
    const normalizedValue = metric.higherIsBetter ? metric.value : 100 - metric.value;
    return sum + normalizedValue * metric.weight;
  }, 0);

  return weightedSum / totalWeight;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(values: number[]): { outliers: number[]; indices: number[] } {
  if (values.length < 4) return { outliers: [], indices: [] };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const indices: number[] = [];

  values.forEach((val, idx) => {
    if (val < lowerBound || val > upperBound) {
      outliers.push(val);
      indices.push(idx);
    }
  });

  return { outliers, indices };
}

/**
 * Calculate correlation coefficient between two series
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumXSquared += diffX * diffX;
    sumYSquared += diffY * diffY;
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  return denominator !== 0 ? numerator / denominator : 0;
}

// Export singleton instance
export const metricsAggregator = new MetricsAggregator();

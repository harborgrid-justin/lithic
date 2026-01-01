/**
 * Predictive Analytics Models
 * Trend forecasting, regression models, anomaly detection, and seasonal patterns
 */

import { DataPoint } from "./aggregations";

export interface ForecastResult {
  timestamp: Date | string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface TrendAnalysis {
  direction: "up" | "down" | "stable";
  strength: number; // 0-1
  slope: number;
  rSquared: number;
  equation: string;
}

export interface AnomalyResult {
  timestamp: Date | string;
  value: number;
  expected: number;
  deviation: number;
  isAnomaly: boolean;
  severity: "low" | "medium" | "high";
  score: number;
}

export interface SeasonalPattern {
  period: "daily" | "weekly" | "monthly" | "yearly";
  strength: number;
  peaks: number[];
  troughs: number[];
  pattern: number[];
}

/**
 * Linear regression forecast
 */
export function forecastLinearRegression(
  historicalData: DataPoint[],
  periodsAhead: number,
  confidenceLevel: number = 0.95,
): ForecastResult[] {
  if (historicalData.length < 2) {
    return [];
  }

  // Calculate linear regression
  const { slope, intercept, rSquared } =
    calculateLinearRegression(historicalData);

  // Calculate standard error
  const residuals = historicalData.map((point, index) => {
    const predicted = slope * index + intercept;
    return point.value - predicted;
  });

  const standardError = calculateStandardError(residuals);
  const tValue = getTValue(confidenceLevel, historicalData.length - 2);

  // Generate forecasts
  const forecasts: ForecastResult[] = [];
  const lastTimestamp =
    typeof historicalData[historicalData.length - 1].timestamp === "string"
      ? new Date(historicalData[historicalData.length - 1].timestamp)
      : historicalData[historicalData.length - 1].timestamp;

  for (let i = 1; i <= periodsAhead; i++) {
    const x = historicalData.length + i - 1;
    const predicted = slope * x + intercept;
    const marginOfError =
      tValue * standardError * Math.sqrt(1 + 1 / historicalData.length);

    // Calculate next timestamp (assuming daily periods)
    const nextTimestamp = new Date(lastTimestamp);
    nextTimestamp.setDate(nextTimestamp.getDate() + i);

    forecasts.push({
      timestamp: nextTimestamp,
      predicted: Math.max(0, predicted),
      lowerBound: Math.max(0, predicted - marginOfError),
      upperBound: predicted + marginOfError,
      confidence: confidenceLevel,
    });
  }

  return forecasts;
}

/**
 * Calculate linear regression coefficients
 */
function calculateLinearRegression(data: DataPoint[]): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map((d) => d.value);

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const ssResidual = y.reduce((sum, val, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  const rSquared = 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared };
}

/**
 * Calculate standard error
 */
function calculateStandardError(residuals: number[]): number {
  const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumSquaredResiduals / (residuals.length - 2));
}

/**
 * Get t-value for confidence interval (simplified approximation)
 */
function getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
  // Simplified approximation for common confidence levels
  if (confidenceLevel >= 0.99) return 2.576;
  if (confidenceLevel >= 0.95) return 1.96;
  if (confidenceLevel >= 0.9) return 1.645;
  return 1.96;
}

/**
 * Exponential smoothing forecast
 */
export function forecastExponentialSmoothing(
  historicalData: DataPoint[],
  periodsAhead: number,
  alpha: number = 0.3,
  beta: number = 0.1,
): ForecastResult[] {
  if (historicalData.length < 2) {
    return [];
  }

  // Initialize level and trend
  let level = historicalData[0].value;
  let trend = historicalData[1].value - historicalData[0].value;

  // Update level and trend through historical data
  for (let i = 1; i < historicalData.length; i++) {
    const prevLevel = level;
    level = alpha * historicalData[i].value + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Generate forecasts
  const forecasts: ForecastResult[] = [];
  const lastTimestamp =
    typeof historicalData[historicalData.length - 1].timestamp === "string"
      ? new Date(historicalData[historicalData.length - 1].timestamp)
      : historicalData[historicalData.length - 1].timestamp;

  for (let i = 1; i <= periodsAhead; i++) {
    const predicted = level + i * trend;
    const standardError = calculateForecastError(historicalData, alpha, beta);
    const marginOfError = 1.96 * standardError * Math.sqrt(i);

    const nextTimestamp = new Date(lastTimestamp);
    nextTimestamp.setDate(nextTimestamp.getDate() + i);

    forecasts.push({
      timestamp: nextTimestamp,
      predicted: Math.max(0, predicted),
      lowerBound: Math.max(0, predicted - marginOfError),
      upperBound: predicted + marginOfError,
      confidence: 0.95,
    });
  }

  return forecasts;
}

/**
 * Calculate forecast error for exponential smoothing
 */
function calculateForecastError(
  data: DataPoint[],
  alpha: number,
  beta: number,
): number {
  if (data.length < 3) {
    return 0;
  }

  let level = data[0].value;
  let trend = data[1].value - data[0].value;
  const errors: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const forecast = level + trend;
    errors.push(data[i].value - forecast);

    const prevLevel = level;
    level = alpha * data[i].value + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const mse = errors.reduce((sum, e) => sum + e * e, 0) / errors.length;
  return Math.sqrt(mse);
}

/**
 * Analyze trend direction and strength
 */
export function analyzeTrend(data: DataPoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: "stable",
      strength: 0,
      slope: 0,
      rSquared: 0,
      equation: "y = 0",
    };
  }

  const { slope, intercept, rSquared } = calculateLinearRegression(data);

  // Determine direction
  let direction: "up" | "down" | "stable" = "stable";
  if (Math.abs(slope) > 0.01) {
    direction = slope > 0 ? "up" : "down";
  }

  // Calculate strength (based on R-squared)
  const strength = Math.abs(rSquared);

  return {
    direction,
    strength,
    slope,
    rSquared,
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
  };
}

/**
 * Detect anomalies using statistical methods
 */
export function detectAnomalies(
  data: DataPoint[],
  sensitivity: number = 2.5,
): AnomalyResult[] {
  if (data.length < 10) {
    return data.map((point) => ({
      timestamp: point.timestamp,
      value: point.value,
      expected: point.value,
      deviation: 0,
      isAnomaly: false,
      severity: "low" as const,
      score: 0,
    }));
  }

  // Calculate rolling statistics
  const windowSize = Math.min(20, Math.floor(data.length / 2));
  const results: AnomalyResult[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(data.length, i + windowSize + 1);
    const window = data.slice(start, end).filter((_, idx) => start + idx !== i);

    const values = window.map((d) => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
    );

    const deviation = Math.abs(data[i].value - mean);
    const score = stdDev > 0 ? deviation / stdDev : 0;
    const isAnomaly = score > sensitivity;

    let severity: "low" | "medium" | "high" = "low";
    if (score > sensitivity * 2) {
      severity = "high";
    } else if (score > sensitivity * 1.5) {
      severity = "medium";
    }

    results.push({
      timestamp: data[i].timestamp,
      value: data[i].value,
      expected: mean,
      deviation,
      isAnomaly,
      severity,
      score,
    });
  }

  return results;
}

/**
 * Detect seasonal patterns
 */
export function detectSeasonalPattern(
  data: DataPoint[],
  period: SeasonalPattern["period"],
): SeasonalPattern {
  const periodSize = getPeriodSize(period);

  if (data.length < periodSize * 2) {
    return {
      period,
      strength: 0,
      peaks: [],
      troughs: [],
      pattern: [],
    };
  }

  // Calculate pattern by averaging values at same position in period
  const pattern: number[] = new Array(periodSize).fill(0);
  const counts: number[] = new Array(periodSize).fill(0);

  data.forEach((point, index) => {
    const positionInPeriod = index % periodSize;
    pattern[positionInPeriod] += point.value;
    counts[positionInPeriod]++;
  });

  for (let i = 0; i < periodSize; i++) {
    pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0;
  }

  // Find peaks and troughs
  const peaks: number[] = [];
  const troughs: number[] = [];
  const mean = pattern.reduce((sum, v) => sum + v, 0) / pattern.length;

  pattern.forEach((value, index) => {
    if (value > mean * 1.1) {
      peaks.push(index);
    } else if (value < mean * 0.9) {
      troughs.push(index);
    }
  });

  // Calculate strength (coefficient of variation)
  const stdDev = Math.sqrt(
    pattern.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / pattern.length,
  );
  const strength = mean > 0 ? stdDev / mean : 0;

  return {
    period,
    strength: Math.min(1, strength),
    peaks,
    troughs,
    pattern,
  };
}

/**
 * Get period size in data points
 */
function getPeriodSize(period: SeasonalPattern["period"]): number {
  switch (period) {
    case "daily":
      return 24; // Hours in a day
    case "weekly":
      return 7; // Days in a week
    case "monthly":
      return 30; // Days in a month
    case "yearly":
      return 12; // Months in a year
    default:
      return 7;
  }
}

/**
 * Moving average forecast
 */
export function forecastMovingAverage(
  historicalData: DataPoint[],
  periodsAhead: number,
  windowSize: number = 7,
): ForecastResult[] {
  if (historicalData.length < windowSize) {
    return [];
  }

  // Calculate moving average of last window
  const lastWindow = historicalData.slice(-windowSize);
  const movingAverage =
    lastWindow.reduce((sum, point) => sum + point.value, 0) / windowSize;

  // Calculate standard deviation for confidence interval
  const values = lastWindow.map((p) => p.value);
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - movingAverage, 2), 0) /
      values.length,
  );

  const forecasts: ForecastResult[] = [];
  const lastTimestamp =
    typeof historicalData[historicalData.length - 1].timestamp === "string"
      ? new Date(historicalData[historicalData.length - 1].timestamp)
      : historicalData[historicalData.length - 1].timestamp;

  for (let i = 1; i <= periodsAhead; i++) {
    const nextTimestamp = new Date(lastTimestamp);
    nextTimestamp.setDate(nextTimestamp.getDate() + i);

    forecasts.push({
      timestamp: nextTimestamp,
      predicted: movingAverage,
      lowerBound: Math.max(0, movingAverage - 1.96 * stdDev),
      upperBound: movingAverage + 1.96 * stdDev,
      confidence: 0.95,
    });
  }

  return forecasts;
}

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastAccuracy(
  actual: DataPoint[],
  predicted: ForecastResult[],
): {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
} {
  if (actual.length === 0 || predicted.length === 0) {
    return { mae: 0, mape: 0, rmse: 0 };
  }

  const errors: number[] = [];
  const percentageErrors: number[] = [];

  const minLength = Math.min(actual.length, predicted.length);

  for (let i = 0; i < minLength; i++) {
    const error = Math.abs(actual[i].value - predicted[i].predicted);
    errors.push(error);

    if (actual[i].value !== 0) {
      percentageErrors.push((error / Math.abs(actual[i].value)) * 100);
    }
  }

  const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const mape =
    percentageErrors.length > 0
      ? percentageErrors.reduce((sum, e) => sum + e, 0) /
        percentageErrors.length
      : 0;
  const rmse = Math.sqrt(
    errors.reduce((sum, e) => sum + e * e, 0) / errors.length,
  );

  return { mae, mape, rmse };
}

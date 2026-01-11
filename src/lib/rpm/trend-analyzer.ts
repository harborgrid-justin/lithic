/**
 * RPM Trend Analyzer
 * Advanced trend analysis and forecasting for vital signs data
 */

import type {
  VitalSignReading,
  ReadingType,
  TrendAnalysis,
  TrendDirection,
  ForecastPoint,
  ChangePoint,
  AnomalyDetection,
  TrendInsight,
  InsightType,
  SeasonalityPattern,
} from "@/types/rpm";

export class TrendAnalyzer {
  /**
   * Analyze trends in vital signs readings
   */
  async analyzeTrends(
    readings: VitalSignReading[],
    readingType: ReadingType
  ): Promise<TrendAnalysis> {
    if (readings.length < 3) {
      return this.getInsufficientDataAnalysis();
    }

    // Sort readings by timestamp
    const sorted = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate linear regression
    const regression = this.calculateLinearRegression(sorted);

    // Determine trend direction
    const direction = this.determineTrendDirection(regression.slope, regression.rSquared);

    // Detect change points
    const changePoints = this.detectChangePoints(sorted);

    // Detect seasonality
    const seasonality = this.detectSeasonality(sorted);

    // Detect anomalies
    const anomalies = this.detectAnomalies(sorted);

    // Generate forecast
    const forecast = this.generateForecast(sorted, regression, 7); // 7 days forecast

    // Generate insights
    const insights = this.generateInsights(
      sorted,
      readingType,
      direction,
      regression,
      changePoints,
      anomalies
    );

    return {
      direction,
      strength: this.calculateTrendStrength(regression.rSquared),
      slope: regression.slope,
      rSquared: regression.rSquared,
      forecast,
      changePoints,
      seasonality,
      anomalies,
      insights,
    };
  }

  /**
   * Compare trends across time periods
   */
  compareTrends(
    currentPeriod: VitalSignReading[],
    previousPeriod: VitalSignReading[]
  ): {
    currentTrend: number;
    previousTrend: number;
    percentChange: number;
    improvement: boolean;
    significance: "improving" | "stable" | "concerning" | "critical";
  } {
    const currentAvg = this.average(currentPeriod.map((r) => r.value));
    const previousAvg = this.average(previousPeriod.map((r) => r.value));

    const percentChange = previousAvg !== 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

    // Determine if change is improvement (depends on reading type)
    const improvement = this.isImprovement(percentChange, currentPeriod[0]?.readingType);

    // Determine significance
    const significance = this.determineSignificance(percentChange, improvement);

    return {
      currentTrend: currentAvg,
      previousTrend: previousAvg,
      percentChange,
      improvement,
      significance,
    };
  }

  /**
   * Predict future values
   */
  predictFutureValue(
    readings: VitalSignReading[],
    daysAhead: number
  ): {
    predicted: number;
    confidence: number;
    range: { min: number; max: number };
  } {
    if (readings.length < 3) {
      throw new Error("Insufficient data for prediction");
    }

    const regression = this.calculateLinearRegression(readings);
    const lastReading = readings[readings.length - 1];
    const daysSinceStart = readings.length;

    // Predict value
    const predicted = regression.intercept + regression.slope * (daysSinceStart + daysAhead);

    // Calculate prediction interval
    const stdError = this.calculateStandardError(readings, regression);
    const confidence = Math.max(0, Math.min(100, regression.rSquared * 100));

    // 95% confidence interval
    const margin = 1.96 * stdError * Math.sqrt(1 + 1 / readings.length);

    return {
      predicted,
      confidence,
      range: {
        min: predicted - margin,
        max: predicted + margin,
      },
    };
  }

  /**
   * Identify correlations between different vital signs
   */
  calculateCorrelation(readings1: VitalSignReading[], readings2: VitalSignReading[]): number {
    if (readings1.length !== readings2.length || readings1.length < 2) {
      return 0;
    }

    const values1 = readings1.map((r) => r.value);
    const values2 = readings2.map((r) => r.value);

    const mean1 = this.average(values1);
    const mean2 = this.average(values2);

    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1 * sum2);
    return denominator !== 0 ? numerator / denominator : 0;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate linear regression
   */
  private calculateLinearRegression(readings: VitalSignReading[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = readings.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    readings.forEach((reading, index) => {
      const x = index;
      const y = reading.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssRes = 0;
    let ssTot = 0;

    readings.forEach((reading, index) => {
      const predicted = intercept + slope * index;
      ssRes += Math.pow(reading.value - predicted, 2);
      ssTot += Math.pow(reading.value - meanY, 2);
    });

    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, rSquared };
  }

  /**
   * Determine trend direction
   */
  private determineTrendDirection(slope: number, rSquared: number): TrendDirection {
    if (rSquared < 0.3) {
      return TrendDirection.FLUCTUATING;
    }

    const threshold = 0.01;

    if (Math.abs(slope) < threshold) {
      return TrendDirection.STABLE;
    }

    return slope > 0 ? TrendDirection.INCREASING : TrendDirection.DECREASING;
  }

  /**
   * Calculate trend strength (0-1)
   */
  private calculateTrendStrength(rSquared: number): number {
    return Math.max(0, Math.min(1, rSquared));
  }

  /**
   * Detect change points using CUSUM algorithm
   */
  private detectChangePoints(readings: VitalSignReading[]): ChangePoint[] {
    if (readings.length < 10) return [];

    const changePoints: ChangePoint[] = [];
    const values = readings.map((r) => r.value);
    const mean = this.average(values);
    const stdDev = this.standardDeviation(values);

    const threshold = 2 * stdDev;
    let cumSum = 0;
    let previousMean = mean;

    for (let i = 1; i < readings.length; i++) {
      cumSum += readings[i].value - mean;

      if (Math.abs(cumSum) > threshold) {
        // Calculate new mean after change point
        const subsequentValues = readings.slice(i).map((r) => r.value);
        const newMean = this.average(subsequentValues);

        const significance = Math.abs(newMean - previousMean) / stdDev;

        if (significance > 1.5) {
          changePoints.push({
            timestamp: readings[i].timestamp,
            value: readings[i].value,
            previousMean,
            newMean,
            significance,
          });

          previousMean = newMean;
          cumSum = 0;
        }
      }
    }

    return changePoints;
  }

  /**
   * Detect seasonality patterns
   */
  private detectSeasonality(readings: VitalSignReading[]): SeasonalityPattern | null {
    if (readings.length < 14) return null;

    // Check for daily patterns
    const hourlyPattern = this.checkHourlyPattern(readings);
    if (hourlyPattern.strength > 0.6) {
      return {
        period: "daily",
        strength: hourlyPattern.strength,
        peaks: hourlyPattern.peaks,
        troughs: hourlyPattern.troughs,
      };
    }

    // Check for weekly patterns
    const weeklyPattern = this.checkWeeklyPattern(readings);
    if (weeklyPattern.strength > 0.6) {
      return {
        period: "weekly",
        strength: weeklyPattern.strength,
        peaks: weeklyPattern.peaks,
        troughs: weeklyPattern.troughs,
      };
    }

    return null;
  }

  /**
   * Check for hourly patterns
   */
  private checkHourlyPattern(readings: VitalSignReading[]): {
    strength: number;
    peaks: Date[];
    troughs: Date[];
  } {
    const byHour: Record<number, number[]> = {};

    readings.forEach((reading) => {
      const hour = reading.timestamp.getHours();
      if (!byHour[hour]) byHour[hour] = [];
      byHour[hour].push(reading.value);
    });

    const hourlyAverages = Object.entries(byHour).map(([hour, values]) => ({
      hour: parseInt(hour),
      average: this.average(values),
    }));

    if (hourlyAverages.length < 6) {
      return { strength: 0, peaks: [], troughs: [] };
    }

    // Calculate variance in hourly averages
    const values = hourlyAverages.map((h) => h.average);
    const variance = this.variance(values);
    const overallVariance = this.variance(readings.map((r) => r.value));

    const strength = overallVariance !== 0 ? variance / overallVariance : 0;

    // Find peaks and troughs
    const sorted = [...hourlyAverages].sort((a, b) => b.average - a.average);
    const peaks = sorted.slice(0, 2).map((h) => {
      const date = new Date();
      date.setHours(h.hour, 0, 0, 0);
      return date;
    });

    const troughs = sorted.slice(-2).map((h) => {
      const date = new Date();
      date.setHours(h.hour, 0, 0, 0);
      return date;
    });

    return { strength, peaks, troughs };
  }

  /**
   * Check for weekly patterns
   */
  private checkWeeklyPattern(readings: VitalSignReading[]): {
    strength: number;
    peaks: Date[];
    troughs: Date[];
  } {
    const byDay: Record<number, number[]> = {};

    readings.forEach((reading) => {
      const day = reading.timestamp.getDay();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(reading.value);
    });

    const dailyAverages = Object.entries(byDay).map(([day, values]) => ({
      day: parseInt(day),
      average: this.average(values),
    }));

    if (dailyAverages.length < 4) {
      return { strength: 0, peaks: [], troughs: [] };
    }

    const values = dailyAverages.map((d) => d.average);
    const variance = this.variance(values);
    const overallVariance = this.variance(readings.map((r) => r.value));

    const strength = overallVariance !== 0 ? variance / overallVariance : 0;

    const sorted = [...dailyAverages].sort((a, b) => b.average - a.average);
    const peaks = sorted.slice(0, 1).map((d) => {
      const date = new Date();
      date.setDate(date.getDate() + ((d.day - date.getDay() + 7) % 7));
      return date;
    });

    const troughs = sorted.slice(-1).map((d) => {
      const date = new Date();
      date.setDate(date.getDate() + ((d.day - date.getDay() + 7) % 7));
      return date;
    });

    return { strength, peaks, troughs };
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomalies(readings: VitalSignReading[]): AnomalyDetection[] {
    if (readings.length < 10) return [];

    const values = readings.map((r) => r.value);
    const mean = this.average(values);
    const stdDev = this.standardDeviation(values);

    const anomalies: AnomalyDetection[] = [];

    readings.forEach((reading, index) => {
      const zScore = (reading.value - mean) / stdDev;

      if (Math.abs(zScore) > 2.5) {
        // Check if anomaly is persistent
        const window = readings.slice(Math.max(0, index - 2), Math.min(readings.length, index + 3));
        const windowMean = this.average(window.map((r) => r.value));
        const isPersistent = Math.abs(windowMean - mean) > stdDev;

        anomalies.push({
          timestamp: reading.timestamp,
          value: reading.value,
          expectedValue: mean,
          deviation: reading.value - mean,
          zScore,
          isPersistent,
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate forecast
   */
  private generateForecast(
    readings: VitalSignReading[],
    regression: { slope: number; intercept: number; rSquared: number },
    days: number
  ): ForecastPoint[] {
    const forecast: ForecastPoint[] = [];
    const stdError = this.calculateStandardError(readings, regression);
    const lastIndex = readings.length - 1;

    for (let i = 1; i <= days; i++) {
      const x = lastIndex + i;
      const value = regression.intercept + regression.slope * x;
      const margin = 1.96 * stdError * Math.sqrt(1 + 1 / readings.length + Math.pow(x - lastIndex / 2, 2));

      const timestamp = new Date(readings[readings.length - 1].timestamp);
      timestamp.setDate(timestamp.getDate() + i);

      forecast.push({
        timestamp,
        value,
        confidenceLower: value - margin,
        confidenceUpper: value + margin,
        confidence: Math.max(0, Math.min(100, regression.rSquared * 100 * (1 - i / (days * 2)))),
      });
    }

    return forecast;
  }

  /**
   * Generate insights
   */
  private generateInsights(
    readings: VitalSignReading[],
    readingType: ReadingType,
    direction: TrendDirection,
    regression: { slope: number; intercept: number; rSquared: number },
    changePoints: ChangePoint[],
    anomalies: AnomalyDetection[]
  ): TrendInsight[] {
    const insights: TrendInsight[] = [];

    // Trend direction insight
    if (regression.rSquared > 0.5) {
      const isImproving = this.isImprovingTrend(direction, readingType);
      insights.push({
        type: isImproving ? InsightType.IMPROVEMENT : InsightType.DETERIORATION,
        severity: isImproving ? "info" : "warning",
        message: `${readingType.replace(/_/g, " ")} shows ${direction.toLowerCase()} trend with ${(regression.rSquared * 100).toFixed(0)}% confidence`,
        recommendation: isImproving
          ? "Continue current management plan"
          : "Consider adjusting treatment plan",
        confidence: regression.rSquared,
        supportingData: { slope: regression.slope, rSquared: regression.rSquared },
      });
    }

    // Change point insights
    if (changePoints.length > 0) {
      const recentChange = changePoints[changePoints.length - 1];
      insights.push({
        type: InsightType.MEDICATION_EFFECT,
        severity: "info",
        message: `Significant change detected on ${recentChange.timestamp.toLocaleDateString()}`,
        recommendation: "Review recent interventions or medication changes",
        confidence: Math.min(1, recentChange.significance / 3),
        supportingData: { changePoint: recentChange },
      });
    }

    // Anomaly insights
    const persistentAnomalies = anomalies.filter((a) => a.isPersistent);
    if (persistentAnomalies.length > 0) {
      insights.push({
        type: InsightType.INTERVENTION_NEEDED,
        severity: "warning",
        message: `${persistentAnomalies.length} persistent anomalies detected`,
        recommendation: "Investigate cause of abnormal readings and consider intervention",
        confidence: 0.8,
        supportingData: { anomalies: persistentAnomalies },
      });
    }

    // Variability insight
    const values = readings.map((r) => r.value);
    const cv = (this.standardDeviation(values) / this.average(values)) * 100;

    if (cv > 20) {
      insights.push({
        type: InsightType.VARIABILITY_CONCERN,
        severity: "warning",
        message: `High variability detected (CV: ${cv.toFixed(1)}%)`,
        recommendation: "Investigate factors causing variability and improve consistency",
        confidence: 0.85,
        supportingData: { coefficientOfVariation: cv },
      });
    }

    return insights;
  }

  /**
   * Calculate standard error
   */
  private calculateStandardError(
    readings: VitalSignReading[],
    regression: { slope: number; intercept: number }
  ): number {
    let sumSquaredErrors = 0;

    readings.forEach((reading, index) => {
      const predicted = regression.intercept + regression.slope * index;
      sumSquaredErrors += Math.pow(reading.value - predicted, 2);
    });

    return Math.sqrt(sumSquaredErrors / (readings.length - 2));
  }

  /**
   * Helper: Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Helper: Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const avg = this.average(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /**
   * Helper: Calculate variance
   */
  private variance(values: number[]): number {
    const avg = this.average(values);
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }

  /**
   * Helper: Determine if change is improvement
   */
  private isImprovement(percentChange: number, readingType?: ReadingType): boolean {
    // For most vital signs, decrease is improvement
    // Customize based on reading type
    const increaseIsGood = [ReadingType.OXYGEN_SATURATION, ReadingType.PEAK_FLOW, ReadingType.FEV1];

    if (readingType && increaseIsGood.includes(readingType)) {
      return percentChange > 0;
    }

    return percentChange < 0;
  }

  /**
   * Helper: Determine significance of change
   */
  private determineSignificance(
    percentChange: number,
    improvement: boolean
  ): "improving" | "stable" | "concerning" | "critical" {
    const abs = Math.abs(percentChange);

    if (abs < 5) return "stable";

    if (improvement) {
      return abs > 15 ? "improving" : "stable";
    } else {
      return abs > 20 ? "critical" : "concerning";
    }
  }

  /**
   * Helper: Determine if trend direction is improving
   */
  private isImprovingTrend(direction: TrendDirection, readingType: ReadingType): boolean {
    const increaseIsGood = [ReadingType.OXYGEN_SATURATION, ReadingType.PEAK_FLOW, ReadingType.FEV1];

    if (increaseIsGood.includes(readingType)) {
      return direction === TrendDirection.INCREASING;
    }

    return direction === TrendDirection.DECREASING;
  }

  /**
   * Get insufficient data analysis
   */
  private getInsufficientDataAnalysis(): TrendAnalysis {
    return {
      direction: TrendDirection.INSUFFICIENT_DATA,
      strength: 0,
      slope: 0,
      rSquared: 0,
      forecast: [],
      changePoints: [],
      seasonality: null,
      anomalies: [],
      insights: [
        {
          type: InsightType.COMPLIANCE_ISSUE,
          severity: "warning",
          message: "Insufficient data for trend analysis",
          recommendation: "Encourage more consistent readings",
          confidence: 1,
          supportingData: {},
        },
      ],
    };
  }
}

export const trendAnalyzer = new TrendAnalyzer();

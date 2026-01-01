import { NextRequest, NextResponse } from "next/server";
import {
  forecastLinearRegression,
  forecastExponentialSmoothing,
  analyzeTrend,
  detectAnomalies,
  detectSeasonalPattern,
  calculateForecastAccuracy,
  ForecastResult,
} from "@/lib/analytics/predictions";
import { DataPoint } from "@/lib/analytics/aggregations";

/**
 * GET /api/analytics/predictive
 * Predictive analytics endpoint
 * Returns forecasts, anomalies, and trend analysis
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get("metric") || "revenue";
    const period = parseInt(searchParams.get("period") || "30");
    const method = searchParams.get("method") || "linear";

    // Validate inputs
    if (period < 1 || period > 365) {
      return NextResponse.json(
        { error: "Period must be between 1 and 365 days" },
        { status: 400 },
      );
    }

    // Generate mock historical data
    // In production, fetch from database
    const historicalData: DataPoint[] = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 60); // 60 days of historical data

    let baseValue = getBaseValue(metric);

    for (let i = 0; i < 60; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Add trend and seasonality
      const trend = i * (baseValue * 0.001); // Upward trend
      const seasonality = Math.sin((i / 7) * Math.PI) * (baseValue * 0.05); // Weekly pattern
      const noise = (Math.random() - 0.5) * (baseValue * 0.1); // Random variation

      historicalData.push({
        timestamp: date.toISOString(),
        value: Math.max(0, baseValue + trend + seasonality + noise),
        metric,
      });
    }

    // Generate forecasts
    let forecasts: ForecastResult[] = [];

    if (method === "linear") {
      forecasts = forecastLinearRegression(historicalData, period, 0.95);
    } else if (method === "exponential") {
      forecasts = forecastExponentialSmoothing(
        historicalData,
        period,
        0.3,
        0.1,
      );
    } else {
      // Default to linear
      forecasts = forecastLinearRegression(historicalData, period, 0.95);
    }

    // Analyze trend
    const trendAnalysis = analyzeTrend(historicalData);

    // Detect anomalies
    const anomalies = detectAnomalies(historicalData, 2.5);

    // Detect seasonal patterns
    const seasonalPatterns = {
      daily: detectSeasonalPattern(historicalData, "daily"),
      weekly: detectSeasonalPattern(historicalData, "weekly"),
    };

    // Calculate forecast accuracy (using last 10 data points as validation)
    const validationSize = Math.min(
      10,
      Math.floor(historicalData.length * 0.2),
    );
    const trainingData = historicalData.slice(0, -validationSize);
    const validationData = historicalData.slice(-validationSize);
    const validationForecasts = forecastLinearRegression(
      trainingData,
      validationSize,
      0.95,
    );

    const accuracy = calculateForecastAccuracy(
      validationData,
      validationForecasts,
    );

    // Generate scenario analysis
    const scenarios = generateScenarios(metric, forecasts);

    // Key insights
    const insights = generateInsights(
      trendAnalysis,
      anomalies,
      seasonalPatterns,
    );

    return NextResponse.json({
      success: true,
      metric,
      period,
      method,
      historicalData: historicalData.map((d) => ({
        timestamp: d.timestamp,
        value: Math.round(d.value * 100) / 100,
      })),
      forecasts: forecasts.map((f) => ({
        timestamp: f.timestamp,
        predicted: Math.round(f.predicted * 100) / 100,
        lowerBound: Math.round(f.lowerBound * 100) / 100,
        upperBound: Math.round(f.upperBound * 100) / 100,
        confidence: f.confidence,
      })),
      trendAnalysis,
      anomalies: anomalies
        .filter((a) => a.isAnomaly)
        .map((a) => ({
          timestamp: a.timestamp,
          value: Math.round(a.value * 100) / 100,
          expected: Math.round(a.expected * 100) / 100,
          deviation: Math.round(a.deviation * 100) / 100,
          severity: a.severity,
          score: Math.round(a.score * 100) / 100,
        })),
      seasonalPatterns,
      accuracy: {
        mae: Math.round(accuracy.mae * 100) / 100,
        mape: Math.round(accuracy.mape * 100) / 100,
        rmse: Math.round(accuracy.rmse * 100) / 100,
      },
      scenarios,
      insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: historicalData.length,
        forecastHorizon: period,
        confidenceLevel: 0.95,
      },
    });
  } catch (error) {
    console.error("Error in predictive analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to generate predictive analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Get base value for different metrics
 */
function getBaseValue(metric: string): number {
  const baseValues: Record<string, number> = {
    revenue: 500000,
    patient_volume: 2000,
    readmissions: 10,
    wait_time: 20,
    bed_occupancy: 80,
    satisfaction: 4.2,
    claims: 700,
  };

  return baseValues[metric] || 1000;
}

/**
 * Generate what-if scenarios
 */
function generateScenarios(metric: string, forecasts: ForecastResult[]): any[] {
  const scenarios = [];

  // Base forecast
  const baseForecast = forecasts[forecasts.length - 1];
  if (!baseForecast) {
    return [];
  }

  // Optimistic scenario (+15%)
  scenarios.push({
    name: "Optimistic",
    description: "Best case scenario with favorable conditions",
    impact: "+15%",
    forecastValue: baseForecast.predicted * 1.15,
    assumptions: [
      "Increased marketing effectiveness",
      "Improved operational efficiency",
      "Favorable market conditions",
    ],
  });

  // Pessimistic scenario (-15%)
  scenarios.push({
    name: "Pessimistic",
    description: "Worst case scenario with unfavorable conditions",
    impact: "-15%",
    forecastValue: baseForecast.predicted * 0.85,
    assumptions: [
      "Increased competition",
      "Regulatory challenges",
      "Economic downturn",
    ],
  });

  // Capacity expansion scenario
  if (metric === "revenue" || metric === "patient_volume") {
    scenarios.push({
      name: "Capacity Expansion",
      description: "10% capacity increase",
      impact: "+10%",
      forecastValue: baseForecast.predicted * 1.1,
      assumptions: [
        "Additional resources allocated",
        "Staff hiring completed",
        "Infrastructure ready",
      ],
    });
  }

  return scenarios;
}

/**
 * Generate insights from analysis
 */
function generateInsights(
  trendAnalysis: any,
  anomalies: any[],
  seasonalPatterns: any,
): any[] {
  const insights = [];

  // Trend insight
  insights.push({
    type: "trend",
    severity: trendAnalysis.strength > 0.7 ? "high" : "medium",
    title: `${trendAnalysis.direction === "up" ? "Upward" : trendAnalysis.direction === "down" ? "Downward" : "Stable"} Trend Detected`,
    description: `The data shows a ${trendAnalysis.direction} trend with ${(trendAnalysis.strength * 100).toFixed(0)}% strength. R² = ${trendAnalysis.rSquared.toFixed(3)}.`,
    actionable: trendAnalysis.strength > 0.7,
  });

  // Anomaly insight
  const highSeverityAnomalies = anomalies.filter(
    (a) => a.severity === "high",
  ).length;
  if (highSeverityAnomalies > 0) {
    insights.push({
      type: "anomaly",
      severity: "high",
      title: `${highSeverityAnomalies} High-Severity Anomalies Detected`,
      description: `Significant deviations from expected patterns require investigation.`,
      actionable: true,
    });
  }

  // Seasonality insight
  if (seasonalPatterns.weekly.strength > 0.3) {
    insights.push({
      type: "seasonality",
      severity: "medium",
      title: "Weekly Seasonal Pattern Identified",
      description: `Strong weekly pattern detected (${(seasonalPatterns.weekly.strength * 100).toFixed(0)}% strength). Consider day-of-week variations in planning.`,
      actionable: true,
    });
  }

  return insights;
}

/**
 * POST /api/analytics/predictive
 * Generate custom forecast with user-provided parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      historicalData,
      periods,
      method = "linear",
      confidenceLevel = 0.95,
    } = body;

    if (!historicalData || !Array.isArray(historicalData)) {
      return NextResponse.json(
        { error: "historicalData array is required" },
        { status: 400 },
      );
    }

    if (!periods || periods < 1) {
      return NextResponse.json(
        { error: "Valid periods parameter is required" },
        { status: 400 },
      );
    }

    let forecasts: ForecastResult[] = [];

    if (method === "linear") {
      forecasts = forecastLinearRegression(
        historicalData,
        periods,
        confidenceLevel,
      );
    } else if (method === "exponential") {
      forecasts = forecastExponentialSmoothing(
        historicalData,
        periods,
        0.3,
        0.1,
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid method. Use "linear" or "exponential"' },
        { status: 400 },
      );
    }

    const trendAnalysis = analyzeTrend(historicalData);

    return NextResponse.json({
      success: true,
      forecasts,
      trendAnalysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        method,
        confidenceLevel,
        dataPoints: historicalData.length,
        forecastPeriods: periods,
      },
    });
  } catch (error) {
    console.error("Error in predictive analytics POST:", error);
    return NextResponse.json(
      {
        error: "Failed to generate forecast",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { calculateStatistics, analyzeTrend, aggregateTimeSeries } from "@/lib/analytics/engine";
import {
  stratifyDiabetesRisk,
  stratifyCHFRisk,
  identifyDiabetesCareGaps,
  identifyHypertensionCareGaps,
  calculateDiabetesQualityMetrics,
} from "@/lib/analytics/registries";
import { predictReadmissionRisk } from "@/lib/analytics/predictive/readmission-risk";
import { predictNoShow } from "@/lib/analytics/predictive/no-show-predictor";
import { predictHighUtilizer } from "@/lib/analytics/predictive/high-utilizer";
import { calculateDeteriorationIndex } from "@/lib/analytics/predictive/deterioration-index";
import { predictCosts } from "@/lib/analytics/predictive/cost-predictor";

/**
 * Analytics Enterprise API
 * Central endpoint for all advanced analytics operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, data } = body;

    switch (operation) {
      // Statistical Operations
      case "calculate_statistics":
        return NextResponse.json({
          success: true,
          data: calculateStatistics(data.values),
        });

      case "analyze_trend":
        return NextResponse.json({
          success: true,
          data: analyzeTrend(data.timeSeries),
        });

      case "aggregate_time_series":
        return NextResponse.json({
          success: true,
          data: aggregateTimeSeries(data.timeSeries, data.granularity, data.method),
        });

      // Risk Stratification
      case "stratify_diabetes_risk":
        return NextResponse.json({
          success: true,
          data: stratifyDiabetesRisk(data.patient),
        });

      case "stratify_chf_risk":
        return NextResponse.json({
          success: true,
          data: stratifyCHFRisk(data.patient),
        });

      // Care Gaps
      case "identify_diabetes_care_gaps":
        return NextResponse.json({
          success: true,
          data: identifyDiabetesCareGaps(data.patient),
        });

      case "identify_hypertension_care_gaps":
        return NextResponse.json({
          success: true,
          data: identifyHypertensionCareGaps(data.patient),
        });

      // Quality Metrics
      case "calculate_diabetes_quality_metrics":
        return NextResponse.json({
          success: true,
          data: calculateDiabetesQualityMetrics(data.patients),
        });

      // Predictive Models
      case "predict_readmission":
        return NextResponse.json({
          success: true,
          data: predictReadmissionRisk(data.input),
        });

      case "predict_no_show":
        return NextResponse.json({
          success: true,
          data: predictNoShow(data.input),
        });

      case "predict_high_utilizer":
        return NextResponse.json({
          success: true,
          data: predictHighUtilizer(data.input),
        });

      case "calculate_deterioration_index":
        return NextResponse.json({
          success: true,
          data: calculateDeteriorationIndex(data.input),
        });

      case "predict_costs":
        return NextResponse.json({
          success: true,
          data: predictCosts(data.input),
        });

      // Batch Operations
      case "batch_predict_readmissions":
        const readmissionPredictions = data.inputs.map((input: any) =>
          predictReadmissionRisk(input)
        );
        return NextResponse.json({
          success: true,
          data: readmissionPredictions,
        });

      case "batch_predict_no_shows":
        const noShowPredictions = data.inputs.map((input: any) => predictNoShow(input));
        return NextResponse.json({
          success: true,
          data: noShowPredictions,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown operation: ${operation}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for retrieving analytics data
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    switch (type) {
      case "metrics_summary":
        // Return summary of key metrics
        return NextResponse.json({
          success: true,
          data: {
            totalPatients: 15420,
            activeRegistries: 8,
            openCareGaps: 3245,
            highRiskPatients: 892,
            predictiveModelsActive: 5,
          },
        });

      case "registry_summary":
        const registryType = searchParams.get("registry");
        return NextResponse.json({
          success: true,
          data: {
            registryType,
            totalPatients: 2850,
            highRisk: 340,
            activeGaps: 1245,
            qualityScore: 87,
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Type parameter required",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics GET Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

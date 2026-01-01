/**
 * ACO Management API
 * Endpoints for ACO performance, attribution, and shared savings
 */

import { NextRequest, NextResponse } from "next/server";
import {
  performProspectiveAttribution,
  performRetrospectiveAttribution,
  calculateAttributionStability,
} from "@/lib/vbc/aco/attribution-engine";
import {
  calculateOneSidedSavings,
  calculateTwoSidedSavings,
  calculateReachProfessional,
  calculateBenchmark,
  projectSharedSavings,
} from "@/lib/vbc/aco/shared-savings-calculator";
import {
  generatePerformanceSnapshot,
  generatePerformanceAlerts,
} from "@/lib/vbc/aco/performance-tracker";
import {
  generatePatientRiskProfile,
  calculatePopulationRAF,
} from "@/lib/vbc/aco/risk-adjustment";

/**
 * GET /api/vbc/aco
 * Get ACO performance metrics and attribution data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const acoId = searchParams.get("acoId");
    const type = searchParams.get("type") || "performance";
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    if (!acoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "ACO ID is required",
          },
        },
        { status: 400 }
      );
    }

    let data: any;

    switch (type) {
      case "performance":
        // Mock performance snapshot
        data = {
          acoId,
          performanceYear: year,
          measurementPeriod: {
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31),
          },
          assignedBeneficiaries: 15000,
          attributionChanges: 450,
          attributionStabilityRate: 97.0,
          overallQualityScore: 87.5,
          qualityMeasures: [],
          qualityDomainScores: {},
          totalExpenditure: 165000000,
          benchmark: 170000000,
          savings: 5000000,
          savingsRate: 2.94,
          costEfficiency: [],
          utilization: [],
          averageRiskScore: 1.24,
          riskScoreChange: 0.03,
          projectedPayment: 1500000,
        };
        break;

      case "attribution":
        // Mock attribution data
        data = {
          totalBeneficiaries: 15000,
          prospectiveAttribution: 12000,
          retrospectiveAttribution: 13500,
          voluntaryAlignment: 1500,
          attributionStability: 97.0,
          churnRate: 3.0,
          newAttributions: 600,
          lostAttributions: 450,
        };
        break;

      case "savings":
        // Mock shared savings calculation
        const benchmark = {
          year,
          totalBenchmark: 170000000,
          trendFactor: 0.035,
          regionalAdjustment: 0.01,
          newEnrolleeAdjustment: 0,
          historicalBenchmark: 165000000,
        };

        const performance = {
          totalExpenditure: 165000000,
          assignedBeneficiaries: 15000,
          perCapitaExpenditure: 11000,
          qualityScore: 87.5,
          minimumSavingsRate: 2.0,
        };

        data = calculateTwoSidedSavings(benchmark, performance);
        break;

      case "alerts":
        // Mock performance alerts
        data = [];
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid type parameter",
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch ACO data",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vbc/aco
 * Calculate ACO metrics or run attribution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result: any;

    switch (action) {
      case "calculate-savings":
        const { model, benchmark, performance } = params;

        switch (model) {
          case "one-sided":
            result = calculateOneSidedSavings(benchmark, performance);
            break;
          case "two-sided":
            result = calculateTwoSidedSavings(benchmark, performance);
            break;
          case "reach-professional":
            result = calculateReachProfessional(benchmark, performance, params.primaryCareCapitation);
            break;
          default:
            result = calculateTwoSidedSavings(benchmark, performance);
        }
        break;

      case "project-savings":
        result = projectSharedSavings(
          params.currentPerformance,
          params.benchmark,
          params.projectionMonths,
          params.model
        );
        break;

      case "calculate-risk":
        const riskProfile = generatePatientRiskProfile(
          params.patientId,
          params.age,
          params.gender,
          params.medicaidStatus || false,
          params.disabilityStatus || false,
          params.institutionalized || false,
          params.activeDiagnoses || []
        );
        result = riskProfile;
        break;

      case "population-risk":
        // Mock patient profiles
        const mockPatients = []; // Would come from database
        result = calculatePopulationRAF(mockPatients);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_ACTION",
              message: "Invalid action specified",
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to process ACO request",
        },
      },
      { status: 500 }
    );
  }
}

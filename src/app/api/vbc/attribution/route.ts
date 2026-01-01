/**
 * Patient Attribution API
 * Endpoints for ACO patient attribution and alignment
 */

import { NextRequest, NextResponse } from "next/server";
import {
  performStepwiseAttribution,
  performProspectiveAttribution,
  performRetrospectiveAttribution,
  processVoluntaryAlignment,
  detectAttributionChanges,
  calculateAttributionStability,
} from "@/lib/vbc/aco/attribution-engine";

/**
 * GET /api/vbc/attribution
 * Get patient attribution data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const acoId = searchParams.get("acoId");
    const type = searchParams.get("type") || "current";

    if (!patientId && !acoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Either patientId or acoId is required",
          },
        },
        { status: 400 }
      );
    }

    let data: any;

    switch (type) {
      case "current":
        if (patientId) {
          // Mock patient attribution
          data = {
            patientId,
            acoId: "ACO-123",
            providerId: "PROV-456",
            primaryCareProviderId: "PROV-456",
            attributionMethod: "retrospective",
            attributionModel: "step-wise",
            attributionDate: new Date(),
            effectiveDate: new Date(new Date().getFullYear(), 0, 1),
            alignmentScore: 85.5,
            visitCount: 8,
            primaryCareVisits: 6,
            specialtyVisits: 2,
            totalAllowedCharges: 12500,
            isVoluntary: false,
            riskScore: 1.35,
            hccCategories: ["HCC18", "HCC85"],
          };
        } else if (acoId) {
          // Mock ACO attribution summary
          data = {
            acoId,
            totalBeneficiaries: 15000,
            attributionByMethod: {
              prospective: 5000,
              retrospective: 8500,
              voluntary: 1500,
            },
            averageAlignmentScore: 82.3,
            stabilityRate: 97.0,
            churnRate: 3.0,
          };
        }
        break;

      case "history":
        // Mock attribution history
        data = {
          patientId,
          attributionHistory: [
            {
              acoId: "ACO-123",
              providerId: "PROV-456",
              effectiveDate: new Date(new Date().getFullYear(), 0, 1),
              expirationDate: new Date(new Date().getFullYear(), 11, 31),
              attributionMethod: "retrospective",
            },
            {
              acoId: "ACO-123",
              providerId: "PROV-456",
              effectiveDate: new Date(new Date().getFullYear() - 1, 0, 1),
              expirationDate: new Date(new Date().getFullYear() - 1, 11, 31),
              attributionMethod: "retrospective",
            },
          ],
        };
        break;

      case "changes":
        // Mock attribution changes
        data = {
          acoId,
          performanceYear: new Date().getFullYear(),
          totalChanges: 450,
          newAttributions: 600,
          transfers: 120,
          terminations: 270,
          changes: [],
        };
        break;

      case "stability":
        // Mock stability metrics
        data = {
          acoId,
          performanceYear: new Date().getFullYear(),
          stabilityRate: 97.0,
          churnRate: 3.0,
          averageAlignmentScore: 82.3,
          voluntaryRate: 10.0,
        };
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
          message: error instanceof Error ? error.message : "Failed to fetch attribution data",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vbc/attribution
 * Perform attribution calculations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result: any;

    switch (action) {
      case "stepwise-attribution":
        // Mock stepwise attribution
        // In production, would fetch claims and run algorithm
        result = {
          patientId: params.patientId,
          acoId: params.acoId,
          providerId: params.providerId,
          primaryCareProviderId: params.providerId,
          attributionMethod: "claims-based",
          attributionModel: "step-wise",
          attributionDate: new Date(),
          effectiveDate: new Date(),
          alignmentScore: 85.0,
          visitCount: 8,
          primaryCareVisits: 6,
          specialtyVisits: 2,
          totalAllowedCharges: 12500,
          isVoluntary: false,
          riskScore: 1.0,
          hccCategories: [],
        };
        break;

      case "prospective-attribution":
        // Mock prospective attribution
        result = {
          patientId: params.patientId,
          acoId: params.acoId,
          providerId: params.providerId,
          attributionMethod: "prospective",
          effectiveDate: new Date(params.performanceYearStart),
          expirationDate: new Date(new Date(params.performanceYearStart).getFullYear() + 1, 0, 0),
        };
        break;

      case "retrospective-attribution":
        // Mock retrospective attribution
        result = {
          patientId: params.patientId,
          acoId: params.acoId,
          providerId: params.providerId,
          attributionMethod: "retrospective",
          effectiveDate: new Date(params.performanceYearStart),
          expirationDate: new Date(params.performanceYearEnd),
        };
        break;

      case "voluntary-alignment":
        result = processVoluntaryAlignment(
          params.patientId,
          params.acoId,
          params.providerId,
          new Date(params.effectiveDate)
        );
        break;

      case "detect-changes":
        // Would fetch actual attribution data
        const previousAttributions = params.previousAttributions || [];
        const currentAttributions = params.currentAttributions || [];

        result = detectAttributionChanges(
          previousAttributions,
          currentAttributions
        );
        break;

      case "calculate-stability":
        result = calculateAttributionStability(
          params.attributions || [],
          params.changes || []
        );
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
          message: error instanceof Error ? error.message : "Failed to process attribution request",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vbc/attribution
 * Update patient attribution
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, acoId, providerId, method } = body;

    if (!patientId || !acoId || !providerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "patientId, acoId, and providerId are required",
          },
        },
        { status: 400 }
      );
    }

    // Mock update - would update database
    const result = {
      patientId,
      acoId,
      providerId,
      method: method || "manual-override",
      updatedAt: new Date(),
    };

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
          message: error instanceof Error ? error.message : "Failed to update attribution",
        },
      },
      { status: 500 }
    );
  }
}

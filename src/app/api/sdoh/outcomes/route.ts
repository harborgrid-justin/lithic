/**
 * SDOH Outcomes Tracking API Endpoints
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OutcomeTracker,
  CreateOutcomeSchema,
  MeasurementMethod,
  ImprovementLevel,
} from "@/lib/sdoh/outcomes/tracker";
import { SDOHAnalyticsEngine } from "@/lib/sdoh/outcomes/analytics";

// Initialize outcome tracker (in production, integrate with database)
const outcomeTracker = new OutcomeTracker();
const analyticsEngine = new SDOHAnalyticsEngine();

// ============================================================================
// POST /api/sdoh/outcomes - Create Outcome Tracking
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateOutcomeSchema.parse(body);

    const outcome = outcomeTracker.createOutcome(validatedData);

    return NextResponse.json({
      success: true,
      data: outcome,
    });
  } catch (error) {
    console.error("Outcome creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid outcome data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create outcome" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/outcomes - Get Outcomes
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outcomeId = searchParams.get("id");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const needsFollowUp = searchParams.get("needsFollowUp");

    if (outcomeId) {
      // Get specific outcome
      const outcome = outcomeTracker.getPatientOutcomes(outcomeId)[0];

      if (!outcome) {
        return NextResponse.json(
          { error: "Outcome not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: outcome,
      });
    }

    let outcomes = [];

    if (patientId) {
      outcomes = outcomeTracker.getPatientOutcomes(patientId);
    } else if (status) {
      outcomes = outcomeTracker.getOutcomesByStatus(status as any);
    } else if (needsFollowUp === "true") {
      outcomes = outcomeTracker.getOutcomesNeedingFollowUp();
    }

    return NextResponse.json({
      success: true,
      data: {
        outcomes,
        total: outcomes.length,
      },
    });
  } catch (error) {
    console.error("Outcome retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve outcomes" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/sdoh/outcomes - Add Measurement
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      outcomeId: z.string(),
      action: z.enum([
        "baseline",
        "followup",
        "resource",
        "intervention",
        "barrier",
        "resolve",
      ]),
      data: z.any(),
    });

    const { outcomeId, action, data } = schema.parse(body);

    let result;

    switch (action) {
      case "baseline":
        result = outcomeTracker.addBaselineMeasurement(outcomeId, {
          measurementDate: new Date(data.measurementDate),
          measuredBy: data.measuredBy,
          method: data.method || MeasurementMethod.PHONE_INTERVIEW,
          overallImprovement: ImprovementLevel.NO_CHANGE,
          ...data,
        });
        break;

      case "followup":
        result = outcomeTracker.addFollowUpMeasurement(outcomeId, {
          measurementDate: new Date(data.measurementDate),
          measuredBy: data.measuredBy,
          method: data.method || MeasurementMethod.PHONE_INTERVIEW,
          overallImprovement: data.overallImprovement,
          ...data,
        });
        break;

      case "resource":
        result = outcomeTracker.addResourceUsage(outcomeId, data);
        break;

      case "intervention":
        result = outcomeTracker.addIntervention(outcomeId, data);
        break;

      case "barrier":
        result = outcomeTracker.addBarrier(outcomeId, data);
        break;

      case "resolve":
        result = outcomeTracker.resolveOutcome(
          outcomeId,
          data.resolutionMethod,
          data.notes
        );
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Outcome update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid update data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update outcome" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sdoh/outcomes/analytics - Generate Analytics
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      organizationId: z.string(),
      timeRange: z.object({
        startDate: z.string(),
        endDate: z.string(),
        label: z.string(),
      }),
      includePopulationInsights: z.boolean().optional(),
    });

    const { organizationId, timeRange, includePopulationInsights } =
      schema.parse(body);

    // Get all outcomes for organization (in production, from database)
    const outcomes = outcomeTracker.getPatientOutcomes(""); // Placeholder

    const analytics = analyticsEngine.generateAnalytics(
      outcomes,
      organizationId,
      {
        startDate: new Date(timeRange.startDate),
        endDate: new Date(timeRange.endDate),
        label: timeRange.label,
      }
    );

    let populationInsights;
    if (includePopulationInsights) {
      populationInsights = analyticsEngine.generatePopulationInsights(outcomes);
    }

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        populationInsights,
      },
    });
  } catch (error) {
    console.error("Analytics generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid analytics request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/outcomes/trend - Get Improvement Trend
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outcomeId = searchParams.get("outcomeId");

    if (!outcomeId) {
      return NextResponse.json(
        { error: "outcomeId required" },
        { status: 400 }
      );
    }

    const trend = outcomeTracker.calculateImprovementTrend(outcomeId);

    return NextResponse.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error("Trend calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate trend" },
      { status: 500 }
    );
  }
}

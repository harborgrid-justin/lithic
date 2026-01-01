/**
 * SDOH Screening API Endpoints
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  PrapareScreeningSchema,
  calculatePrapareScore,
} from "@/lib/sdoh/screening/prapare";
import {
  AHCScreeningSchema,
  processAHCScreening,
} from "@/lib/sdoh/screening/ahc-hrsn";
import { mapScreeningToZCodes } from "@/lib/sdoh/screening/z-code-mapper";

// ============================================================================
// POST /api/sdoh/screen - Submit SDOH Screening
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const schema = z.object({
      type: z.enum(["PRAPARE", "AHC_HRSN", "CUSTOM"]),
      patientId: z.string(),
      organizationId: z.string(),
      responses: z.array(z.any()),
      completedBy: z.string(),
      encounterId: z.string().optional(),
      language: z.string().default("en"),
    });

    const validatedData = schema.parse(body);

    let result;
    let zCodes = [];

    // Process based on screening type
    if (validatedData.type === "PRAPARE") {
      result = calculatePrapareScore(validatedData.responses);

      // Map to Z-codes
      zCodes = mapScreeningToZCodes(
        result.identifiedNeeds.map((n) => n.category),
        {}
      );
    } else if (validatedData.type === "AHC_HRSN") {
      result = processAHCScreening(validatedData.responses, false);

      // Map to Z-codes
      zCodes = mapScreeningToZCodes(
        result.identifiedDomains.map((d) => d.toString()),
        {}
      );
    }

    // TODO: Save to database
    // await prisma.sdohScreening.create({ data: ... });

    return NextResponse.json({
      success: true,
      data: {
        screeningId: `SCR-${Date.now()}`,
        result,
        zCodes: zCodes.slice(0, 5), // Top 5 Z-codes
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Screening submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process screening" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/sdoh/screen - Get Screening Results
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const screeningId = searchParams.get("screeningId");

    if (!patientId && !screeningId) {
      return NextResponse.json(
        { error: "patientId or screeningId required" },
        { status: 400 }
      );
    }

    // TODO: Fetch from database
    // const screenings = await prisma.sdohScreening.findMany({ where: ... });

    return NextResponse.json({
      success: true,
      data: {
        screenings: [],
        total: 0,
      },
    });
  } catch (error) {
    console.error("Screening retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve screenings" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/sdoh/screen - Update Screening
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      screeningId: z.string(),
      status: z.enum(["DRAFT", "COMPLETED", "REVIEWED"]),
      notes: z.string().optional(),
      updatedBy: z.string(),
    });

    const validatedData = schema.parse(body);

    // TODO: Update in database
    // await prisma.sdohScreening.update({ where: ..., data: ... });

    return NextResponse.json({
      success: true,
      data: {
        screeningId: validatedData.screeningId,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Screening update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update screening" },
      { status: 500 }
    );
  }
}

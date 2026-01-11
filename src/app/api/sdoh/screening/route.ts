/**
 * SDOH Screening API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { ScreeningEngine } from "@/lib/sdoh/screening-engine";
import { getPRAPAREQuestionnaire } from "@/lib/sdoh/questionnaires/prapare";
import { getAHCHRSNQuestionnaire } from "@/lib/sdoh/questionnaires/ahc-hrsn";
import { riskScorer } from "@/lib/sdoh/risk-scorer";
import { zCodeMapper } from "@/lib/sdoh/z-code-mapper";
import { type CreateScreeningDto, QuestionnaireType } from "@/types/sdoh";

export async function POST(request: NextRequest) {
  try {
    const body: CreateScreeningDto = await request.json();

    // Get appropriate questionnaire
    const questionnaire =
      body.questionnaireType === "PRAPARE"
        ? getPRAPAREQuestionnaire()
        : getAHCHRSNQuestionnaire();

    // Initialize screening engine
    const engine = new ScreeningEngine(questionnaire);

    // Create new screening
    const screening = engine.initializeScreening(
      body.patientId,
      body.administeredBy,
      body.encounterId,
      body.language
    );

    // Save to database (simulated)
    // await db.screenings.create(screening);

    return NextResponse.json(
      {
        success: true,
        screening,
        questionnaire,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Screening creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create screening" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const organizationId = searchParams.get("organizationId");

    // Fetch screenings from database (simulated)
    // const screenings = await db.screenings.findMany({ where: { patientId } });

    const screenings: any[] = [];

    return NextResponse.json({
      success: true,
      screenings,
      total: screenings.length,
    });
  } catch (error) {
    console.error("Screening fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch screenings" },
      { status: 500 }
    );
  }
}

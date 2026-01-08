/**
 * Eligibility Assessment API Route
 * Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from "next/server";
import { eligibilityEngine } from "@/lib/research/eligibility-engine";

export async function POST(request: NextRequest) {
  try {
    const { patientId, trialId, patientData, criteria } = await request.json();
    const userId = "user_123"; // Would get from session

    const assessment = await eligibilityEngine.assessEligibility(
      patientId,
      trialId,
      criteria,
      patientData,
      userId
    );

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assess eligibility" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const trialId = searchParams.get("trialId");

    if (patientId) {
      const assessments = await eligibilityEngine.getPatientAssessments(patientId);
      return NextResponse.json(assessments);
    }

    if (trialId) {
      const assessments = await eligibilityEngine.getTrialAssessments(trialId);
      return NextResponse.json(assessments);
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

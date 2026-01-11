/**
 * Genetic Tests API Route
 * Handles genetic test data retrieval and creation
 */

import { NextRequest, NextResponse } from "next/server";
import type { GenomicData, CreateGeneticTestDto } from "@/types/genomics";
import { GenomicsService } from "@/lib/genomics/genomics-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const genomicData = await GenomicsService.getPatientGenomicData(patientId);

    return NextResponse.json(genomicData);
  } catch (error) {
    console.error("Error fetching genomic tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateGeneticTestDto = await request.json();

    // Validate required fields
    if (!body.patientId || !body.testType || !body.laboratory) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const genomicData = await GenomicsService.createGeneticTest(body);

    return NextResponse.json(genomicData, { status: 201 });
  } catch (error) {
    console.error("Error creating genetic test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Vital Signs Readings API Routes
 * /api/rpm/readings
 */

import { NextRequest, NextResponse } from "next/server";
import { vitalSignsCollector } from "@/lib/rpm/vital-signs-collector";
import { getServerSession } from "next-auth";
import type { CreateReadingDto, ReadingType } from "@/types/rpm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const readingType = searchParams.get("readingType") as ReadingType | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const readings = await vitalSignsCollector.getPatientReadings(patientId, {
      readingType: readingType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error("Error fetching readings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateReadingDto = await request.json();

    const reading = await vitalSignsCollector.collectReading(
      body,
      session.user.id,
      session.user.organizationId
    );

    return NextResponse.json(reading, { status: 201 });
  } catch (error) {
    console.error("Error creating reading:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaseScheduler } from "@/lib/or/scheduling/case-scheduler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const roomId = searchParams.get("roomId");
    const surgeonId = searchParams.get("surgeonId");
    const status = searchParams.get("status");

    // In production, would query actual database
    // For now, return mock data
    const mockCases = [
      {
        id: "case1",
        caseNumber: "OR-2026-001",
        patientId: "patient1",
        patientName: "John Doe",
        mrn: "MRN001",
        surgeonId: "surgeon1",
        surgeonName: "Dr. Smith",
        procedureId: "proc1",
        procedureName: "Total Knee Replacement",
        cptCodes: ["27447"],
        scheduledDate: new Date().toISOString(),
        scheduledStartTime: new Date(new Date().setHours(7, 30, 0, 0)).toISOString(),
        scheduledEndTime: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
        estimatedDuration: 120,
        roomId: "room1",
        roomName: "OR 1",
        status: "SCHEDULED",
        priority: "ELECTIVE",
        anesthesiaType: "GENERAL",
      },
    ];

    let filtered = mockCases;

    if (surgeonId) {
      filtered = filtered.filter((c) => c.surgeonId === surgeonId);
    }
    if (roomId) {
      filtered = filtered.filter((c) => c.roomId === roomId);
    }
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching OR cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch OR cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.patientId || !body.surgeonId || !body.procedureId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newCase = {
      id: `case_${Date.now()}`,
      caseNumber: `OR-2026-${Math.floor(Math.random() * 1000)}`,
      ...body,
      status: "SCHEDULED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating OR case:", error);
    return NextResponse.json(
      { error: "Failed to create OR case" },
      { status: 500 }
    );
  }
}

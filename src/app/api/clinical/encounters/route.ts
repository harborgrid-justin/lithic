import { NextRequest, NextResponse } from "next/server";
import { Encounter } from "@/types/clinical";

// Mock data - replace with actual database calls
let encounters: Encounter[] = [
  {
    id: "1",
    patientId: "P001",
    patientName: "John Doe",
    providerId: "PR001",
    providerName: "Dr. Sarah Smith",
    type: "office-visit",
    status: "completed",
    date: "2024-01-15T10:00:00Z",
    chiefComplaint: "Annual physical examination",
    diagnosis: [
      {
        id: "D1",
        icd10Code: "Z00.00",
        description:
          "Encounter for general adult medical examination without abnormal findings",
        type: "primary",
        status: "active",
      },
    ],
    procedures: [],
    createdAt: "2024-01-15T09:30:00Z",
    updatedAt: "2024-01-15T11:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get("patientId");

  let filtered = encounters;
  if (patientId) {
    filtered = encounters.filter((e) => e.patientId === patientId);
  }

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newEncounter: Encounter = {
    id: `E${encounters.length + 1}`,
    patientId: body.patientId,
    patientName: body.patientName,
    providerId: body.providerId,
    providerName: body.providerName,
    type: body.type,
    status: body.status || "scheduled",
    date: body.date,
    chiefComplaint: body.chiefComplaint,
    diagnosis: body.diagnosis || [],
    procedures: body.procedures || [],
    vitals: body.vitals,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  encounters.push(newEncounter);

  return NextResponse.json(newEncounter, { status: 201 });
}

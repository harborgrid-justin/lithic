import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");

    const mockResources = {
      equipment: [
        { id: "eq1", name: "C-Arm Fluoroscopy", type: "IMAGING_DEVICE", status: "AVAILABLE" },
        { id: "eq2", name: "Arthroscope", type: "ENDOSCOPE", status: "AVAILABLE" },
      ],
      staff: [
        { id: "staff1", name: "Jane Doe, RN", role: "CIRCULATING_NURSE", available: true },
        { id: "staff2", name: "Bob Smith, ST", role: "SURGICAL_TECH", available: true },
      ],
      rooms: [
        { id: "room1", name: "OR 1", type: "GENERAL", status: "AVAILABLE" },
        { id: "room2", name: "OR 2", type: "ORTHO", status: "AVAILABLE" },
      ],
    };

    if (type && type in mockResources) {
      return NextResponse.json(mockResources[type as keyof typeof mockResources]);
    }

    return NextResponse.json(mockResources);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

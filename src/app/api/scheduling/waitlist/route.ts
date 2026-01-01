import { NextRequest, NextResponse } from "next/server";

// Mock waitlist data
const mockWaitlist = [
  {
    id: "w1",
    patientId: "p1",
    providerId: "pr1",
    appointmentType: "consultation",
    priority: "high",
    preferredDates: [],
    preferredTimes: [],
    notes: "Urgent follow-up needed",
    createdAt: new Date().toISOString(),
    status: "active",
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");

    let filtered = [...mockWaitlist];

    if (providerId) {
      filtered = filtered.filter((entry) => entry.providerId === providerId);
    }
    if (status) {
      filtered = filtered.filter((entry) => entry.status === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    mockWaitlist.push(newEntry);

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to create waitlist entry" },
      { status: 500 },
    );
  }
}

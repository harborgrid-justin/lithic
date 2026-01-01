import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const admittedBy = body.admittedBy;

    if (!admittedBy) {
      return NextResponse.json(
        { error: "admittedBy is required" },
        { status: 400 },
      );
    }

    const entry = await TelehealthService.admitFromWaitingRoom(
      params.id,
      admittedBy,
    );

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error("Error admitting patient:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const entry = await TelehealthService.getWaitingRoomEntry(params.id);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error("Error fetching waiting room entry:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

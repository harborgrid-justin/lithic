import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";
import { JoinWaitingRoomDto } from "@/types/telehealth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const entry = await TelehealthService.getWaitingRoomBySession(sessionId);
      return NextResponse.json(entry);
    }

    if (providerId) {
      const entries =
        await TelehealthService.getProviderWaitingRoom(providerId);
      return NextResponse.json(entries);
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error fetching waiting room:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const dto: JoinWaitingRoomDto = {
      sessionId: body.sessionId,
      patientId: body.patientId,
      preVisitData: body.preVisitData,
      technicalCheckResults: body.technicalCheckResults,
    };

    const entry = await TelehealthService.joinWaitingRoom(dto);

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error("Error joining waiting room:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

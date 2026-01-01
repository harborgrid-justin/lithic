import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";
import { StartRecordingDto } from "@/types/telehealth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const recordings = await TelehealthService.getSessionRecordings(sessionId);
    return NextResponse.json(recordings);
  } catch (error: any) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const dto: StartRecordingDto = {
      sessionId: body.sessionId,
      userId: body.userId,
      quality: body.quality || "MEDIUM",
      consentDocumentId: body.consentDocumentId,
    };

    const recording = await TelehealthService.startRecording(dto);

    return NextResponse.json(recording, { status: 201 });
  } catch (error: any) {
    console.error("Error starting recording:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

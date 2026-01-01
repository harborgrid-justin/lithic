import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";
import { CreateSessionDto } from "@/types/telehealth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    if (upcoming && providerId) {
      const sessions = await TelehealthService.getUpcomingSessions(
        providerId,
        "provider",
      );
      return NextResponse.json(sessions);
    }

    if (upcoming && patientId) {
      const sessions = await TelehealthService.getUpcomingSessions(
        patientId,
        "patient",
      );
      return NextResponse.json(sessions);
    }

    if (providerId) {
      const sessions =
        await TelehealthService.getSessionsByProvider(providerId);
      const filtered = status
        ? sessions.filter((s) => s.status === status)
        : sessions;
      return NextResponse.json(filtered);
    }

    if (patientId) {
      const sessions = await TelehealthService.getSessionsByPatient(patientId);
      const filtered = status
        ? sessions.filter((s) => s.status === status)
        : sessions;
      return NextResponse.json(filtered);
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const dto: CreateSessionDto = {
      patientId: body.patientId,
      providerId: body.providerId,
      appointmentId: body.appointmentId,
      type: body.type,
      scheduledStartTime: new Date(body.scheduledStartTime),
      scheduledEndTime: new Date(body.scheduledEndTime),
      recordingEnabled: body.recordingEnabled || false,
      notes: body.notes,
    };

    const session = await TelehealthService.createSession(dto);

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

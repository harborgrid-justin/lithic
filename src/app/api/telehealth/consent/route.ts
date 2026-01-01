import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, signature, ipAddress } = body;

    if (!sessionId || !signature) {
      return NextResponse.json(
        { error: "sessionId and signature are required" },
        { status: 400 },
      );
    }

    const session = await TelehealthService.obtainRecordingConsent(
      sessionId,
      signature,
      ipAddress || request.headers.get("x-forwarded-for") || "unknown",
    );

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error obtaining consent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

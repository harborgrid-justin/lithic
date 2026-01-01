import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const recording = await TelehealthService.stopRecording(params.id);
    return NextResponse.json(recording);
  } catch (error: any) {
    console.error("Error stopping recording:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

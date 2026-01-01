import { NextRequest, NextResponse } from "next/server";
import { TelehealthService } from "@/lib/services/telehealth-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await TelehealthService.getSession(params.id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const session = await TelehealthService.updateSession({
      id: params.id,
      ...body,
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

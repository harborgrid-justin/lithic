/**
 * Adverse Events API Route
 * Lithic Healthcare Platform v0.5
 */

import { NextRequest, NextResponse } from "next/server";
import { adverseEventTracker } from "@/lib/research/adverse-events";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const userId = "user_123"; // Would get from session

    const event = await adverseEventTracker.reportAdverseEvent(data, userId);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to report adverse event" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trialId = searchParams.get("trialId");
    const subjectId = searchParams.get("subjectId");
    const serious = searchParams.get("serious") === "true";

    if (serious && trialId) {
      const events = await adverseEventTracker.getSeriousAdverseEvents(trialId);
      return NextResponse.json(events);
    }

    if (trialId) {
      const events = await adverseEventTracker.getTrialAdverseEvents(trialId);
      return NextResponse.json(events);
    }

    if (subjectId) {
      const events = await adverseEventTracker.getSubjectAdverseEvents(subjectId);
      return NextResponse.json(events);
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch adverse events" },
      { status: 500 }
    );
  }
}

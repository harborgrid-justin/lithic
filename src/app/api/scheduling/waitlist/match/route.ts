/**
 * Waitlist Matching API Route
 * Auto-match waitlist entries to available slots
 */

import { NextRequest, NextResponse } from "next/server";
import { getWaitlistManager } from "@/lib/scheduling/waitlist";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { availableSlots } = data;

    if (!availableSlots || !Array.isArray(availableSlots)) {
      return NextResponse.json(
        { success: false, error: "Invalid slots data" },
        { status: 400 }
      );
    }

    const waitlistManager = getWaitlistManager();

    // Auto-assign slots to waitlist entries
    const result = waitlistManager.autoAssignSlots(availableSlots);

    return NextResponse.json({
      success: true,
      assignments: result.assignments,
      notified: result.notified,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Error matching waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to match waitlist entries" },
      { status: 500 }
    );
  }
}

// GET - Find matches for specific entry
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entryId = searchParams.get("entryId");

    const waitlistManager = getWaitlistManager();

    // In real implementation, would fetch available slots from database
    const mockSlots: any[] = [];

    const matches = waitlistManager.findMatchingSlots(mockSlots, entryId || undefined);

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length,
    });
  } catch (error) {
    console.error("Error finding matches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to find matches" },
      { status: 500 }
    );
  }
}

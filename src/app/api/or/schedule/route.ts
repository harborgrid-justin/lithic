import { NextRequest, NextResponse } from "next/server";
import { getRoomOptimizer } from "@/lib/or/scheduling/room-optimizer";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const mockSchedule = {
      date,
      rooms: [
        {
          roomId: "room1",
          roomName: "OR 1",
          cases: [
            {
              caseId: "case1",
              startTime: "07:30",
              endTime: "09:30",
              surgeon: "Dr. Smith",
              procedure: "Total Knee Replacement",
              patient: "John Doe",
            },
          ],
          utilizationRate: 75,
        },
      ],
      summary: {
        totalCases: 1,
        avgUtilization: 75,
        availableSlots: 3,
      },
    };

    return NextResponse.json(mockSchedule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

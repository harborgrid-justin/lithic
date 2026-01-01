import { NextRequest, NextResponse } from "next/server";

// Mock database for scheduled reports
const scheduledReports: Record<string, any> = {
  "report-1": {
    id: "report-1",
    name: "Weekly Quality Report",
    schedule: {
      frequency: "weekly",
      time: "09:00",
      dayOfWeek: 1,
    },
    recipients: ["admin@example.com", "quality@example.com"],
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  "report-2": {
    id: "report-2",
    name: "Monthly Financial Report",
    schedule: {
      frequency: "monthly",
      time: "08:00",
      dayOfMonth: 1,
    },
    recipients: ["cfo@example.com", "finance@example.com"],
    lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
};

/**
 * GET /api/analytics/scheduled
 * Get all scheduled reports
 */
export async function GET(request: NextRequest) {
  try {
    const reports = Object.values(scheduledReports);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/analytics/scheduled
 * Create a new scheduled report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, query, format, schedule, recipients } = body;

    const reportId = `report-${Date.now()}`;

    // Calculate next run time based on schedule
    const nextRun = calculateNextRun(schedule);

    const scheduledReport = {
      id: reportId,
      name,
      query,
      format,
      schedule,
      recipients,
      nextRun: nextRun.toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    scheduledReports[reportId] = scheduledReport;

    return NextResponse.json({ id: reportId }, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled report" },
      { status: 500 },
    );
  }
}

/**
 * Helper function to calculate next run time
 */
function calculateNextRun(schedule: any): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      const targetDay = schedule.dayOfWeek;
      const currentDay = nextRun.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0 || (daysToAdd === 0 && nextRun <= now)) {
        daysToAdd += 7;
      }
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;

    case "monthly":
      nextRun.setDate(schedule.dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;

    case "quarterly":
      const currentMonth = nextRun.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      nextRun.setMonth(quarterStartMonth);
      nextRun.setDate(schedule.dayOfMonth || 1);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;

    default:
      // For 'once' or unknown frequencies
      break;
  }

  return nextRun;
}

/**
 * POST /api/analytics/scheduled/[id]/pause
 * Pause a scheduled report
 */
export async function PUT(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const parts = pathname.split("/");
    const id = parts[parts.length - 2];
    const action = parts[parts.length - 1];

    if (!scheduledReports[id]) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 },
      );
    }

    if (action === "pause") {
      scheduledReports[id].status = "paused";
    } else if (action === "resume") {
      scheduledReports[id].status = "active";
      scheduledReports[id].nextRun = calculateNextRun(
        scheduledReports[id].schedule,
      ).toISOString();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled report" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getUtilizationAnalyzer } from "@/lib/or/analytics/utilization";
import { getPerformanceAnalyzer } from "@/lib/or/analytics/performance";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get("metric");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const mockAnalytics = {
      utilization: {
        overall: 78.5,
        primeTime: 85.2,
        byRoom: [
          { room: "OR 1", utilization: 82 },
          { room: "OR 2", utilization: 75 },
        ],
      },
      performance: {
        onTimeStarts: 85,
        avgTurnover: 32,
        cancellationRate: 3.5,
      },
      trends: {
        utilizationTrend: "increasing",
        volumeTrend: "stable",
      },
    };

    if (metric && metric in mockAnalytics) {
      return NextResponse.json(mockAnalytics[metric as keyof typeof mockAnalytics]);
    }

    return NextResponse.json(mockAnalytics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

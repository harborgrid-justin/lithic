/**
 * RPM Alerts API Routes
 * /api/rpm/alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { alertEngine } from "@/lib/rpm/alert-engine";
import { getServerSession } from "next-auth";
import type { AlertSeverity, AlertStatus } from "@/types/rpm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const status = searchParams.get("status") as AlertStatus | null;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const alerts = await alertEngine.getPatientAlerts(patientId, {
      severity: severity ? [severity] : undefined,
      status: status ? [status] : undefined,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

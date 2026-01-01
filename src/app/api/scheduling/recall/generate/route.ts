/**
 * Recall Generation API Route
 * Generate recall list for patients
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecallManager } from "@/lib/scheduling/recall";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      patientId,
      patientInfo,
      appointments,
    } = data;

    if (!patientId || !patientInfo) {
      return NextResponse.json(
        { success: false, error: "Missing required patient information" },
        { status: 400 }
      );
    }

    const recallManager = getRecallManager();

    // Generate recalls for patient
    const recalls = recallManager.generateRecalls(
      patientId,
      {
        name: patientInfo.name,
        dateOfBirth: new Date(patientInfo.dateOfBirth),
        gender: patientInfo.gender,
        conditions: patientInfo.conditions,
      },
      appointments || []
    );

    return NextResponse.json({
      success: true,
      recalls,
      count: recalls.length,
    });
  } catch (error) {
    console.error("Error generating recalls:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recalls" },
      { status: 500 }
    );
  }
}

// GET - Get compliance report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    const recallManager = getRecallManager();

    // In real implementation, would fetch from database
    const mockRecalls: any[] = [];

    const report = recallManager.generateComplianceReport(
      mockRecalls,
      category as any
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating compliance report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

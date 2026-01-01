/**
 * Scheduling Optimization API Route
 * Smart scheduling suggestions and gap filling
 */

import { NextRequest, NextResponse } from "next/server";
import { getOptimizationEngine } from "@/lib/scheduling/optimization";
import { getResourceManager } from "@/lib/scheduling/resources";
import type { AppointmentType, PreferredTime } from "@/types/scheduling";

// Mock data storage - In production, use actual database
const mockSchedules: any[] = [];
const mockAppointments: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      appointmentType,
      duration,
      providerIds,
      patientPreferences,
      criteria,
    } = data;

    const optimizationEngine = getOptimizationEngine();

    // Get suggestions
    const suggestions = optimizationEngine.suggestOptimalSlots(
      appointmentType as AppointmentType,
      duration || 30,
      providerIds || [],
      mockSchedules,
      mockAppointments,
      patientPreferences,
      criteria
    );

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error("Error generating scheduling suggestions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

// GET - Analyze gaps
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const date = searchParams.get("date");

    if (!providerId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const optimizationEngine = getOptimizationEngine();
    const resourceManager = getResourceManager();

    const schedule = mockSchedules.find((s: any) => s.providerId === providerId);
    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    const providerAppointments = mockAppointments.filter(
      (a: any) => a.providerId === providerId
    );

    const gapAnalysis = optimizationEngine.analyzeGaps(
      providerId,
      schedule,
      providerAppointments,
      new Date(date)
    );

    return NextResponse.json({
      success: true,
      analysis: gapAnalysis,
    });
  } catch (error) {
    console.error("Error analyzing gaps:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze gaps" },
      { status: 500 }
    );
  }
}

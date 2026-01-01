/**
 * Appointment Validation API Route
 * Validate appointments against scheduling constraints
 */

import { NextRequest, NextResponse } from "next/server";
import { getSchedulingEngine } from "@/lib/scheduling/engine";
import type { SchedulingContext } from "@/lib/scheduling/engine";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      appointment,
      scheduleId,
      providerId,
      allowOverbooking,
      breakGlass,
    } = data;

    if (!appointment || !providerId) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    const schedulingEngine = getSchedulingEngine();

    // In real implementation, would fetch from database
    const mockSchedule: any = {
      id: scheduleId,
      providerId,
      timeSlots: [],
      exceptions: [],
      maxConcurrent: 1,
      bufferTime: 0,
      allowOverlap: false,
    };
    const mockExistingAppointments: any[] = [];

    const context: SchedulingContext = {
      appointment: {
        ...appointment,
        startTime: new Date(appointment.startTime),
      },
      schedule: mockSchedule,
      existingAppointments: mockExistingAppointments,
      allowOverbooking,
      breakGlass,
    };

    const validation = schedulingEngine.validateAppointment(context);

    return NextResponse.json({
      success: true,
      valid: validation.valid,
      violations: validation.violations,
      suggestions: validation.suggestions,
    });
  } catch (error) {
    console.error("Error validating appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate appointment" },
      { status: 500 }
    );
  }
}

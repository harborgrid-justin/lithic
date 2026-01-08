/**
 * Device Management API Routes
 * /api/rpm/devices
 */

import { NextRequest, NextResponse } from "next/server";
import { deviceManager } from "@/lib/rpm/device-manager";
import { getServerSession } from "next-auth";
import type { CreateDeviceDto } from "@/types/rpm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const devices = await deviceManager.getPatientDevices(patientId);

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateDeviceDto = await request.json();

    const device = await deviceManager.registerDevice(
      body,
      session.user.id,
      session.user.organizationId
    );

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

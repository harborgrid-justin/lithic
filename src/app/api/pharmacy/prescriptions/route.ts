/**
 * Prescriptions API Route
 * Handle prescription listing and creation
 */

import { NextRequest, NextResponse } from "next/server";

// Mock database - In production, this would connect to a real database
let prescriptions: any[] = [];
let rxCounter = 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const prescriberId = searchParams.get("prescriberId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let filtered = [...prescriptions];

    if (patientId) {
      filtered = filtered.filter((p) => p.patientId === patientId);
    }

    if (prescriberId) {
      filtered = filtered.filter((p) => p.prescriberId === prescriberId);
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (startDate) {
      filtered = filtered.filter(
        (p) => new Date(p.writtenDate) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (p) => new Date(p.writtenDate) <= new Date(endDate),
      );
    }

    // Sort by written date, newest first
    filtered.sort(
      (a, b) =>
        new Date(b.writtenDate).getTime() - new Date(a.writtenDate).getTime(),
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate Rx number
    const rxNumber = `RX${String(rxCounter++).padStart(7, "0")}`;

    // Calculate expiration date based on controlled status
    const writtenDate = new Date(data.writtenDate);
    const expirationDate = new Date(writtenDate);
    if (data.drug?.deaSchedule) {
      expirationDate.setMonth(expirationDate.getMonth() + 6);
    } else {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }

    // Calculate next refill date if applicable
    let nextRefillDate = null;
    if (data.refillsRemaining > 0 && data.lastFilledDate) {
      const lastFilled = new Date(data.lastFilledDate);
      nextRefillDate = new Date(lastFilled);
      nextRefillDate.setDate(nextRefillDate.getDate() + data.daysSupply - 3); // Allow 3 days early
    }

    const prescription = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rxNumber,
      ...data,
      expirationDate: expirationDate.toISOString().split("T")[0] || "",
      nextRefillDate: nextRefillDate
        ? nextRefillDate.toISOString().split("T")[0] || ""
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prescriptions.push(prescription);

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 },
    );
  }
}

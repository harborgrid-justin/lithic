/**
 * Prescription Detail API Route
 * Handle individual prescription operations
 */

import { NextRequest, NextResponse } from "next/server";

// Mock database - shared with prescriptions/route.ts in production
const prescriptionsDb: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const prescription = prescriptionsDb.find((p) => p.id === params.id);

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await request.json();
    const index = prescriptionsDb.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    prescriptionsDb[index] = {
      ...prescriptionsDb[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(prescriptionsDb[index]);
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const index = prescriptionsDb.findIndex((p) => p.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    prescriptionsDb.splice(index, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: "Failed to delete prescription" },
      { status: 500 },
    );
  }
}

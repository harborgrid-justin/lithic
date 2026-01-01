import { NextRequest, NextResponse } from "next/server";
import { LabResult } from "@/types/laboratory";

// Mock database
let results: LabResult[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const result = results.find((r) => r.id === params.id);

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch result" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const updates = await request.json();
    const resultIndex = results.findIndex((r) => r.id === params.id);

    if (resultIndex === -1) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    results[resultIndex] = {
      ...results[resultIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return NextResponse.json(results[resultIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const resultIndex = results.findIndex((r) => r.id === params.id);

    if (resultIndex === -1) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    results.splice(resultIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 },
    );
  }
}

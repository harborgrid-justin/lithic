import { NextRequest, NextResponse } from "next/server";

// Mock database - replace with actual database in production
const studies: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const study = studies.find(
      (s) => s.id === params.id || s.studyInstanceUID === params.id,
    );

    if (!study) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    return NextResponse.json(study);
  } catch (error) {
    console.error("Error fetching study:", error);
    return NextResponse.json(
      { error: "Failed to fetch study" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const studyIndex = studies.findIndex(
      (s) => s.id === params.id || s.studyInstanceUID === params.id,
    );

    if (studyIndex === -1) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    studies[studyIndex] = {
      ...studies[studyIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(studies[studyIndex]);
  } catch (error) {
    console.error("Error updating study:", error);
    return NextResponse.json(
      { error: "Failed to update study" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const studyIndex = studies.findIndex(
      (s) => s.id === params.id || s.studyInstanceUID === params.id,
    );

    if (studyIndex === -1) {
      return NextResponse.json({ error: "Study not found" }, { status: 404 });
    }

    studies.splice(studyIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting study:", error);
    return NextResponse.json(
      { error: "Failed to delete study" },
      { status: 500 },
    );
  }
}

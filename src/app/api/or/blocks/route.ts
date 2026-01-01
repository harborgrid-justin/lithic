import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const surgeonId = searchParams.get("surgeonId");
    const dayOfWeek = searchParams.get("dayOfWeek");

    const mockBlocks = [
      {
        id: "block1",
        blockName: "Dr. Smith Ortho Block",
        surgeonId: "surgeon1",
        surgeonName: "Dr. Smith",
        roomId: "room1",
        roomName: "OR 1",
        dayOfWeek: 1,
        startTime: "07:00",
        endTime: "15:00",
        duration: 480,
        status: "ACTIVE",
        utilizationTarget: 85,
      },
    ];

    let filtered = mockBlocks;
    if (surgeonId) filtered = filtered.filter((b) => b.surgeonId === surgeonId);
    if (dayOfWeek) filtered = filtered.filter((b) => b.dayOfWeek === parseInt(dayOfWeek));

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newBlock = { id: `block_${Date.now()}`, ...body, status: "ACTIVE" };
    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create block" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

// WebRTC signaling endpoint
// In production, this should use WebSocket for real-time communication
// This is a simplified REST-based approach for demonstration

let signalingMessages: any[] = [];
let sessionParticipants: Map<string, Set<string>> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sessionId, from, to, data } = body;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      sessionId,
      from,
      to,
      data,
      timestamp: new Date().toISOString(),
    };

    signalingMessages.push(message);

    // Track participants
    if (!sessionParticipants.has(sessionId)) {
      sessionParticipants.set(sessionId, new Set());
    }
    sessionParticipants.get(sessionId)!.add(from);

    // Clean up old messages (keep only last 1000)
    if (signalingMessages.length > 1000) {
      signalingMessages = signalingMessages.slice(-1000);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Error processing signaling message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");
    const since = searchParams.get("since");

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    let filtered = signalingMessages.filter((msg) => {
      // Get messages for this session that are addressed to this user or broadcast
      return (
        msg.sessionId === sessionId &&
        (msg.to === userId || msg.to === null || msg.to === "all")
      );
    });

    // Filter by timestamp if provided
    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter((msg) => new Date(msg.timestamp) > sinceDate);
    }

    return NextResponse.json({ messages: filtered });
  } catch (error: any) {
    console.error("Error fetching signaling messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Remove all messages for this session
    signalingMessages = signalingMessages.filter(
      (msg) => msg.sessionId !== sessionId,
    );
    sessionParticipants.delete(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cleaning up signaling messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

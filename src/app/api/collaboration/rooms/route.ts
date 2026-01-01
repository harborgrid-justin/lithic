/**
 * Video Conference Rooms API
 * Handles room creation, listing, and management
 */

import { NextRequest, NextResponse } from "next/server";
import { videoRoomManager } from "@/lib/collaboration/video/room-manager";
import { z } from "zod";

const CreateRoomSchema = z.object({
  organizationId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["CONSULTATION", "TEAM_MEETING", "CLINICAL_REVIEW", "EDUCATION"]),
  maxParticipants: z.number().default(50),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)).optional(),
  hostId: z.string(),
  settings: z.object({
    allowScreenShare: z.boolean().default(true),
    allowChat: z.boolean().default(true),
    allowFileShare: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    lobbyEnabled: z.boolean().default(false),
    muteOnJoin: z.boolean().default(false),
    e2eEncryption: z.boolean().default(false),
    waitingRoomEnabled: z.boolean().default(false),
  }).optional(),
});

/**
 * GET /api/collaboration/rooms
 * List all rooms or filter by organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    let rooms = organizationId
      ? videoRoomManager.getOrganizationRooms(organizationId)
      : videoRoomManager.getActiveRooms();

    if (status === "active") {
      rooms = videoRoomManager.getActiveRooms();
    }

    return NextResponse.json({
      success: true,
      data: rooms,
      count: rooms.length,
    });
  } catch (error: any) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch rooms",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collaboration/rooms
 * Create a new video room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateRoomSchema.parse(body);

    const room = await videoRoomManager.createRoom({
      ...validated,
      metadata: {},
    });

    return NextResponse.json({
      success: true,
      data: room,
      message: "Room created successfully",
    });
  } catch (error: any) {
    console.error("Error creating room:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create room",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration/rooms
 * Cleanup old rooms
 */
export async function DELETE(request: NextRequest) {
  try {
    const cleaned = await videoRoomManager.cleanupOldRooms();

    return NextResponse.json({
      success: true,
      data: { cleanedCount: cleaned },
      message: `Cleaned up ${cleaned} old rooms`,
    });
  } catch (error: any) {
    console.error("Error cleaning up rooms:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to cleanup rooms",
      },
      { status: 500 }
    );
  }
}

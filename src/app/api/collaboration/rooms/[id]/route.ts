/**
 * Individual Video Room API
 * Handles specific room operations
 */

import { NextRequest, NextResponse } from "next/server";
import { videoRoomManager } from "@/lib/collaboration/video/room-manager";
import { z } from "zod";

const UpdateRoomSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["SCHEDULED", "ACTIVE", "ENDED", "CANCELLED"]).optional(),
  settings: z.object({
    allowScreenShare: z.boolean().optional(),
    allowChat: z.boolean().optional(),
    allowFileShare: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    lobbyEnabled: z.boolean().optional(),
    muteOnJoin: z.boolean().optional(),
    e2eEncryption: z.boolean().optional(),
    waitingRoomEnabled: z.boolean().optional(),
  }).optional(),
});

const AddParticipantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  role: z.enum(["HOST", "CO_HOST", "PRESENTER", "PARTICIPANT", "OBSERVER"]),
  videoEnabled: z.boolean().default(true),
  permissions: z.object({
    canShare: z.boolean(),
    canRecord: z.boolean(),
    canMute: z.boolean(),
    canRemove: z.boolean(),
  }),
});

/**
 * GET /api/collaboration/rooms/[id]
 * Get room details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const room = videoRoomManager.getRoom(id);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: "Room not found",
        },
        { status: 404 }
      );
    }

    const participants = videoRoomManager.getParticipants(id);
    const stats = videoRoomManager.getRoomStats(id);

    return NextResponse.json({
      success: true,
      data: {
        room,
        participants,
        stats,
      },
    });
  } catch (error: any) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch room",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collaboration/rooms/[id]
 * Update room details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validated = UpdateRoomSchema.parse(body);

    const room = await videoRoomManager.updateRoom(id, validated);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: "Room not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
      message: "Room updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating room:", error);

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
        error: error.message || "Failed to update room",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collaboration/rooms/[id]/start
 * Start a room
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "start") {
      const room = await videoRoomManager.startRoom(id);

      if (!room) {
        return NextResponse.json(
          {
            success: false,
            error: "Room not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: room,
        message: "Room started successfully",
      });
    }

    if (action === "end") {
      const room = await videoRoomManager.endRoom(id);

      if (!room) {
        return NextResponse.json(
          {
            success: false,
            error: "Room not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: room,
        message: "Room ended successfully",
      });
    }

    if (action === "join") {
      const body = await request.json();
      const validated = AddParticipantSchema.parse(body);

      const participant = await videoRoomManager.addParticipant(id, validated);

      if (!participant) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to add participant",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: participant,
        message: "Joined room successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error performing room action:", error);

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
        error: error.message || "Failed to perform action",
      },
      { status: 500 }
    );
  }
}

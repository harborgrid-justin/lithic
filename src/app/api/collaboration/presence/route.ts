/**
 * Presence API
 * Handles user presence updates
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdatePresenceSchema = z.object({
  userId: z.string(),
  status: z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]),
  location: z.object({
    type: z.enum(["ROOM", "DOCUMENT", "WHITEBOARD", "PAGE"]),
    id: z.string(),
    name: z.string(),
  }).optional(),
});

/**
 * GET /api/collaboration/presence
 * Get presence information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    // Mock response - in production, fetch from presence manager
    return NextResponse.json({
      success: true,
      data: {
        users: [],
        online: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching presence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch presence",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collaboration/presence
 * Update presence
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdatePresenceSchema.parse(body);

    // Mock response - in production, update presence manager
    return NextResponse.json({
      success: true,
      data: validated,
      message: "Presence updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating presence:", error);

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
        error: error.message || "Failed to update presence",
      },
      { status: 500 }
    );
  }
}

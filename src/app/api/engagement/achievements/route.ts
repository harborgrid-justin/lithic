/**
 * Achievements API Route
 * Agent 5: Patient Engagement Platform
 */

import { NextRequest, NextResponse } from "next/server";
import { AchievementsEngine } from "@/lib/engagement/achievements";

/**
 * GET /api/engagement/achievements
 * Retrieve achievements for a patient
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // Get all available achievements
    const allAchievements = AchievementsEngine.getPredefinedAchievements();

    // In production, fetch earned achievements from database
    const earnedAchievements: any[] = [];

    return NextResponse.json({
      success: true,
      achievements: allAchievements,
      earned: earnedAchievements,
      meta: {
        total: allAchievements.length,
        earned: earnedAchievements.length,
        earnedPercentage:
          (earnedAchievements.length / allAchievements.length) * 100,
      },
    });
  } catch (error) {
    console.error("Error retrieving achievements:", error);
    return NextResponse.json(
      { error: "Failed to retrieve achievements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/engagement/achievements/check
 * Check and award achievements based on event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, eventType, eventData } = body;

    if (!patientId || !eventType) {
      return NextResponse.json(
        { error: "patientId and eventType are required" },
        { status: 400 }
      );
    }

    // Check for new achievements
    const earned = await AchievementsEngine.checkAchievements(
      patientId,
      eventType,
      eventData || {}
    );

    return NextResponse.json({
      success: true,
      earned,
      count: earned.length,
      message:
        earned.length > 0
          ? `${earned.length} new achievement${earned.length > 1 ? "s" : ""} unlocked!`
          : "No new achievements",
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    return NextResponse.json(
      { error: "Failed to check achievements" },
      { status: 500 }
    );
  }
}

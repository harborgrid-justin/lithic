/**
 * Challenges API Route
 * Agent 5: Patient Engagement Platform
 */

import { NextRequest, NextResponse } from "next/server";
import { ChallengesEngine } from "@/lib/engagement/challenges";
import type { JoinChallengeDto } from "@/types/engagement";

/**
 * GET /api/engagement/challenges
 * Retrieve available challenges
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // In production, query database for challenges
    const challenges: any[] = [];

    return NextResponse.json({
      success: true,
      challenges,
      meta: {
        total: challenges.length,
        filters: { status, category },
      },
    });
  } catch (error) {
    console.error("Error retrieving challenges:", error);
    return NextResponse.json(
      { error: "Failed to retrieve challenges" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/engagement/challenges/join
 * Join a challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const joinData: JoinChallengeDto = body;

    if (!joinData.challengeId || !joinData.patientId) {
      return NextResponse.json(
        { error: "challengeId and patientId are required" },
        { status: 400 }
      );
    }

    // Join challenge using ChallengesEngine
    const { participant, team } = await ChallengesEngine.joinChallenge(joinData);

    return NextResponse.json(
      {
        success: true,
        participant,
        team,
        message: "Successfully joined challenge!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error joining challenge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to join challenge" },
      { status: 400 }
    );
  }
}

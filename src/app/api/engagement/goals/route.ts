/**
 * Goals API Route
 * Agent 5: Patient Engagement Platform
 */

import { NextRequest, NextResponse } from "next/server";
import { GoalsEngine } from "@/lib/engagement/goals-engine";
import type { CreateGoalDto, UpdateGoalDto } from "@/types/engagement";

/**
 * GET /api/engagement/goals
 * Retrieve goals for a patient
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    // In production, this would query the database
    // For now, return mock response
    const goals: any[] = [];

    return NextResponse.json({
      success: true,
      goals,
      meta: {
        total: goals.length,
        filters: { status, type, category },
      },
    });
  } catch (error) {
    console.error("Error retrieving goals:", error);
    return NextResponse.json(
      { error: "Failed to retrieve goals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/engagement/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const goalData: CreateGoalDto = body;

    // Validate required fields
    if (
      !goalData.patientId ||
      !goalData.type ||
      !goalData.category ||
      !goalData.title ||
      !goalData.targetValue ||
      !goalData.targetDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create goal using GoalsEngine
    const goal = await GoalsEngine.createGoal(goalData);

    return NextResponse.json(
      {
        success: true,
        goal,
        message: "Goal created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/engagement/goals/[goalId]
 * Update a goal
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const goalData: UpdateGoalDto = body;

    if (!goalData.id) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // In production, update goal in database
    const updatedGoal = {
      ...goalData,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      message: "Goal updated successfully",
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/engagement/goals/[goalId]
 * Delete a goal
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const goalId = searchParams.get("goalId");

    if (!goalId) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // In production, soft delete goal in database

    return NextResponse.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}

/**
 * Goals API - Health Goals Endpoints
 * GET: Fetch user goals, progress, and recommendations
 * POST: Create new goal
 * PUT: Update goal progress
 * DELETE: Abandon goal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoalEngine, GoalStatus } from '@/lib/engagement/goals/goal-engine';
import { SMARTGoalsEngine } from '@/lib/engagement/goals/smart-goals';
import { GOAL_TEMPLATES } from '@/lib/engagement/goals/goal-templates';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status') as GoalStatus | null;
    const goalId = searchParams.get('goalId');

    switch (action) {
      case 'list':
        const goals = await GoalEngine.getUserGoals(session.user.id, status || undefined);
        return NextResponse.json(goals);

      case 'stats':
        const stats = await GoalEngine.getGoalStats(session.user.id);
        return NextResponse.json(stats);

      case 'progress':
        if (!goalId) {
          return NextResponse.json(
            { error: 'Goal ID required' },
            { status: 400 }
          );
        }
        const progress = await GoalEngine.getProgressHistory(goalId, 30);
        return NextResponse.json(progress);

      case 'recommendations':
        const recommendations = await GoalEngine.getRecommendations(session.user.id);
        return NextResponse.json(recommendations);

      case 'suggested':
        const suggestions = await SMARTGoalsEngine.getSuggestedGoals(session.user.id, 5);
        return NextResponse.json(suggestions);

      case 'templates':
        return NextResponse.json(GOAL_TEMPLATES);

      default:
        // Return complete goals information
        const [activeGoals, completedGoals, goalStats] = await Promise.all([
          GoalEngine.getUserGoals(session.user.id, GoalStatus.ACTIVE),
          GoalEngine.getUserGoals(session.user.id, GoalStatus.COMPLETED),
          GoalEngine.getGoalStats(session.user.id),
        ]);

        return NextResponse.json({
          active: activeGoals,
          completed: completedGoals,
          stats: goalStats,
        });
    }
  } catch (error) {
    console.error('Goals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate SMART goal criteria
    const validation = SMARTGoalsEngine.validateSMARTGoal(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Goal does not meet SMART criteria',
          validation,
        },
        { status: 400 }
      );
    }

    const goal = await GoalEngine.createGoal(session.user.id, body);

    return NextResponse.json({
      goal,
      success: true,
    });
  } catch (error: any) {
    console.error('Goal creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create goal' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId, newValue, note } = body;

    if (!goalId || typeof newValue !== 'number') {
      return NextResponse.json(
        { error: 'Goal ID and new value required' },
        { status: 400 }
      );
    }

    const updatedGoal = await GoalEngine.updateProgress(
      session.user.id,
      goalId,
      newValue,
      note
    );

    return NextResponse.json({
      goal: updatedGoal,
      success: true,
    });
  } catch (error: any) {
    console.error('Goal update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update goal' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID required' },
        { status: 400 }
      );
    }

    const abandonedGoal = await GoalEngine.abandonGoal(session.user.id, goalId);

    return NextResponse.json({
      goal: abandonedGoal,
      success: true,
    });
  } catch (error: any) {
    console.error('Goal abandon error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to abandon goal' },
      { status: 400 }
    );
  }
}

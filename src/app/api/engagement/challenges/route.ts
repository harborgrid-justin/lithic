/**
 * Challenges API - Health Challenges Endpoints
 * GET: Fetch active challenges, user challenges, leaderboard
 * POST: Join challenge, create team
 * PUT: Update challenge progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ChallengeSystem, CHALLENGE_TEMPLATES } from '@/lib/engagement/gamification/challenges';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const challengeId = searchParams.get('challengeId');

    switch (action) {
      case 'active':
        // Get all active challenges
        const activeChallenges = await ChallengeSystem.getActiveChallenges(
          session.user.id
        );
        return NextResponse.json(activeChallenges);

      case 'user':
        // Get user's challenges
        const userChallenges = await ChallengeSystem.getUserChallenges(
          session.user.id
        );
        return NextResponse.json(userChallenges);

      case 'leaderboard':
        if (!challengeId) {
          return NextResponse.json(
            { error: 'Challenge ID required' },
            { status: 400 }
          );
        }
        const limit = parseInt(searchParams.get('limit') || '100');
        const leaderboard = await ChallengeSystem.getChallengeLeaderboard(
          challengeId,
          limit
        );
        return NextResponse.json(leaderboard);

      case 'templates':
        return NextResponse.json(CHALLENGE_TEMPLATES);

      default:
        // Return complete challenges information
        const [active, userActive] = await Promise.all([
          ChallengeSystem.getActiveChallenges(session.user.id),
          ChallengeSystem.getUserChallenges(session.user.id),
        ]);

        return NextResponse.json({
          active,
          userChallenges: userActive,
        });
    }
  } catch (error) {
    console.error('Challenges API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges data' },
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
    const { action, challengeId, teamId, teamName } = body;

    switch (action) {
      case 'join':
        if (!challengeId) {
          return NextResponse.json(
            { error: 'Challenge ID required' },
            { status: 400 }
          );
        }

        const participation = await ChallengeSystem.joinChallenge(
          session.user.id,
          challengeId,
          teamId
        );

        return NextResponse.json({
          participation,
          success: true,
        });

      case 'create_team':
        if (!challengeId || !teamName) {
          return NextResponse.json(
            { error: 'Challenge ID and team name required' },
            { status: 400 }
          );
        }

        const team = await ChallengeSystem.createTeam(
          challengeId,
          session.user.id,
          teamName
        );

        return NextResponse.json({
          team,
          success: true,
        });

      case 'join_team':
        if (!teamId) {
          return NextResponse.json(
            { error: 'Team ID required' },
            { status: 400 }
          );
        }

        await ChallengeSystem.joinTeam(session.user.id, teamId);

        return NextResponse.json({
          success: true,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Challenge action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform challenge action' },
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
    const { challengeId, progress } = body;

    if (!challengeId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Challenge ID and progress required' },
        { status: 400 }
      );
    }

    await ChallengeSystem.updateProgress(
      session.user.id,
      challengeId,
      progress
    );

    const userChallenges = await ChallengeSystem.getUserChallenges(
      session.user.id
    );

    return NextResponse.json({
      userChallenges,
      success: true,
    });
  } catch (error: any) {
    console.error('Challenge progress error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update challenge progress' },
      { status: 400 }
    );
  }
}

/**
 * Leaderboard API - Rankings and Achievements
 * GET: Fetch leaderboards by type
 * PUT: Update privacy settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  LeaderboardSystem,
  LeaderboardType,
  LeaderboardPrivacy,
  LEADERBOARD_CONFIGS,
} from '@/lib/engagement/gamification/leaderboard';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as LeaderboardType;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!type || !Object.values(LeaderboardType).includes(type)) {
      // Return all leaderboard types
      return NextResponse.json(LEADERBOARD_CONFIGS);
    }

    const leaderboard = await LeaderboardSystem.getLeaderboard(
      type,
      session.user.id,
      limit,
      offset
    );

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
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
    const { privacy } = body;

    if (!privacy || !Object.values(LeaderboardPrivacy).includes(privacy)) {
      return NextResponse.json(
        { error: 'Invalid privacy setting' },
        { status: 400 }
      );
    }

    await LeaderboardSystem.updatePrivacy(session.user.id, privacy);

    return NextResponse.json({
      privacy,
      success: true,
    });
  } catch (error) {
    console.error('Leaderboard privacy error:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

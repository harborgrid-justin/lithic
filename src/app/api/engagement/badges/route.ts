/**
 * Badges API - Achievement Badges Endpoints
 * GET: Fetch user badges, badge progress, and available badges
 * POST: Manually trigger badge check (for admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BadgeSystem, BADGE_DEFINITIONS } from '@/lib/engagement/gamification/badges';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const badgeId = searchParams.get('badgeId');

    switch (action) {
      case 'user':
        // Get all badges for user (locked and unlocked)
        const userBadges = await BadgeSystem.getUserBadges(session.user.id);
        return NextResponse.json(userBadges);

      case 'progress':
        if (!badgeId) {
          return NextResponse.json(
            { error: 'Badge ID required' },
            { status: 400 }
          );
        }
        const progress = await BadgeSystem.getBadgeProgress(
          session.user.id,
          badgeId
        );
        return NextResponse.json(progress);

      case 'definitions':
        // Return all badge definitions
        return NextResponse.json(BADGE_DEFINITIONS);

      default:
        // Return complete badge information
        const badges = await BadgeSystem.getUserBadges(session.user.id);
        const unlockedCount = badges.filter((b) => b.unlocked).length;
        const totalCount = badges.length;

        return NextResponse.json({
          badges,
          stats: {
            unlocked: unlockedCount,
            total: totalCount,
            percentage: (unlockedCount / totalCount) * 100,
          },
        });
    }
  } catch (error) {
    console.error('Badges API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges data' },
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

    // Check for newly unlocked badges
    const newlyUnlocked = await BadgeSystem.checkAndAwardBadges(session.user.id);

    const userBadges = await BadgeSystem.getUserBadges(session.user.id);
    const unlockedCount = userBadges.filter((b) => b.unlocked).length;

    return NextResponse.json({
      newlyUnlocked,
      totalUnlocked: unlockedCount,
      success: true,
    });
  } catch (error) {
    console.error('Badge check error:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}

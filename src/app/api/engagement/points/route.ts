/**
 * Points API - Gamification Endpoints
 * GET: Fetch point balance, history, and statistics
 * POST: Award points for activities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PointsSystem, PointActivity } from '@/lib/engagement/gamification/points-system';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'balance':
        const balance = await PointsSystem.getBalance(session.user.id);
        return NextResponse.json(balance);

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const history = await PointsSystem.getHistory(session.user.id, limit, offset);
        return NextResponse.json(history);

      case 'stats':
        const stats = await PointsSystem.getStatsByCategory(session.user.id);
        return NextResponse.json(stats);

      default:
        // Return complete point information
        const [pointBalance, pointHistory, categoryStats] = await Promise.all([
          PointsSystem.getBalance(session.user.id),
          PointsSystem.getHistory(session.user.id, 20),
          PointsSystem.getStatsByCategory(session.user.id),
        ]);

        return NextResponse.json({
          balance: pointBalance,
          recentHistory: pointHistory,
          categoryStats,
        });
    }
  } catch (error) {
    console.error('Points API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points data' },
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
    const { activity, metadata } = body;

    if (!activity || !Object.values(PointActivity).includes(activity)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    const transaction = await PointsSystem.awardPoints(
      session.user.id,
      activity,
      metadata
    );

    const updatedBalance = await PointsSystem.getBalance(session.user.id);

    return NextResponse.json({
      transaction,
      balance: updatedBalance,
      success: true,
    });
  } catch (error: any) {
    console.error('Points award error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award points' },
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
    const points = parseInt(searchParams.get('points') || '0');
    const reason = searchParams.get('reason') || 'Redemption';

    if (points <= 0) {
      return NextResponse.json(
        { error: 'Invalid points amount' },
        { status: 400 }
      );
    }

    await PointsSystem.redeemPoints(session.user.id, points, reason);

    const updatedBalance = await PointsSystem.getBalance(session.user.id);

    return NextResponse.json({
      balance: updatedBalance,
      success: true,
    });
  } catch (error: any) {
    console.error('Points redemption error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redeem points' },
      { status: 400 }
    );
  }
}

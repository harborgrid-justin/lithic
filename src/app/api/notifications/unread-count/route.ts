/**
 * Unread Count API Route
 * Lithic Healthcare Platform v0.5
 *
 * GET /api/notifications/unread-count - Get unread notification count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHub } from '@/lib/notifications/notification-hub';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const hub = getNotificationHub();

    const count = await hub.getUnreadCount(userId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}

/**
 * Mark All Notifications as Read API Route
 * Lithic Healthcare Platform v0.5
 *
 * POST /api/notifications/read-all - Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHub } from '@/lib/notifications/notification-hub';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const hub = getNotificationHub();

    await hub.markAllAsRead(userId, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

/**
 * Mark Notification as Read API Route
 * Lithic Healthcare Platform v0.5
 *
 * POST /api/notifications/[id]/read - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHub } from '@/lib/notifications/notification-hub';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const hub = getNotificationHub();

    await hub.markAsRead(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

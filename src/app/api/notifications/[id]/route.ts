/**
 * Single Notification API Route
 * Lithic Healthcare Platform v0.5
 *
 * GET    /api/notifications/[id] - Get notification by ID
 * DELETE /api/notifications/[id] - Delete notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHub } from '@/lib/notifications/notification-hub';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/[id]
 * Get a specific notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const hub = getNotificationHub();

    const notifications = await hub.getNotifications({
      userId,
      limit: 1,
    });

    const notification = notifications.find((n) => n.id === params.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to fetch notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const hub = getNotificationHub();

    await hub.deleteNotification(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

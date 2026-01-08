/**
 * Notifications API Route
 * Lithic Healthcare Platform v0.5
 *
 * GET  /api/notifications - List notifications
 * POST /api/notifications - Send a notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationHub } from '@/lib/notifications/notification-hub';
import {
  CreateNotificationSchema,
  NotificationListQuery,
  NotificationStatus,
} from '@/types/notifications';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * List notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session (would use actual auth)
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const hub = getNotificationHub();

    // Get notifications
    const notifications = await hub.getNotifications({
      userId,
      tenantId,
      status: unreadOnly
        ? [NotificationStatus.SENT, NotificationStatus.DELIVERED]
        : undefined,
      limit,
      offset,
    });

    // Get unread count
    const unreadCount = await hub.getUnreadCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
      hasMore: notifications.length === limit,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Send a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateNotificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      );
    }

    const hub = getNotificationHub();

    // Send notification
    const result = await hub.send(validation.data);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

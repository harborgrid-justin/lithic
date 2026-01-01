/**
 * Push Notification Send API Endpoint
 * Sends push notifications to subscribed users
 *
 * Endpoint:
 * - POST /api/push/send - Send push notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth';
import webpush from 'web-push';

/**
 * Configure Web Push with VAPID keys
 */
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@lithic.health';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Push notification payload
 */
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  category?: string;
}

/**
 * POST /api/push/send
 * Send push notification to user(s)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow certain roles to send notifications
    const userRole = (session.user as any).role;
    const allowedRoles = ['SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'PHYSICIAN', 'NURSE'];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      userIds,
      userId,
      payload,
      organizationId,
    }: {
      userIds?: string[];
      userId?: string;
      payload: PushPayload;
      organizationId?: string;
    } = body;

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Invalid payload - title and body required' },
        { status: 400 }
      );
    }

    // Determine target users
    let targetUserIds: string[] = [];

    if (userId) {
      targetUserIds = [userId];
    } else if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (organizationId) {
      // Send to all users in organization
      const users = await prisma.user.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });
      targetUserIds = users.map((u) => u.id);
    } else {
      return NextResponse.json(
        { error: 'No target users specified' },
        { status: 400 }
      );
    }

    // Get active subscriptions for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: targetUserIds,
        },
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No active subscriptions found',
      });
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      image: payload.image,
      tag: payload.tag || 'default',
      data: {
        ...payload.data,
        url: payload.data?.url || '/',
        timestamp: Date.now(),
      },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || payload.priority === 'critical',
      vibrate: getVibrationPattern(payload.priority || 'normal'),
    });

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            notificationPayload,
            {
              TTL: 3600, // 1 hour
              urgency: getUrgency(payload.priority || 'normal'),
            }
          );

          return { success: true, subscriptionId: subscription.id };
        } catch (error: any) {
          console.error('[PushAPI] Send failed:', error);

          // Handle expired subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }

          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    // Count successful sends
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    const failureCount = results.length - successCount;

    console.log(
      `[PushAPI] Sent ${successCount}/${results.length} notifications`,
      failureCount > 0 ? `(${failureCount} failed)` : ''
    );

    // Log notification in database
    await prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        category: payload.category || 'system',
        priority: payload.priority || 'normal',
        sentBy: session.user.id,
        recipientCount: targetUserIds.length,
        successCount,
        failureCount,
        payload: payload as any,
      },
    });

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: results.length,
    });
  } catch (error) {
    console.error('[PushAPI] Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

/**
 * Get vibration pattern based on priority
 */
function getVibrationPattern(priority: string): number[] {
  switch (priority) {
    case 'critical':
      return [200, 100, 200, 100, 200];
    case 'high':
      return [200, 100, 200];
    case 'normal':
      return [200];
    case 'low':
      return [];
    default:
      return [200];
  }
}

/**
 * Get urgency level for Web Push
 */
function getUrgency(priority: string): 'very-low' | 'low' | 'normal' | 'high' {
  switch (priority) {
    case 'critical':
      return 'high';
    case 'high':
      return 'high';
    case 'normal':
      return 'normal';
    case 'low':
      return 'low';
    default:
      return 'normal';
  }
}

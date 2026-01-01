/**
 * Push Subscription API Endpoint
 * Handles push notification subscription management
 *
 * Endpoints:
 * - POST /api/push/subscribe - Subscribe to push notifications
 * - DELETE /api/push/subscribe - Unsubscribe from push notifications
 * - GET /api/push/subscribe - Get subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth';

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
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

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { endpoint, keys, deviceId } = body;

    // Validate required fields
    if (!endpoint || !keys?.p256dh || !keys?.auth || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store subscription in database
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
      create: {
        userId,
        deviceId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
      },
      update: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log('[PushAPI] Subscription saved:', subscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('[PushAPI] Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { endpoint, deviceId } = body;

    if (!endpoint && !deviceId) {
      return NextResponse.json(
        { error: 'Either endpoint or deviceId required' },
        { status: 400 }
      );
    }

    // Deactivate subscription
    if (deviceId) {
      await prisma.pushSubscription.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } else if (endpoint) {
      await prisma.pushSubscription.updateMany({
        where: {
          userId,
          endpoint,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    }

    console.log('[PushAPI] Subscription deactivated');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[PushAPI] Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * Get subscription status
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        deviceId: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error('[PushAPI] Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}

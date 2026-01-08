/**
 * Push Subscription API Route
 * Lithic Healthcare Platform v0.5
 *
 * POST /api/notifications/subscribe - Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationChannel } from '@/lib/notifications/channels/push';
import { PushSubscriptionSchema } from '@/types/notifications';

export const dynamic = 'force-dynamic';

const pushChannel = new PushNotificationChannel();

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const body = await request.json();

    // Validate request body
    const validation = PushSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      );
    }

    await pushChannel.saveSubscription(userId, tenantId, validation.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/subscribe
 * Get VAPID public key
 */
export async function GET() {
  try {
    const publicKey = pushChannel.getVAPIDPublicKey();

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Failed to get VAPID key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID key' },
      { status: 500 }
    );
  }
}

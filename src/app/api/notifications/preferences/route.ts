/**
 * Notification Preferences API Route
 * Lithic Healthcare Platform v0.5
 *
 * GET   /api/notifications/preferences - Get user preferences
 * PATCH /api/notifications/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { PreferenceManager } from '@/lib/notifications/preference-manager';
import { UpdatePreferencesSchema } from '@/types/notifications';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const preferenceManager = new PreferenceManager(redis);

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const preferences = await preferenceManager.getPreferences(userId, tenantId);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const body = await request.json();

    // Validate request body
    const validation = UpdatePreferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error },
        { status: 400 }
      );
    }

    const preferences = await preferenceManager.updatePreferences(
      userId,
      tenantId,
      validation.data
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

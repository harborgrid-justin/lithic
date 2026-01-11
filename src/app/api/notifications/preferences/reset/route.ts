/**
 * Reset Preferences API Route
 * Lithic Healthcare Platform v0.5
 *
 * POST /api/notifications/preferences/reset - Reset preferences to defaults
 */

import { NextRequest, NextResponse } from 'next/server';
import { PreferenceManager } from '@/lib/notifications/preference-manager';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const preferenceManager = new PreferenceManager(redis);

/**
 * POST /api/notifications/preferences/reset
 * Reset notification preferences to defaults
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    const preferences = await preferenceManager.resetToDefaults(userId, tenantId);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Failed to reset preferences:', error);
    return NextResponse.json(
      { error: 'Failed to reset preferences' },
      { status: 500 }
    );
  }
}

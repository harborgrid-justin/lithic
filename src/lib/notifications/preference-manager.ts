/**
 * Preference Manager
 * Lithic Healthcare Platform v0.5
 *
 * Manages user notification preferences including channels,
 * categories, quiet hours, and batching settings.
 */

import {
  NotificationPreferences,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  QuietHours,
  ChannelPreference,
} from '@/types/notifications';
import Redis from 'ioredis';

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'tenantId'> = {
  enabled: true,
  channels: {
    [NotificationChannel.IN_APP]: {
      enabled: true,
    },
    [NotificationChannel.PUSH]: {
      enabled: true,
    },
    [NotificationChannel.SMS]: {
      enabled: false,
    },
    [NotificationChannel.EMAIL]: {
      enabled: true,
    },
  },
  categories: {
    [NotificationCategory.CLINICAL_ALERT]: {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
      priority: NotificationPriority.CRITICAL,
    },
    [NotificationCategory.APPOINTMENT]: {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.MEDIUM,
    },
    [NotificationCategory.LAB_RESULT]: {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      priority: NotificationPriority.HIGH,
    },
    [NotificationCategory.MEDICATION]: {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
    },
    [NotificationCategory.MESSAGE]: {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.MEDIUM,
    },
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'America/New_York',
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    allowCritical: true,
  },
  batchingEnabled: false,
  dailyDigestEnabled: false,
  weeklyDigestEnabled: false,
  updatedAt: new Date(),
};

export class PreferenceManager {
  private redis: Redis;
  private readonly CACHE_TTL = 60 * 60; // 1 hour

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Get user preferences with caching
   */
  async getPreferences(userId: string, tenantId: string): Promise<NotificationPreferences> {
    // Try cache first
    const cached = await this.getCachedPreferences(userId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const preferences = await this.fetchPreferencesFromDB(userId, tenantId);

    // Cache the result
    await this.cachePreferences(userId, preferences);

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    tenantId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    // Get current preferences
    const current = await this.getPreferences(userId, tenantId);

    // Merge updates
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      userId,
      tenantId,
      updatedAt: new Date(),
    };

    // Save to database
    await this.savePreferencesToDB(updated);

    // Update cache
    await this.cachePreferences(userId, updated);

    return updated;
  }

  /**
   * Enable/disable all notifications for a user
   */
  async setEnabled(userId: string, tenantId: string, enabled: boolean): Promise<void> {
    await this.updatePreferences(userId, tenantId, { enabled });
  }

  /**
   * Pause notifications until a specific time
   */
  async pauseNotifications(userId: string, tenantId: string, until: Date): Promise<void> {
    await this.updatePreferences(userId, tenantId, { pausedUntil: until });
  }

  /**
   * Resume notifications
   */
  async resumeNotifications(userId: string, tenantId: string): Promise<void> {
    await this.updatePreferences(userId, tenantId, { pausedUntil: undefined });
  }

  /**
   * Update channel preference
   */
  async updateChannelPreference(
    userId: string,
    tenantId: string,
    channel: NotificationChannel,
    preference: ChannelPreference
  ): Promise<void> {
    const current = await this.getPreferences(userId, tenantId);
    current.channels[channel] = preference;
    await this.updatePreferences(userId, tenantId, { channels: current.channels });
  }

  /**
   * Enable/disable a specific channel
   */
  async setChannelEnabled(
    userId: string,
    tenantId: string,
    channel: NotificationChannel,
    enabled: boolean
  ): Promise<void> {
    const current = await this.getPreferences(userId, tenantId);
    current.channels[channel].enabled = enabled;
    await this.updatePreferences(userId, tenantId, { channels: current.channels });
  }

  /**
   * Update category preferences
   */
  async updateCategoryPreference(
    userId: string,
    tenantId: string,
    category: NotificationCategory,
    preference: {
      enabled: boolean;
      channels: NotificationChannel[];
      priority?: NotificationPriority;
    }
  ): Promise<void> {
    const current = await this.getPreferences(userId, tenantId);
    if (!current.categories) {
      current.categories = {} as any;
    }
    current.categories[category] = preference;
    await this.updatePreferences(userId, tenantId, { categories: current.categories });
  }

  /**
   * Update quiet hours settings
   */
  async updateQuietHours(
    userId: string,
    tenantId: string,
    quietHours: QuietHours
  ): Promise<void> {
    await this.updatePreferences(userId, tenantId, { quietHours });
  }

  /**
   * Enable/disable quiet hours
   */
  async setQuietHoursEnabled(
    userId: string,
    tenantId: string,
    enabled: boolean
  ): Promise<void> {
    const current = await this.getPreferences(userId, tenantId);
    current.quietHours.enabled = enabled;
    await this.updatePreferences(userId, tenantId, { quietHours: current.quietHours });
  }

  /**
   * Update batching settings
   */
  async setBatchingEnabled(
    userId: string,
    tenantId: string,
    enabled: boolean,
    interval?: number
  ): Promise<void> {
    await this.updatePreferences(userId, tenantId, {
      batchingEnabled: enabled,
      batchInterval: interval,
    });
  }

  /**
   * Update digest settings
   */
  async updateDigestSettings(
    userId: string,
    tenantId: string,
    settings: {
      dailyDigestEnabled?: boolean;
      dailyDigestTime?: string;
      weeklyDigestEnabled?: boolean;
      weeklyDigestDay?: number;
    }
  ): Promise<void> {
    await this.updatePreferences(userId, tenantId, settings);
  }

  /**
   * Get effective channels for a notification
   */
  async getEffectiveChannels(
    userId: string,
    tenantId: string,
    category: NotificationCategory,
    defaultChannels: NotificationChannel[]
  ): Promise<NotificationChannel[]> {
    const preferences = await this.getPreferences(userId, tenantId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return [];
    }

    // Get category-specific channels if configured
    const categoryPreference = preferences.categories[category];
    if (categoryPreference && !categoryPreference.enabled) {
      return [];
    }

    const channels = categoryPreference?.channels || defaultChannels;

    // Filter by enabled channels
    return channels.filter((channel) => preferences.channels[channel]?.enabled);
  }

  /**
   * Check if a category is enabled
   */
  async isCategoryEnabled(
    userId: string,
    tenantId: string,
    category: NotificationCategory
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId, tenantId);

    if (!preferences.enabled) {
      return false;
    }

    const categoryPreference = preferences.categories[category];
    return categoryPreference?.enabled !== false;
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: string, tenantId: string): Promise<NotificationPreferences> {
    const preferences: NotificationPreferences = {
      ...DEFAULT_PREFERENCES,
      userId,
      tenantId,
      updatedAt: new Date(),
    };

    await this.savePreferencesToDB(preferences);
    await this.cachePreferences(userId, preferences);

    return preferences;
  }

  /**
   * Cache operations
   */

  private async getCachedPreferences(userId: string): Promise<NotificationPreferences | null> {
    const cached = await this.redis.get(`preferences:${userId}`);
    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  private async cachePreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    await this.redis.set(
      `preferences:${userId}`,
      JSON.stringify(preferences),
      'EX',
      this.CACHE_TTL
    );
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.redis.del(`preferences:${userId}`);
  }

  /**
   * Database operations (would use Prisma in production)
   */

  private async fetchPreferencesFromDB(
    userId: string,
    tenantId: string
  ): Promise<NotificationPreferences> {
    // In production, this would fetch from Prisma:
    // const prefs = await prisma.notificationPreferences.findUnique({
    //   where: { userId_tenantId: { userId, tenantId } },
    // });
    // if (!prefs) return { ...DEFAULT_PREFERENCES, userId, tenantId };
    // return prefs;

    // For now, return defaults
    return {
      ...DEFAULT_PREFERENCES,
      userId,
      tenantId,
    };
  }

  private async savePreferencesToDB(preferences: NotificationPreferences): Promise<void> {
    // In production, this would save to Prisma:
    // await prisma.notificationPreferences.upsert({
    //   where: {
    //     userId_tenantId: {
    //       userId: preferences.userId,
    //       tenantId: preferences.tenantId,
    //     },
    //   },
    //   create: preferences,
    //   update: preferences,
    // });
  }

  /**
   * Bulk operations
   */

  async getBulkPreferences(userIds: string[], tenantId: string): Promise<Map<string, NotificationPreferences>> {
    const preferences = new Map<string, NotificationPreferences>();

    await Promise.all(
      userIds.map(async (userId) => {
        const prefs = await this.getPreferences(userId, tenantId);
        preferences.set(userId, prefs);
      })
    );

    return preferences;
  }

  /**
   * Export preferences for backup/migration
   */
  async exportPreferences(userId: string, tenantId: string): Promise<string> {
    const preferences = await this.getPreferences(userId, tenantId);
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Import preferences from backup
   */
  async importPreferences(userId: string, tenantId: string, data: string): Promise<void> {
    try {
      const preferences = JSON.parse(data) as NotificationPreferences;
      preferences.userId = userId;
      preferences.tenantId = tenantId;
      preferences.updatedAt = new Date();

      await this.savePreferencesToDB(preferences);
      await this.cachePreferences(userId, preferences);
    } catch (error) {
      throw new Error('Invalid preferences data');
    }
  }
}

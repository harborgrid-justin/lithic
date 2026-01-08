/**
 * Priority Router
 * Lithic Healthcare Platform v0.5
 *
 * Routes notifications based on priority, category, and user preferences.
 * Determines which channels to use for delivery.
 */

import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  NotificationPreferences,
} from '@/types/notifications';

export class PriorityRouter {
  /**
   * Channel priority matrix by notification priority
   */
  private readonly PRIORITY_CHANNELS: Record<NotificationPriority, NotificationChannel[]> = {
    [NotificationPriority.CRITICAL]: [
      NotificationChannel.IN_APP,
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
      NotificationChannel.EMAIL,
    ],
    [NotificationPriority.HIGH]: [
      NotificationChannel.IN_APP,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
    ],
    [NotificationPriority.MEDIUM]: [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ],
    [NotificationPriority.LOW]: [
      NotificationChannel.IN_APP,
    ],
  };

  /**
   * Category-specific channel recommendations
   */
  private readonly CATEGORY_CHANNELS: Partial<Record<NotificationCategory, NotificationChannel[]>> = {
    [NotificationCategory.CLINICAL_ALERT]: [
      NotificationChannel.IN_APP,
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
    ],
    [NotificationCategory.APPOINTMENT]: [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
    ],
    [NotificationCategory.LAB_RESULT]: [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ],
    [NotificationCategory.MEDICATION]: [
      NotificationChannel.IN_APP,
      NotificationChannel.PUSH,
    ],
    [NotificationCategory.MESSAGE]: [
      NotificationChannel.IN_APP,
      NotificationChannel.PUSH,
    ],
    [NotificationCategory.SYSTEM]: [
      NotificationChannel.IN_APP,
      NotificationChannel.EMAIL,
    ],
    [NotificationCategory.BILLING]: [
      NotificationChannel.EMAIL,
      NotificationChannel.IN_APP,
    ],
  };

  /**
   * Determine which channels to use for a notification
   */
  async determineChannels(
    priority: NotificationPriority,
    category: NotificationCategory,
    requestedChannels: NotificationChannel[],
    preferences: NotificationPreferences
  ): Promise<NotificationChannel[]> {
    // Start with requested channels
    let channels = [...requestedChannels];

    // If no channels requested, use priority-based defaults
    if (channels.length === 0) {
      channels = this.getDefaultChannels(priority, category);
    }

    // Apply user preferences
    channels = this.applyPreferences(channels, category, preferences);

    // Ensure critical notifications have at least one channel
    if (priority === NotificationPriority.CRITICAL && channels.length === 0) {
      channels = [NotificationChannel.IN_APP];
    }

    // Remove duplicates and sort by priority
    return this.prioritizeChannels([...new Set(channels)], priority);
  }

  /**
   * Get default channels based on priority and category
   */
  private getDefaultChannels(
    priority: NotificationPriority,
    category: NotificationCategory
  ): NotificationChannel[] {
    // Start with category-specific channels if available
    const categoryChannels = this.CATEGORY_CHANNELS[category];

    if (categoryChannels) {
      return categoryChannels;
    }

    // Fall back to priority-based channels
    return this.PRIORITY_CHANNELS[priority];
  }

  /**
   * Apply user preferences to channel list
   */
  private applyPreferences(
    channels: NotificationChannel[],
    category: NotificationCategory,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    // Check if notifications are globally disabled
    if (!preferences.enabled) {
      return [];
    }

    // Check category-specific preferences
    const categoryPreference = preferences.categories[category];
    if (categoryPreference) {
      // If category is disabled, return empty
      if (!categoryPreference.enabled) {
        return [];
      }

      // If category has specific channels, use those
      if (categoryPreference.channels && categoryPreference.channels.length > 0) {
        channels = categoryPreference.channels;
      }
    }

    // Filter by enabled channels
    return channels.filter((channel) => {
      const channelPref = preferences.channels[channel];
      if (!channelPref) return false;

      // Check if channel is enabled
      if (!channelPref.enabled) return false;

      // Check if category is excluded for this channel
      if (channelPref.excludeCategories?.includes(category)) {
        return false;
      }

      // Check if only specific categories are allowed
      if (
        channelPref.categories &&
        channelPref.categories.length > 0 &&
        !channelPref.categories.includes(category)
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Prioritize channels based on notification priority
   */
  private prioritizeChannels(
    channels: NotificationChannel[],
    priority: NotificationPriority
  ): NotificationChannel[] {
    const priorityOrder = this.PRIORITY_CHANNELS[priority];

    return channels.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);

      // If both are in priority order, sort by index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in priority order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Otherwise maintain original order
      return 0;
    });
  }

  /**
   * Determine if escalation is needed based on channel availability
   */
  shouldEscalate(
    availableChannels: NotificationChannel[],
    priority: NotificationPriority
  ): boolean {
    // Critical notifications should always have multiple channels
    if (priority === NotificationPriority.CRITICAL) {
      return availableChannels.length < 2;
    }

    // High priority should have at least one real-time channel
    if (priority === NotificationPriority.HIGH) {
      const hasRealtime =
        availableChannels.includes(NotificationChannel.IN_APP) ||
        availableChannels.includes(NotificationChannel.PUSH);
      return !hasRealtime;
    }

    return false;
  }

  /**
   * Get fallback channels when primary channels fail
   */
  getFallbackChannels(
    failedChannels: NotificationChannel[],
    priority: NotificationPriority
  ): NotificationChannel[] {
    const allChannels = this.PRIORITY_CHANNELS[priority];

    // Return channels that haven't failed yet
    return allChannels.filter((channel) => !failedChannels.includes(channel));
  }

  /**
   * Determine delivery timing based on priority
   */
  getDeliveryTiming(priority: NotificationPriority): {
    immediate: boolean;
    retryDelay: number; // milliseconds
    maxRetries: number;
  } {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return {
          immediate: true,
          retryDelay: 30 * 1000, // 30 seconds
          maxRetries: 5,
        };

      case NotificationPriority.HIGH:
        return {
          immediate: true,
          retryDelay: 60 * 1000, // 1 minute
          maxRetries: 3,
        };

      case NotificationPriority.MEDIUM:
        return {
          immediate: false,
          retryDelay: 5 * 60 * 1000, // 5 minutes
          maxRetries: 2,
        };

      case NotificationPriority.LOW:
        return {
          immediate: false,
          retryDelay: 15 * 60 * 1000, // 15 minutes
          maxRetries: 1,
        };
    }
  }

  /**
   * Check if channel is available for delivery
   */
  isChannelAvailable(
    channel: NotificationChannel,
    userPreferences: NotificationPreferences
  ): boolean {
    const channelPref = userPreferences.channels[channel];
    return channelPref?.enabled || false;
  }

  /**
   * Get channel display name
   */
  getChannelDisplayName(channel: NotificationChannel): string {
    const names: Record<NotificationChannel, string> = {
      [NotificationChannel.IN_APP]: 'In-App Notification',
      [NotificationChannel.PUSH]: 'Push Notification',
      [NotificationChannel.SMS]: 'Text Message (SMS)',
      [NotificationChannel.EMAIL]: 'Email',
    };

    return names[channel];
  }

  /**
   * Get priority display information
   */
  getPriorityInfo(priority: NotificationPriority): {
    name: string;
    color: string;
    icon: string;
  } {
    const info: Record<
      NotificationPriority,
      { name: string; color: string; icon: string }
    > = {
      [NotificationPriority.CRITICAL]: {
        name: 'Critical',
        color: '#dc2626',
        icon: 'alert-circle',
      },
      [NotificationPriority.HIGH]: {
        name: 'High',
        color: '#ea580c',
        icon: 'alert-triangle',
      },
      [NotificationPriority.MEDIUM]: {
        name: 'Medium',
        color: '#2563eb',
        icon: 'info',
      },
      [NotificationPriority.LOW]: {
        name: 'Low',
        color: '#64748b',
        icon: 'message-circle',
      },
    };

    return info[priority];
  }

  /**
   * Calculate notification score for sorting/prioritization
   */
  calculateNotificationScore(
    priority: NotificationPriority,
    category: NotificationCategory,
    timestamp: Date
  ): number {
    // Priority weight (0-1000)
    const priorityScores: Record<NotificationPriority, number> = {
      [NotificationPriority.CRITICAL]: 1000,
      [NotificationPriority.HIGH]: 750,
      [NotificationPriority.MEDIUM]: 500,
      [NotificationPriority.LOW]: 250,
    };

    // Category weight (0-100)
    const categoryScores: Partial<Record<NotificationCategory, number>> = {
      [NotificationCategory.CLINICAL_ALERT]: 100,
      [NotificationCategory.LAB_RESULT]: 80,
      [NotificationCategory.MEDICATION]: 70,
      [NotificationCategory.APPOINTMENT]: 60,
      [NotificationCategory.MESSAGE]: 50,
    };

    // Time decay (newer notifications score higher)
    const ageInHours = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
    const timeScore = Math.max(0, 100 - ageInHours * 10);

    const priorityScore = priorityScores[priority];
    const categoryScore = categoryScores[category] || 40;

    return priorityScore + categoryScore + timeScore;
  }

  /**
   * Group notifications by priority for display
   */
  groupByPriority<T extends { priority: NotificationPriority }>(
    notifications: T[]
  ): Map<NotificationPriority, T[]> {
    const groups = new Map<NotificationPriority, T[]>();

    for (const notification of notifications) {
      const group = groups.get(notification.priority) || [];
      group.push(notification);
      groups.set(notification.priority, group);
    }

    return groups;
  }

  /**
   * Validate channel configuration
   */
  validateChannelConfiguration(
    channels: NotificationChannel[],
    priority: NotificationPriority
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (channels.length === 0) {
      warnings.push('No channels configured for notification');
    }

    if (priority === NotificationPriority.CRITICAL && channels.length < 2) {
      warnings.push('Critical notifications should have at least 2 channels');
    }

    if (
      priority === NotificationPriority.CRITICAL &&
      !channels.includes(NotificationChannel.SMS)
    ) {
      warnings.push('Critical notifications should include SMS channel');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}

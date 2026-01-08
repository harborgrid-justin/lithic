/**
 * useNotificationPreferences Hook
 * Lithic Healthcare Platform v0.5
 *
 * React hook for managing user notification preferences.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import {
  NotificationPreferences,
  NotificationChannel,
  NotificationCategory,
  QuietHours,
} from '@/types/notifications';

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  updateChannelEnabled: (channel: NotificationChannel, enabled: boolean) => Promise<void>;
  updateCategoryEnabled: (category: NotificationCategory, enabled: boolean) => Promise<void>;
  updateQuietHours: (quietHours: QuietHours) => Promise<void>;
  updateBatching: (enabled: boolean, interval?: number) => Promise<void>;
  updateDigest: (daily: boolean, weekly: boolean) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const {
    preferences: storePreferences,
    setPreferences,
  } = useNotificationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch preferences from API
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [setPreferences]);

  // Update preferences helper
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!storePreferences) return;

      try {
        // Optimistic update
        setPreferences({ ...storePreferences, ...updates });

        const response = await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Revert optimistic update
        await fetchPreferences();
      }
    },
    [storePreferences, setPreferences, fetchPreferences]
  );

  // Enable/disable a channel
  const updateChannelEnabled = useCallback(
    async (channel: NotificationChannel, enabled: boolean) => {
      if (!storePreferences) return;

      const channels = {
        ...storePreferences.channels,
        [channel]: {
          ...storePreferences.channels[channel],
          enabled,
        },
      };

      await updatePreferences({ channels });
    },
    [storePreferences, updatePreferences]
  );

  // Enable/disable a category
  const updateCategoryEnabled = useCallback(
    async (category: NotificationCategory, enabled: boolean) => {
      if (!storePreferences) return;

      const categoryPref = storePreferences.categories[category] || {
        enabled: true,
        channels: [],
      };

      const categories = {
        ...storePreferences.categories,
        [category]: {
          ...categoryPref,
          enabled,
        },
      };

      await updatePreferences({ categories });
    },
    [storePreferences, updatePreferences]
  );

  // Update quiet hours
  const updateQuietHours = useCallback(
    async (quietHours: QuietHours) => {
      await updatePreferences({ quietHours });
    },
    [updatePreferences]
  );

  // Update batching settings
  const updateBatching = useCallback(
    async (enabled: boolean, interval?: number) => {
      await updatePreferences({
        batchingEnabled: enabled,
        batchInterval: interval,
      });
    },
    [updatePreferences]
  );

  // Update digest settings
  const updateDigest = useCallback(
    async (daily: boolean, weekly: boolean) => {
      await updatePreferences({
        dailyDigestEnabled: daily,
        weeklyDigestEnabled: weekly,
      });
    },
    [updatePreferences]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [setPreferences]);

  // Refresh preferences
  const refresh = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences: storePreferences,
    isLoading,
    error,
    updateChannelEnabled,
    updateCategoryEnabled,
    updateQuietHours,
    updateBatching,
    updateDigest,
    resetToDefaults,
    refresh,
  };
}

/**
 * Hook to check if quiet hours are active
 */
export function useQuietHoursStatus() {
  const { preferences } = useNotificationPreferences();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!preferences?.quietHours.enabled) {
      setIsActive(false);
      return;
    }

    const checkQuietHours = () => {
      const quietHours = preferences.quietHours;
      const now = new Date();
      const currentDay = now.getDay();

      // Check if current day is in quiet hours days
      if (!quietHours.days.includes(currentDay)) {
        setIsActive(false);
        return;
      }

      // Check if current time is within quiet hours
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = quietHours.startTime.split(':').map(Number);
      const [endHour, endMin] = quietHours.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      let active = false;
      if (endTime < startTime) {
        // Overnight quiet hours
        active = currentTime >= startTime || currentTime < endTime;
      } else {
        // Normal quiet hours
        active = currentTime >= startTime && currentTime < endTime;
      }

      setIsActive(active);
    };

    checkQuietHours();

    // Check every minute
    const interval = setInterval(checkQuietHours, 60000);

    return () => clearInterval(interval);
  }, [preferences]);

  return isActive;
}

/**
 * useNotifications Hook
 * Lithic Healthcare Platform v0.5
 *
 * React hook for managing notifications with API integration and real-time updates.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import {
  Notification,
  NotificationListQuery,
  NotificationStatus,
} from '@/types/notifications';

interface UseNotificationsOptions {
  limit?: number;
  autoFetch?: boolean;
  realtime?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    limit = 50,
    autoFetch = true,
    realtime = true,
  } = options;

  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    setNotifications,
    setUnreadCount,
    setLoading,
    setHasMore,
    initializeSocket,
    disconnectSocket,
    markAsRead: storeMarkAsRead,
    markAllAsRead: storeMarkAllAsRead,
    deleteNotification: storeDeleteNotification,
  } = useNotificationStore();

  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (append: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/notifications?limit=${limit}&offset=${append ? offset : 0}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        if (append) {
          setNotifications([...notifications, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }

        setUnreadCount(data.unreadCount);
        setHasMore(data.hasMore);
        setOffset(append ? offset + limit : limit);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [limit, offset, notifications, setNotifications, setUnreadCount, setHasMore, setLoading]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        storeMarkAsRead(id);

        const response = await fetch(`/api/notifications/${id}/read`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to mark as read');
          // Could revert optimistic update here
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [storeMarkAsRead]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      storeMarkAllAsRead();

      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
        // Could revert optimistic update here
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [storeMarkAllAsRead]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        storeDeleteNotification(id);

        const response = await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
          // Could revert optimistic update here
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [storeDeleteNotification]
  );

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNotifications(true);
  }, [hasMore, isLoading, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchNotifications(false);
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(false);
    }
  }, [autoFetch]); // Only run on mount

  // Initialize real-time updates
  useEffect(() => {
    if (realtime) {
      // Get user ID from session or context
      const userId = 'current-user'; // Would come from auth context
      initializeSocket(userId);

      return () => {
        disconnectSocket();
      };
    }
  }, [realtime, initializeSocket, disconnectSocket]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook for unread count only (lightweight)
 */
export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();
        setCount(data.count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { count, isLoading };
}

/**
 * Hook for notification by ID
 */
export function useNotification(id: string) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notifications/${id}`);
        if (!response.ok) {
          throw new Error('Notification not found');
        }
        const data = await response.json();
        setNotification(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [id]);

  return { notification, isLoading, error };
}

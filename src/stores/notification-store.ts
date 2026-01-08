/**
 * Notification Store (Zustand)
 * Lithic Healthcare Platform v0.5
 *
 * Global state management for notifications with real-time updates.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Notification,
  NotificationPreferences,
  NotificationListResponse,
  NotificationStatus,
} from '@/types/notifications';
import { io, Socket } from 'socket.io-client';

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  hasMore: boolean;
  socket: Socket | null;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  setUnreadCount: (count: number) => void;
  setPreferences: (preferences: NotificationPreferences) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;

  // Notification operations
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;

  // WebSocket
  initializeSocket: (userId: string) => void;
  disconnectSocket: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      preferences: null,
      isLoading: false,
      hasMore: true,
      socket: null,

      // Setters
      setNotifications: (notifications) =>
        set({ notifications }, false, 'setNotifications'),

      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.readAt
              ? state.unreadCount + 1
              : state.unreadCount,
          }),
          false,
          'addNotification'
        ),

      updateNotification: (id, updates) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, ...updates } : n
            ),
          }),
          false,
          'updateNotification'
        ),

      removeNotification: (id) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const unreadCount = notification && !notification.readAt
              ? state.unreadCount - 1
              : state.unreadCount;

            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: Math.max(0, unreadCount),
            };
          },
          false,
          'removeNotification'
        ),

      setUnreadCount: (count) =>
        set({ unreadCount: count }, false, 'setUnreadCount'),

      setPreferences: (preferences) =>
        set({ preferences }, false, 'setPreferences'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setHasMore: (hasMore) =>
        set({ hasMore }, false, 'setHasMore'),

      // Notification operations
      markAsRead: (id) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (!notification || notification.readAt) {
              return state;
            }

            return {
              notifications: state.notifications.map((n) =>
                n.id === id
                  ? { ...n, readAt: new Date(), status: NotificationStatus.READ }
                  : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          },
          false,
          'markAsRead'
        ),

      markAllAsRead: () =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.readAt
                ? n
                : { ...n, readAt: new Date(), status: NotificationStatus.READ }
            ),
            unreadCount: 0,
          }),
          false,
          'markAllAsRead'
        ),

      deleteNotification: (id) => {
        get().removeNotification(id);
      },

      // WebSocket management
      initializeSocket: (userId) => {
        const existingSocket = get().socket;
        if (existingSocket?.connected) {
          return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
        const socket = io(socketUrl, {
          auth: { userId },
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          console.log('Notification socket connected');
        });

        socket.on('disconnect', () => {
          console.log('Notification socket disconnected');
        });

        socket.on('notification:new', (notification: Notification) => {
          get().addNotification(notification);
        });

        socket.on('notification:updated', (data: { id: string; updates: Partial<Notification> }) => {
          get().updateNotification(data.id, data.updates);
        });

        socket.on('notification:deleted', (data: { id: string }) => {
          get().removeNotification(data.id);
        });

        socket.on('notification:read', (data: { id: string }) => {
          get().markAsRead(data.id);
        });

        set({ socket }, false, 'initializeSocket');
      },

      disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
          socket.disconnect();
          set({ socket: null }, false, 'disconnectSocket');
        }
      },
    }),
    {
      name: 'notification-store',
    }
  )
);

// Helper hooks for specific selections
export const useNotifications = () =>
  useNotificationStore((state) => state.notifications);

export const useUnreadCount = () =>
  useNotificationStore((state) => state.unreadCount);

export const useNotificationPreferences = () =>
  useNotificationStore((state) => state.preferences);

export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
    deleteNotification: state.deleteNotification,
  }));

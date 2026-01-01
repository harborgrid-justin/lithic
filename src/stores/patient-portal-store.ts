/**
 * Patient Portal Store - Zustand State Management
 * Agent 1: Patient Portal & Experience Expert
 * Manages patient portal session, preferences, and UI state
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PatientPortalSession,
  PatientPreferences,
  PortalNotification,
  MessageThread,
  HealthSummary,
} from "@/types/patient-portal";

// ============================================================================
// Store Interface
// ============================================================================

interface PatientPortalStore {
  // Session & Authentication
  session: PatientPortalSession | null;
  isAuthenticated: boolean;
  currentPatientId: string | null;
  viewingDependentId: string | null;

  // Health Summary
  healthSummary: HealthSummary | null;
  healthSummaryLoading: boolean;

  // Notifications
  notifications: PortalNotification[];
  unreadNotificationsCount: number;

  // Messages
  messageThreads: MessageThread[];
  unreadMessagesCount: number;
  activeThread: MessageThread | null;

  // UI State
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;
  quickActionsOpen: boolean;
  preferencesPanelOpen: boolean;

  // Actions - Session
  setSession: (session: PatientPortalSession) => void;
  clearSession: () => void;
  updatePreferences: (preferences: Partial<PatientPreferences>) => void;
  switchToDependent: (dependentId: string | null) => void;

  // Actions - Health Summary
  setHealthSummary: (summary: HealthSummary) => void;
  setHealthSummaryLoading: (loading: boolean) => void;

  // Actions - Notifications
  addNotification: (notification: PortalNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Actions - Messages
  setMessageThreads: (threads: MessageThread[]) => void;
  addMessageThread: (thread: MessageThread) => void;
  updateMessageThread: (threadId: string, updates: Partial<MessageThread>) => void;
  setActiveThread: (thread: MessageThread | null) => void;
  incrementUnreadMessages: () => void;
  decrementUnreadMessages: (count?: number) => void;

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNotificationsPanel: () => void;
  toggleQuickActions: () => void;
  togglePreferencesPanel: () => void;
  closeAllPanels: () => void;

  // Utilities
  getActivePatientId: () => string | null;
  hasPermission: (permission: string) => boolean;
  isViewingDependent: () => boolean;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const usePatientPortalStore = create<PatientPortalStore>()(
  persist(
    (set, get) => ({
      // Initial State
      session: null,
      isAuthenticated: false,
      currentPatientId: null,
      viewingDependentId: null,
      healthSummary: null,
      healthSummaryLoading: false,
      notifications: [],
      unreadNotificationsCount: 0,
      messageThreads: [],
      unreadMessagesCount: 0,
      activeThread: null,
      sidebarCollapsed: false,
      notificationsPanelOpen: false,
      quickActionsOpen: false,
      preferencesPanelOpen: false,

      // Session Actions
      setSession: (session: PatientPortalSession) => {
        set({
          session,
          isAuthenticated: true,
          currentPatientId: session.patientId,
          viewingDependentId: null,
        });
      },

      clearSession: () => {
        set({
          session: null,
          isAuthenticated: false,
          currentPatientId: null,
          viewingDependentId: null,
          healthSummary: null,
          notifications: [],
          unreadNotificationsCount: 0,
          messageThreads: [],
          unreadMessagesCount: 0,
          activeThread: null,
        });
      },

      updatePreferences: (preferences: Partial<PatientPreferences>) => {
        set((state) => ({
          session: state.session
            ? {
                ...state.session,
                preferences: {
                  ...state.session.preferences,
                  ...preferences,
                },
              }
            : null,
        }));
      },

      switchToDependent: (dependentId: string | null) => {
        set({ viewingDependentId: dependentId });
      },

      // Health Summary Actions
      setHealthSummary: (summary: HealthSummary) => {
        set({ healthSummary: summary, healthSummaryLoading: false });
      },

      setHealthSummaryLoading: (loading: boolean) => {
        set({ healthSummaryLoading: loading });
      },

      // Notification Actions
      addNotification: (notification: PortalNotification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationsCount: notification.read
            ? state.unreadNotificationsCount
            : state.unreadNotificationsCount + 1,
        }));
      },

      markNotificationAsRead: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId,
          );
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId
                ? { ...n, read: true, readAt: new Date() }
                : n,
            ),
            unreadNotificationsCount: wasUnread
              ? state.unreadNotificationsCount - 1
              : state.unreadNotificationsCount,
          };
        });
      },

      markAllNotificationsAsRead: () => {
        const now = new Date();
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            read: true,
            readAt: n.readAt || now,
          })),
          unreadNotificationsCount: 0,
        }));
      },

      removeNotification: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId,
          );
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter(
              (n) => n.id !== notificationId,
            ),
            unreadNotificationsCount: wasUnread
              ? state.unreadNotificationsCount - 1
              : state.unreadNotificationsCount,
          };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadNotificationsCount: 0 });
      },

      // Message Actions
      setMessageThreads: (threads: MessageThread[]) => {
        const unreadCount = threads.reduce(
          (sum, thread) => sum + thread.unreadCount,
          0,
        );
        set({ messageThreads: threads, unreadMessagesCount: unreadCount });
      },

      addMessageThread: (thread: MessageThread) => {
        set((state) => ({
          messageThreads: [thread, ...state.messageThreads],
          unreadMessagesCount: state.unreadMessagesCount + thread.unreadCount,
        }));
      },

      updateMessageThread: (
        threadId: string,
        updates: Partial<MessageThread>,
      ) => {
        set((state) => {
          const oldThread = state.messageThreads.find((t) => t.id === threadId);
          const oldUnread = oldThread?.unreadCount || 0;
          const newUnread = updates.unreadCount ?? oldUnread;
          const unreadDiff = newUnread - oldUnread;

          return {
            messageThreads: state.messageThreads.map((t) =>
              t.id === threadId ? { ...t, ...updates } : t,
            ),
            unreadMessagesCount: state.unreadMessagesCount + unreadDiff,
          };
        });
      },

      setActiveThread: (thread: MessageThread | null) => {
        set({ activeThread: thread });
      },

      incrementUnreadMessages: () => {
        set((state) => ({
          unreadMessagesCount: state.unreadMessagesCount + 1,
        }));
      },

      decrementUnreadMessages: (count = 1) => {
        set((state) => ({
          unreadMessagesCount: Math.max(0, state.unreadMessagesCount - count),
        }));
      },

      // UI Actions
      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      toggleNotificationsPanel: () => {
        set((state) => ({
          notificationsPanelOpen: !state.notificationsPanelOpen,
          quickActionsOpen: false,
          preferencesPanelOpen: false,
        }));
      },

      toggleQuickActions: () => {
        set((state) => ({
          quickActionsOpen: !state.quickActionsOpen,
          notificationsPanelOpen: false,
          preferencesPanelOpen: false,
        }));
      },

      togglePreferencesPanel: () => {
        set((state) => ({
          preferencesPanelOpen: !state.preferencesPanelOpen,
          notificationsPanelOpen: false,
          quickActionsOpen: false,
        }));
      },

      closeAllPanels: () => {
        set({
          notificationsPanelOpen: false,
          quickActionsOpen: false,
          preferencesPanelOpen: false,
        });
      },

      // Utilities
      getActivePatientId: () => {
        const state = get();
        return state.viewingDependentId || state.currentPatientId;
      },

      hasPermission: (permission: string) => {
        const state = get();
        if (!state.session) return false;

        // If viewing a dependent, check dependent access level
        if (state.viewingDependentId) {
          const dependent = state.session.dependents.find(
            (d) => d.id === state.viewingDependentId,
          );
          if (!dependent) return false;

          // Map permissions based on access level
          if (dependent.accessLevel === "VIEW_ONLY") {
            return permission.startsWith("view") || permission.startsWith("read");
          }
          if (dependent.accessLevel === "LIMITED") {
            return !permission.includes("delete") && !permission.includes("admin");
          }
          // FULL access
          return true;
        }

        // Full access for own account
        return true;
      },

      isViewingDependent: () => {
        const state = get();
        return state.viewingDependentId !== null;
      },
    }),
    {
      name: "lithic-patient-portal-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        currentPatientId: state.currentPatientId,
        viewingDependentId: state.viewingDependentId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectSession = (state: PatientPortalStore) => state.session;
export const selectIsAuthenticated = (state: PatientPortalStore) =>
  state.isAuthenticated;
export const selectHealthSummary = (state: PatientPortalStore) =>
  state.healthSummary;
export const selectNotifications = (state: PatientPortalStore) =>
  state.notifications;
export const selectUnreadNotificationsCount = (state: PatientPortalStore) =>
  state.unreadNotificationsCount;
export const selectMessageThreads = (state: PatientPortalStore) =>
  state.messageThreads;
export const selectUnreadMessagesCount = (state: PatientPortalStore) =>
  state.unreadMessagesCount;
export const selectActiveThread = (state: PatientPortalStore) =>
  state.activeThread;
export const selectSidebarCollapsed = (state: PatientPortalStore) =>
  state.sidebarCollapsed;
export const selectActivePatientId = (state: PatientPortalStore) =>
  state.getActivePatientId();
export const selectIsViewingDependent = (state: PatientPortalStore) =>
  state.isViewingDependent();

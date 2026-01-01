/**
 * Dashboard Store - Zustand State Management
 * Manages dashboard layout, widgets, and user preferences
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export type WidgetType =
  | "metrics"
  | "tasks"
  | "alerts"
  | "schedule"
  | "patients"
  | "recent-activity"
  | "quick-stats"
  | "appointments";

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  role?: string;
  layouts: WidgetLayout[];
  widgets: WidgetConfig[];
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ============================================================================
// Default Presets
// ============================================================================

const DEFAULT_PRESETS: DashboardPreset[] = [
  {
    id: "physician-default",
    name: "Physician Dashboard",
    description: "Optimized for physicians with patient focus",
    role: "PHYSICIAN",
    layouts: [
      { id: "schedule", x: 0, y: 0, w: 6, h: 2 },
      { id: "patients", x: 6, y: 0, w: 6, h: 2 },
      { id: "alerts", x: 0, y: 2, w: 4, h: 2 },
      { id: "metrics", x: 4, y: 2, w: 4, h: 2 },
      { id: "tasks", x: 8, y: 2, w: 4, h: 2 },
    ],
    widgets: [
      {
        id: "schedule",
        type: "schedule",
        title: "Today's Schedule",
        enabled: true,
      },
      {
        id: "patients",
        type: "patients",
        title: "Recent Patients",
        enabled: true,
      },
      { id: "alerts", type: "alerts", title: "Critical Alerts", enabled: true },
      { id: "metrics", type: "metrics", title: "Key Metrics", enabled: true },
      { id: "tasks", type: "tasks", title: "My Tasks", enabled: true },
    ],
  },
  {
    id: "nurse-default",
    name: "Nurse Dashboard",
    description: "Optimized for nursing staff",
    role: "NURSE",
    layouts: [
      { id: "alerts", x: 0, y: 0, w: 6, h: 2 },
      { id: "tasks", x: 6, y: 0, w: 6, h: 2 },
      { id: "schedule", x: 0, y: 2, w: 6, h: 2 },
      { id: "patients", x: 6, y: 2, w: 6, h: 2 },
    ],
    widgets: [
      { id: "alerts", type: "alerts", title: "Patient Alerts", enabled: true },
      { id: "tasks", type: "tasks", title: "Task Queue", enabled: true },
      {
        id: "schedule",
        type: "schedule",
        title: "Today's Assignments",
        enabled: true,
      },
      { id: "patients", type: "patients", title: "My Patients", enabled: true },
    ],
  },
  {
    id: "admin-default",
    name: "Administrator Dashboard",
    description: "System overview and analytics",
    role: "ORGANIZATION_ADMIN",
    layouts: [
      { id: "metrics", x: 0, y: 0, w: 12, h: 2 },
      { id: "alerts", x: 0, y: 2, w: 6, h: 2 },
      { id: "tasks", x: 6, y: 2, w: 6, h: 2 },
    ],
    widgets: [
      {
        id: "metrics",
        type: "metrics",
        title: "System Metrics",
        enabled: true,
      },
      { id: "alerts", type: "alerts", title: "System Alerts", enabled: true },
      {
        id: "tasks",
        type: "tasks",
        title: "Administrative Tasks",
        enabled: true,
      },
    ],
  },
];

// ============================================================================
// Store Interface
// ============================================================================

interface DashboardStore {
  // Layout & Widgets
  currentPresetId: string;
  layouts: WidgetLayout[];
  widgets: WidgetConfig[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI State
  isCustomizing: boolean;
  commandPaletteOpen: boolean;
  notificationCenterOpen: boolean;

  // Actions - Layout
  setPreset: (presetId: string) => void;
  updateLayout: (layouts: WidgetLayout[]) => void;
  addWidget: (widget: WidgetConfig, layout: WidgetLayout) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  toggleWidget: (widgetId: string) => void;
  resetToDefaults: () => void;

  // Actions - Notifications
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Actions - UI
  setCustomizing: (isCustomizing: boolean) => void;
  toggleCommandPalette: () => void;
  toggleNotificationCenter: () => void;

  // Utilities
  getPreset: (presetId: string) => DashboardPreset | undefined;
  getAvailablePresets: () => DashboardPreset[];
  getEnabledWidgets: () => WidgetConfig[];
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentPresetId: "physician-default",
      layouts: DEFAULT_PRESETS[0].layouts,
      widgets: DEFAULT_PRESETS[0].widgets,
      notifications: [],
      unreadCount: 0,
      isCustomizing: false,
      commandPaletteOpen: false,
      notificationCenterOpen: false,

      // Layout Actions
      setPreset: (presetId: string) => {
        const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
        if (preset) {
          set({
            currentPresetId: presetId,
            layouts: preset.layouts,
            widgets: preset.widgets,
          });
        }
      },

      updateLayout: (layouts: WidgetLayout[]) => {
        set({ layouts });
      },

      addWidget: (widget: WidgetConfig, layout: WidgetLayout) => {
        set((state) => ({
          widgets: [...state.widgets, widget],
          layouts: [...state.layouts, layout],
        }));
      },

      removeWidget: (widgetId: string) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== widgetId),
          layouts: state.layouts.filter((l) => l.id !== widgetId),
        }));
      },

      updateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === widgetId ? { ...w, ...updates } : w,
          ),
        }));
      },

      toggleWidget: (widgetId: string) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === widgetId ? { ...w, enabled: !w.enabled } : w,
          ),
        }));
      },

      resetToDefaults: () => {
        const preset = DEFAULT_PRESETS.find(
          (p) => p.id === get().currentPresetId,
        );
        if (preset) {
          set({
            layouts: preset.layouts,
            widgets: preset.widgets,
          });
        }
      },

      // Notification Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (notificationId: string) => {
        set((state) => {
          const notification = state.notifications.find(
            (n) => n.id === notificationId,
          );
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n,
            ),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
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
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      clearAllNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // UI Actions
      setCustomizing: (isCustomizing: boolean) => {
        set({ isCustomizing });
      },

      toggleCommandPalette: () => {
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
          notificationCenterOpen: false,
        }));
      },

      toggleNotificationCenter: () => {
        set((state) => ({
          notificationCenterOpen: !state.notificationCenterOpen,
          commandPaletteOpen: false,
        }));
      },

      // Utilities
      getPreset: (presetId: string) => {
        return DEFAULT_PRESETS.find((p) => p.id === presetId);
      },

      getAvailablePresets: () => {
        return DEFAULT_PRESETS;
      },

      getEnabledWidgets: () => {
        return get().widgets.filter((w) => w.enabled);
      },
    }),
    {
      name: "lithic-dashboard-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentPresetId: state.currentPresetId,
        layouts: state.layouts,
        widgets: state.widgets,
      }),
    },
  ),
);

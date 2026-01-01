/**
 * PWA Store - Zustand State Management for PWA Features
 * Manages PWA state, settings, and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NotificationCategory } from '@/lib/pwa/push-notifications';

// ============================================================================
// Types
// ============================================================================

export interface PWASettings {
  // Installation
  installPromptDismissed: boolean;
  isInstalled: boolean;

  // Notifications
  notificationsEnabled: boolean;
  notificationCategories: Record<NotificationCategory, boolean>;

  // Offline
  offlineMode: 'auto' | 'always' | 'never';
  autoSyncEnabled: boolean;
  syncOnWifi: boolean;

  // Cache
  cacheImages: boolean;
  cacheDocuments: boolean;
  maxCacheSize: number; // in MB

  // Device Features
  biometricAuthEnabled: boolean;
  locationServicesEnabled: boolean;
  cameraAccessEnabled: boolean;

  // Background
  backgroundSyncEnabled: boolean;
  backgroundFetchEnabled: boolean;

  // Updates
  autoUpdateEnabled: boolean;
  updateCheckInterval: number; // in minutes
}

export interface SyncStatus {
  lastSyncTime: number | null;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  syncErrors: Array<{
    id: string;
    resource: string;
    error: string;
    timestamp: number;
  }>;
}

export interface CacheStatus {
  size: number;
  count: number;
  lastCleanup: number | null;
}

export interface ServiceWorkerStatus {
  registered: boolean;
  updateAvailable: boolean;
  lastUpdateCheck: number | null;
}

// ============================================================================
// Store Interface
// ============================================================================

interface PWAStore {
  // Settings
  settings: PWASettings;
  updateSettings: (settings: Partial<PWASettings>) => void;
  resetSettings: () => void;

  // Sync Status
  syncStatus: SyncStatus;
  updateSyncStatus: (status: Partial<SyncStatus>) => void;
  addSyncError: (error: {
    id: string;
    resource: string;
    error: string;
  }) => void;
  clearSyncErrors: () => void;

  // Cache Status
  cacheStatus: CacheStatus;
  updateCacheStatus: (status: Partial<CacheStatus>) => void;

  // Service Worker Status
  swStatus: ServiceWorkerStatus;
  updateSWStatus: (status: Partial<ServiceWorkerStatus>) => void;

  // Installation
  dismissInstallPrompt: () => void;
  markAsInstalled: () => void;

  // Notifications
  enableNotifications: () => void;
  disableNotifications: () => void;
  updateNotificationCategory: (category: NotificationCategory, enabled: boolean) => void;
  toggleNotificationCategory: (category: NotificationCategory) => void;

  // Offline Mode
  setOfflineMode: (mode: 'auto' | 'always' | 'never') => void;
  toggleAutoSync: () => void;
  toggleSyncOnWifi: () => void;

  // Cache Management
  setCacheImages: (enabled: boolean) => void;
  setCacheDocuments: (enabled: boolean) => void;
  setMaxCacheSize: (size: number) => void;

  // Device Features
  toggleBiometricAuth: () => void;
  toggleLocationServices: () => void;
  toggleCameraAccess: () => void;

  // Background
  toggleBackgroundSync: () => void;
  toggleBackgroundFetch: () => void;

  // Updates
  toggleAutoUpdate: () => void;
  setUpdateCheckInterval: (interval: number) => void;

  // Utilities
  getStorageUsage: () => Promise<number>;
  clearAllData: () => Promise<void>;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: PWASettings = {
  // Installation
  installPromptDismissed: false,
  isInstalled: false,

  // Notifications
  notificationsEnabled: false,
  notificationCategories: {
    'clinical-alert': true,
    'appointment': true,
    'message': true,
    'lab-result': true,
    'medication': true,
    'task': true,
    'system': false,
  },

  // Offline
  offlineMode: 'auto',
  autoSyncEnabled: true,
  syncOnWifi: true,

  // Cache
  cacheImages: true,
  cacheDocuments: true,
  maxCacheSize: 100, // 100 MB

  // Device Features
  biometricAuthEnabled: false,
  locationServicesEnabled: false,
  cameraAccessEnabled: false,

  // Background
  backgroundSyncEnabled: true,
  backgroundFetchEnabled: true,

  // Updates
  autoUpdateEnabled: true,
  updateCheckInterval: 30, // 30 minutes
};

const DEFAULT_SYNC_STATUS: SyncStatus = {
  lastSyncTime: null,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  syncErrors: [],
};

const DEFAULT_CACHE_STATUS: CacheStatus = {
  size: 0,
  count: 0,
  lastCleanup: null,
};

const DEFAULT_SW_STATUS: ServiceWorkerStatus = {
  registered: false,
  updateAvailable: false,
  lastUpdateCheck: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const usePWAStore = create<PWAStore>()(
  persist(
    (set, get) => ({
      // Initial State
      settings: DEFAULT_SETTINGS,
      syncStatus: DEFAULT_SYNC_STATUS,
      cacheStatus: DEFAULT_CACHE_STATUS,
      swStatus: DEFAULT_SW_STATUS,

      // Settings Actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      // Sync Status Actions
      updateSyncStatus: (status) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, ...status },
        }));
      },

      addSyncError: (error) => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            syncErrors: [
              ...state.syncStatus.syncErrors,
              { ...error, timestamp: Date.now() },
            ].slice(-10), // Keep only last 10 errors
            failedCount: state.syncStatus.failedCount + 1,
          },
        }));
      },

      clearSyncErrors: () => {
        set((state) => ({
          syncStatus: {
            ...state.syncStatus,
            syncErrors: [],
            failedCount: 0,
          },
        }));
      },

      // Cache Status Actions
      updateCacheStatus: (status) => {
        set((state) => ({
          cacheStatus: { ...state.cacheStatus, ...status },
        }));
      },

      // Service Worker Status Actions
      updateSWStatus: (status) => {
        set((state) => ({
          swStatus: { ...state.swStatus, ...status },
        }));
      },

      // Installation Actions
      dismissInstallPrompt: () => {
        set((state) => ({
          settings: { ...state.settings, installPromptDismissed: true },
        }));
      },

      markAsInstalled: () => {
        set((state) => ({
          settings: { ...state.settings, isInstalled: true },
        }));
      },

      // Notification Actions
      enableNotifications: () => {
        set((state) => ({
          settings: { ...state.settings, notificationsEnabled: true },
        }));
      },

      disableNotifications: () => {
        set((state) => ({
          settings: { ...state.settings, notificationsEnabled: false },
        }));
      },

      updateNotificationCategory: (category, enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notificationCategories: {
              ...state.settings.notificationCategories,
              [category]: enabled,
            },
          },
        }));
      },

      toggleNotificationCategory: (category) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notificationCategories: {
              ...state.settings.notificationCategories,
              [category]: !state.settings.notificationCategories[category],
            },
          },
        }));
      },

      // Offline Mode Actions
      setOfflineMode: (mode) => {
        set((state) => ({
          settings: { ...state.settings, offlineMode: mode },
        }));
      },

      toggleAutoSync: () => {
        set((state) => ({
          settings: { ...state.settings, autoSyncEnabled: !state.settings.autoSyncEnabled },
        }));
      },

      toggleSyncOnWifi: () => {
        set((state) => ({
          settings: { ...state.settings, syncOnWifi: !state.settings.syncOnWifi },
        }));
      },

      // Cache Management Actions
      setCacheImages: (enabled) => {
        set((state) => ({
          settings: { ...state.settings, cacheImages: enabled },
        }));
      },

      setCacheDocuments: (enabled) => {
        set((state) => ({
          settings: { ...state.settings, cacheDocuments: enabled },
        }));
      },

      setMaxCacheSize: (size) => {
        set((state) => ({
          settings: { ...state.settings, maxCacheSize: size },
        }));
      },

      // Device Features Actions
      toggleBiometricAuth: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            biometricAuthEnabled: !state.settings.biometricAuthEnabled,
          },
        }));
      },

      toggleLocationServices: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            locationServicesEnabled: !state.settings.locationServicesEnabled,
          },
        }));
      },

      toggleCameraAccess: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            cameraAccessEnabled: !state.settings.cameraAccessEnabled,
          },
        }));
      },

      // Background Actions
      toggleBackgroundSync: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            backgroundSyncEnabled: !state.settings.backgroundSyncEnabled,
          },
        }));
      },

      toggleBackgroundFetch: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            backgroundFetchEnabled: !state.settings.backgroundFetchEnabled,
          },
        }));
      },

      // Update Actions
      toggleAutoUpdate: () => {
        set((state) => ({
          settings: { ...state.settings, autoUpdateEnabled: !state.settings.autoUpdateEnabled },
        }));
      },

      setUpdateCheckInterval: (interval) => {
        set((state) => ({
          settings: { ...state.settings, updateCheckInterval: interval },
        }));
      },

      // Utilities
      getStorageUsage: async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          return estimate.usage || 0;
        }
        return 0;
      },

      clearAllData: async () => {
        // Clear cache
        const { clearAllCaches } = await import('@/lib/pwa/cache-strategies');
        await clearAllCaches();

        // Clear offline store
        const { clearAllData } = await import('@/lib/pwa/offline-store');
        await clearAllData();

        // Reset status
        set({
          syncStatus: DEFAULT_SYNC_STATUS,
          cacheStatus: DEFAULT_CACHE_STATUS,
        });
      },
    }),
    {
      name: 'lithic-pwa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

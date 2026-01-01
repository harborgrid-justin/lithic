/**
 * Custom PWA Hooks
 * React hooks for PWA functionality
 *
 * Hooks:
 * - usePWA - PWA installation state
 * - useOffline - Network status tracking
 * - usePushNotifications - Push notification management
 * - useServiceWorker - Service worker lifecycle
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  pushNotifications,
  type NotificationPermissionState,
  type NotificationCategory,
} from '@/lib/pwa/push-notifications';
import { syncManager, type SyncEvent } from '@/lib/pwa/sync-manager';
import { syncQueue } from '@/lib/pwa/offline-store';

// ============================================================================
// usePWA Hook - PWA Installation State
// ============================================================================

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  installPrompt: () => Promise<void>;
  dismissPrompt: () => void;
}

export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed
    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsInstallable(false);
    setDeferredPrompt(null);
  }, []);

  return {
    isInstalled,
    isInstallable,
    installPrompt,
    dismissPrompt,
  };
}

// ============================================================================
// useOffline Hook - Network Status
// ============================================================================

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncProgress: { current: number; total: number };
  sync: () => Promise<void>;
  getSyncStatus: () => Promise<{
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
  }>;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count
    const updatePendingCount = async () => {
      const pending = await syncQueue.getPending();
      setPendingCount(pending.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    // Listen to sync events
    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncProgress = (event: SyncEvent) => {
      if (event.progress !== undefined && event.total !== undefined) {
        setSyncProgress({ current: event.progress, total: event.total });
      }
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
      updatePendingCount();
    };

    const handleSyncError = () => {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    };

    syncManager.addEventListener('sync-start', handleSyncStart);
    syncManager.addEventListener('sync-progress', handleSyncProgress);
    syncManager.addEventListener('sync-complete', handleSyncComplete);
    syncManager.addEventListener('sync-error', handleSyncError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      syncManager.removeEventListener('sync-start', handleSyncStart);
      syncManager.removeEventListener('sync-progress', handleSyncProgress);
      syncManager.removeEventListener('sync-complete', handleSyncComplete);
      syncManager.removeEventListener('sync-error', handleSyncError);
    };
  }, []);

  const sync = useCallback(async () => {
    await syncManager.syncAll();
  }, []);

  const getSyncStatus = useCallback(async () => {
    return syncManager.getSyncStatus();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    sync,
    getSyncStatus,
  };
}

// ============================================================================
// usePushNotifications Hook - Push Notification Management
// ============================================================================

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: (userId: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  getSettings: () => Promise<{
    enabled: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    categories: Record<NotificationCategory, boolean>;
  }>;
}

export function usePushNotifications(): PushNotificationState {
  const [isSupported] = useState(() => pushNotifications.isSupported());
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check subscription status
    const checkSubscription = async () => {
      const state = await pushNotifications.getPermissionState();
      setPermission(state.permission);
      setIsSubscribed(state.subscribed);
    };

    checkSubscription();

    // Listen for permission changes
    const unsubscribe = pushNotifications.onPermissionChange((newPermission) => {
      setPermission(newPermission);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const newPermission = await pushNotifications.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const subscribe = useCallback(async (userId: string) => {
    const subscription = await pushNotifications.subscribe(userId);
    setIsSubscribed(subscription !== null);
    return subscription !== null;
  }, []);

  const unsubscribe = useCallback(async () => {
    const success = await pushNotifications.unsubscribe();
    if (success) {
      setIsSubscribed(false);
    }
    return success;
  }, []);

  const getSettings = useCallback(async () => {
    const { getNotificationSettings } = await import('@/lib/pwa/push-notifications');
    return getNotificationSettings();
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    getSettings,
  };
}

// ============================================================================
// useServiceWorker Hook - Service Worker Lifecycle
// ============================================================================

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  update: () => Promise<void>;
  unregister: () => Promise<boolean>;
}

export function useServiceWorker(): ServiceWorkerState {
  const [isSupported] = useState(
    typeof window !== 'undefined' && 'serviceWorker' in navigator
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(
    null
  );

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    // Check registration status
    const checkRegistration = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      setIsRegistered(reg !== undefined);
      setRegistration(reg || null);

      // Check for updates
      if (reg && reg.waiting) {
        setIsUpdateAvailable(true);
      }
    };

    checkRegistration();

    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [isSupported]);

  const update = useCallback(async () => {
    if (!registration) {
      return;
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      await registration.update();
    }
  }, [registration]);

  const unregister = useCallback(async () => {
    if (!registration) {
      return false;
    }

    const success = await registration.unregister();
    if (success) {
      setIsRegistered(false);
      setRegistration(null);
    }
    return success;
  }, [registration]);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    update,
    unregister,
  };
}

// ============================================================================
// useCache Hook - Cache Management
// ============================================================================

export interface CacheState {
  size: number;
  count: number;
  clear: () => Promise<void>;
  clearExpired: () => Promise<void>;
  getStats: () => Promise<{
    caches: Array<{
      name: string;
      size: number;
      count: number;
    }>;
    totalSize: number;
    totalCount: number;
  }>;
}

export function useCache(): CacheState {
  const [size, setSize] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateStats = async () => {
      const { getCacheStats } = await import('@/lib/pwa/cache-strategies');
      const stats = await getCacheStats();
      setSize(stats.totalSize);
      setCount(stats.totalCount);
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const clear = useCallback(async () => {
    const { clearAllCaches } = await import('@/lib/pwa/cache-strategies');
    await clearAllCaches();
    setSize(0);
    setCount(0);
  }, []);

  const clearExpired = useCallback(async () => {
    const { cleanupExpiredEntries } = await import('@/lib/pwa/cache-strategies');
    await cleanupExpiredEntries();

    // Update stats
    const { getCacheStats } = await import('@/lib/pwa/cache-strategies');
    const stats = await getCacheStats();
    setSize(stats.totalSize);
    setCount(stats.totalCount);
  }, []);

  const getStats = useCallback(async () => {
    const { getCacheStats } = await import('@/lib/pwa/cache-strategies');
    return getCacheStats();
  }, []);

  return {
    size,
    count,
    clear,
    clearExpired,
    getStats,
  };
}

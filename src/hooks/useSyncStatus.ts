"use client";

import * as React from "react";
import { getSyncQueueManager, type SyncResult } from "@/lib/pwa/sync-queue";
import { useOfflineStatus } from "./useOfflineStatus";

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  lastSyncTime: Date | null;
  lastSyncResult: SyncResult | null;
  error: Error | null;
}

/**
 * Use Sync Status Hook
 * Monitors sync queue status and provides sync controls
 */
export function useSyncStatus() {
  const { isOnline } = useOfflineStatus();
  const [status, setStatus] = React.useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    lastSyncTime: null,
    lastSyncResult: null,
    error: null,
  });

  const syncManager = React.useMemo(() => getSyncQueueManager(), []);

  // Update stats
  const updateStats = React.useCallback(async () => {
    try {
      const stats = await syncManager.getStats();
      setStatus((prev) => ({
        ...prev,
        pendingCount: stats.pending,
        failedCount: stats.failed,
        conflictCount: stats.conflicts,
      }));
    } catch (error) {
      console.error("Failed to update sync stats:", error);
    }
  }, [syncManager]);

  // Sync all pending items
  const syncAll = React.useCallback(async () => {
    if (!isOnline) {
      console.log("Cannot sync: offline");
      return null;
    }

    try {
      setStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      const result = await syncManager.syncAll();

      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        lastSyncResult: result,
      }));

      // Update stats
      await updateStats();

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Sync failed");
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err,
      }));
      console.error("Sync failed:", error);
      return null;
    }
  }, [isOnline, syncManager, updateStats]);

  // Retry failed items
  const retryFailed = React.useCallback(async () => {
    if (!isOnline) {
      console.log("Cannot retry: offline");
      return null;
    }

    try {
      setStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      const result = await syncManager.retryFailed();

      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        lastSyncResult: result,
      }));

      await updateStats();

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Retry failed");
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err,
      }));
      console.error("Retry failed:", error);
      return null;
    }
  }, [isOnline, syncManager, updateStats]);

  // Clear queue
  const clearQueue = React.useCallback(async () => {
    try {
      await syncManager.clearQueue();
      await updateStats();
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  }, [syncManager, updateStats]);

  // Listen to sync status changes
  React.useEffect(() => {
    const handleSyncStatusChange = (isSyncing: boolean) => {
      setStatus((prev) => ({ ...prev, isSyncing }));
    };

    syncManager.addListener(handleSyncStatusChange);

    // Initial stats update
    updateStats();

    return () => {
      syncManager.removeListener(handleSyncStatusChange);
    };
  }, [syncManager, updateStats]);

  // Auto-sync when coming online
  React.useEffect(() => {
    if (isOnline && status.pendingCount > 0 && !status.isSyncing) {
      console.log("Auto-syncing due to connection restored");
      syncAll();
    }
  }, [isOnline]); // Intentionally not including syncAll to avoid loops

  // Periodic stats update
  React.useEffect(() => {
    const interval = setInterval(updateStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    ...status,
    syncAll,
    retryFailed,
    clearQueue,
    updateStats,
    canSync: isOnline && !status.isSyncing,
  };
}

/**
 * Use Auto Sync Hook
 * Automatically syncs at regular intervals when online
 */
export function useAutoSync(
  intervalMinutes: number = 5,
  enabled: boolean = true
) {
  const { isOnline } = useOfflineStatus();
  const syncManager = React.useMemo(() => getSyncQueueManager(), []);

  React.useEffect(() => {
    if (!enabled || !isOnline) return;

    syncManager.startAutoSync(intervalMinutes);

    return () => {
      syncManager.stopAutoSync();
    };
  }, [enabled, isOnline, intervalMinutes, syncManager]);
}

/**
 * Use Sync Progress Hook
 * Provides detailed sync progress information
 */
export function useSyncProgress() {
  const [progress, setProgress] = React.useState({
    total: 0,
    current: 0,
    percentage: 0,
    currentItem: null as string | null,
  });

  const updateProgress = React.useCallback(
    (current: number, total: number, currentItem?: string) => {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
      setProgress({
        total,
        current,
        percentage,
        currentItem: currentItem || null,
      });
    },
    []
  );

  const reset = React.useCallback(() => {
    setProgress({
      total: 0,
      current: 0,
      percentage: 0,
      currentItem: null,
    });
  }, []);

  return {
    ...progress,
    updateProgress,
    reset,
  };
}

/**
 * Use Pending Changes Hook
 * Track if there are pending changes to sync
 */
export function usePendingChanges() {
  const { pendingCount, failedCount } = useSyncStatus();

  const hasPendingChanges = React.useMemo(() => {
    return pendingCount > 0 || failedCount > 0;
  }, [pendingCount, failedCount]);

  const totalPending = React.useMemo(() => {
    return pendingCount + failedCount;
  }, [pendingCount, failedCount]);

  return {
    hasPendingChanges,
    pendingCount,
    failedCount,
    totalPending,
  };
}

/**
 * Use Sync Conflicts Hook
 * Manages sync conflicts
 */
export function useSyncConflicts() {
  const [conflicts, setConflicts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const syncManager = React.useMemo(() => getSyncQueueManager(), []);

  const loadConflicts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await syncManager.getConflictItems();
      setConflicts(items);
    } catch (error) {
      console.error("Failed to load conflicts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [syncManager]);

  const resolveConflict = React.useCallback(
    async (
      itemId: number,
      strategy: "local" | "remote" | "merge"
    ) => {
      try {
        await syncManager.resolveConflict(itemId, strategy);
        await loadConflicts(); // Reload conflicts
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
        throw error;
      }
    },
    [syncManager, loadConflicts]
  );

  React.useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  return {
    conflicts,
    isLoading,
    loadConflicts,
    resolveConflict,
    hasConflicts: conflicts.length > 0,
  };
}

/**
 * Use Sync Notification Hook
 * Shows notifications for sync events
 */
export function useSyncNotification(enabled: boolean = true) {
  const { isSyncing, pendingCount, lastSyncResult } = useSyncStatus();
  const wasSync = React.useRef(isSyncing);

  React.useEffect(() => {
    if (!enabled) return;

    // Sync started
    if (!wasSync.current && isSyncing && pendingCount > 0) {
      console.log(`Syncing ${pendingCount} items...`);
    }

    // Sync completed
    if (wasSync.current && !isSyncing && lastSyncResult) {
      const { synced, failed, conflicts } = lastSyncResult;

      if (synced > 0) {
        console.log(`✓ Synced ${synced} items`);

        // Show notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sync Complete", {
            body: `Successfully synced ${synced} items`,
            icon: "/icons/icon-192x192.png",
            tag: "sync-complete",
          });
        }
      }

      if (failed > 0) {
        console.warn(`⚠ ${failed} items failed to sync`);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sync Failed", {
            body: `${failed} items failed to sync`,
            icon: "/icons/icon-192x192.png",
            tag: "sync-failed",
          });
        }
      }

      if (conflicts > 0) {
        console.warn(`⚠ ${conflicts} conflicts detected`);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Sync Conflicts", {
            body: `${conflicts} items have conflicts that need resolution`,
            icon: "/icons/icon-192x192.png",
            tag: "sync-conflicts",
          });
        }
      }
    }

    wasSync.current = isSyncing;
  }, [enabled, isSyncing, pendingCount, lastSyncResult]);
}

/**
 * Use Sync Badge Hook
 * Updates app badge with pending count
 */
export function useSyncBadge(enabled: boolean = true) {
  const { pendingCount, failedCount } = useSyncStatus();

  React.useEffect(() => {
    if (!enabled) return;

    const totalPending = pendingCount + failedCount;

    // Update badge using Badge API
    if ("setAppBadge" in navigator) {
      if (totalPending > 0) {
        (navigator as any).setAppBadge(totalPending);
      } else {
        (navigator as any).clearAppBadge();
      }
    }
  }, [enabled, pendingCount, failedCount]);
}

/**
 * Sync Queue Manager for Lithic Healthcare Platform
 * Handles offline-to-online data reconciliation with conflict resolution
 */

import { getOfflineStorage, StoreName } from "./offline-storage";

export enum SyncStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CONFLICT = "CONFLICT",
}

export enum SyncOperation {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export interface SyncQueueItem {
  id?: number;
  storeName: StoreName;
  recordId: string;
  operation: SyncOperation;
  data: any;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  error?: string;
  conflictData?: any;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  items: SyncQueueItem[];
}

export interface ConflictResolutionStrategy {
  (local: any, remote: any): any;
}

/**
 * Sync Queue Manager
 */
export class SyncQueueManager {
  private storage = getOfflineStorage();
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: boolean) => void> = new Set();

  /**
   * Add item to sync queue
   */
  async enqueue(
    storeName: StoreName,
    recordId: string,
    operation: SyncOperation,
    data: any
  ): Promise<void> {
    const item: SyncQueueItem = {
      storeName,
      recordId,
      operation,
      data,
      timestamp: Date.now(),
      status: SyncStatus.PENDING,
      retryCount: 0,
      maxRetries: 3,
    };

    await this.storage.init();
    await this.storage.put(StoreName.SYNC_QUEUE, item, false);

    console.log("Added to sync queue:", item);

    // Trigger sync if online
    if (navigator.onLine) {
      this.triggerSync();
    }
  }

  /**
   * Get all pending sync items
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    await this.storage.init();
    const allItems = await this.storage.getAll<SyncQueueItem>(
      StoreName.SYNC_QUEUE
    );

    return allItems
      .filter(
        (item) =>
          item.status === SyncStatus.PENDING ||
          item.status === SyncStatus.FAILED
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get failed items
   */
  async getFailedItems(): Promise<SyncQueueItem[]> {
    await this.storage.init();
    const allItems = await this.storage.getAll<SyncQueueItem>(
      StoreName.SYNC_QUEUE
    );

    return allItems
      .filter((item) => item.status === SyncStatus.FAILED)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get conflict items
   */
  async getConflictItems(): Promise<SyncQueueItem[]> {
    await this.storage.init();
    const allItems = await this.storage.getAll<SyncQueueItem>(
      StoreName.SYNC_QUEUE
    );

    return allItems
      .filter((item) => item.status === SyncStatus.CONFLICT)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        items: [],
      };
    }

    if (!navigator.onLine) {
      console.log("Cannot sync: offline");
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        items: [],
      };
    }

    this.isSyncing = true;
    this.notifyListeners(true);

    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    const processedItems: SyncQueueItem[] = [];

    try {
      const pendingItems = await this.getPendingItems();

      console.log(`Starting sync of ${pendingItems.length} items`);

      for (const item of pendingItems) {
        try {
          await this.updateItemStatus(item, SyncStatus.IN_PROGRESS);

          const result = await this.syncItem(item);

          if (result.success) {
            await this.updateItemStatus(item, SyncStatus.COMPLETED);
            synced++;
          } else if (result.conflict) {
            await this.updateItemStatus(
              item,
              SyncStatus.CONFLICT,
              undefined,
              result.conflictData
            );
            conflicts++;
          } else {
            item.retryCount++;

            if (item.retryCount >= item.maxRetries) {
              await this.updateItemStatus(
                item,
                SyncStatus.FAILED,
                result.error
              );
              failed++;
            } else {
              await this.updateItemStatus(item, SyncStatus.PENDING);
            }
          }

          processedItems.push(item);
        } catch (error) {
          console.error("Error syncing item:", error);
          await this.updateItemStatus(
            item,
            SyncStatus.FAILED,
            error instanceof Error ? error.message : "Unknown error"
          );
          failed++;
          processedItems.push(item);
        }
      }

      // Clean up completed items (optional - you may want to keep them for audit)
      await this.cleanupCompletedItems();

      console.log(
        `Sync completed: ${synced} synced, ${failed} failed, ${conflicts} conflicts`
      );

      return {
        success: true,
        synced,
        failed,
        conflicts,
        items: processedItems,
      };
    } finally {
      this.isSyncing = false;
      this.notifyListeners(false);
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(
    item: SyncQueueItem
  ): Promise<{
    success: boolean;
    conflict?: boolean;
    conflictData?: any;
    error?: string;
  }> {
    try {
      // Determine API endpoint based on store name and operation
      const endpoint = this.getEndpoint(item.storeName, item.operation);

      let response: Response;

      switch (item.operation) {
        case SyncOperation.CREATE:
          response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.data),
          });
          break;

        case SyncOperation.UPDATE:
          response = await fetch(`${endpoint}/${item.recordId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.data),
          });
          break;

        case SyncOperation.DELETE:
          response = await fetch(`${endpoint}/${item.recordId}`, {
            method: "DELETE",
          });
          break;
      }

      if (response.ok) {
        // Update local storage with server response
        const serverData = await response.json();
        await this.updateLocalStore(item.storeName, serverData);

        return { success: true };
      } else if (response.status === 409) {
        // Conflict detected
        const conflictData = await response.json();
        return { success: false, conflict: true, conflictData };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get API endpoint for sync operation
   */
  private getEndpoint(storeName: StoreName, operation: SyncOperation): string {
    const baseUrl = "/api";

    const endpointMap: Record<StoreName, string> = {
      [StoreName.PATIENTS]: `${baseUrl}/patients`,
      [StoreName.APPOINTMENTS]: `${baseUrl}/appointments`,
      [StoreName.CLINICAL_NOTES]: `${baseUrl}/clinical/notes`,
      [StoreName.MEDICATIONS]: `${baseUrl}/medications`,
      [StoreName.LAB_RESULTS]: `${baseUrl}/laboratory/results`,
      [StoreName.VITALS]: `${baseUrl}/vitals`,
      [StoreName.SYNC_QUEUE]: "",
      [StoreName.METADATA]: "",
    };

    return endpointMap[storeName] || baseUrl;
  }

  /**
   * Update local store with server data
   */
  private async updateLocalStore(
    storeName: StoreName,
    data: any
  ): Promise<void> {
    if (
      storeName === StoreName.SYNC_QUEUE ||
      storeName === StoreName.METADATA
    ) {
      return;
    }

    await this.storage.put(storeName, data);
  }

  /**
   * Update sync item status
   */
  private async updateItemStatus(
    item: SyncQueueItem,
    status: SyncStatus,
    error?: string,
    conflictData?: any
  ): Promise<void> {
    const updatedItem: SyncQueueItem = {
      ...item,
      status,
      error,
      conflictData,
    };

    await this.storage.put(StoreName.SYNC_QUEUE, updatedItem, false);
  }

  /**
   * Resolve conflict with strategy
   */
  async resolveConflict(
    itemId: number,
    strategy: "local" | "remote" | "merge",
    mergeStrategy?: ConflictResolutionStrategy
  ): Promise<void> {
    await this.storage.init();
    const item = await this.storage.get<SyncQueueItem>(
      StoreName.SYNC_QUEUE,
      itemId.toString()
    );

    if (!item || item.status !== SyncStatus.CONFLICT) {
      throw new Error("Item not found or not in conflict state");
    }

    let resolvedData: any;

    switch (strategy) {
      case "local":
        resolvedData = item.data;
        break;

      case "remote":
        resolvedData = item.conflictData;
        break;

      case "merge":
        if (!mergeStrategy) {
          throw new Error("Merge strategy function required");
        }
        resolvedData = mergeStrategy(item.data, item.conflictData);
        break;
    }

    // Update item with resolved data and reset to pending
    const resolvedItem: SyncQueueItem = {
      ...item,
      data: resolvedData,
      status: SyncStatus.PENDING,
      retryCount: 0,
      conflictData: undefined,
    };

    await this.storage.put(StoreName.SYNC_QUEUE, resolvedItem, false);

    // Trigger sync
    await this.syncAll();
  }

  /**
   * Clean up completed items older than retention period
   */
  private async cleanupCompletedItems(
    retentionDays: number = 7
  ): Promise<void> {
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    await this.storage.init();
    const allItems = await this.storage.getAll<SyncQueueItem>(
      StoreName.SYNC_QUEUE
    );

    const itemsToDelete = allItems.filter(
      (item) =>
        item.status === SyncStatus.COMPLETED && item.timestamp < cutoffTime
    );

    for (const item of itemsToDelete) {
      if (item.id) {
        await this.storage.delete(StoreName.SYNC_QUEUE, item.id.toString());
      }
    }

    console.log(`Cleaned up ${itemsToDelete.length} completed sync items`);
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<SyncResult> {
    const failedItems = await this.getFailedItems();

    // Reset failed items to pending with increased max retries
    for (const item of failedItems) {
      const updatedItem: SyncQueueItem = {
        ...item,
        status: SyncStatus.PENDING,
        retryCount: 0,
        maxRetries: item.maxRetries + 2,
        error: undefined,
      };

      await this.storage.put(StoreName.SYNC_QUEUE, updatedItem, false);
    }

    return await this.syncAll();
  }

  /**
   * Clear all sync queue items
   */
  async clearQueue(): Promise<void> {
    await this.storage.clear(StoreName.SYNC_QUEUE);
    console.log("Sync queue cleared");
  }

  /**
   * Get sync queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    conflicts: number;
  }> {
    await this.storage.init();
    const allItems = await this.storage.getAll<SyncQueueItem>(
      StoreName.SYNC_QUEUE
    );

    return {
      total: allItems.length,
      pending: allItems.filter((i) => i.status === SyncStatus.PENDING).length,
      inProgress: allItems.filter((i) => i.status === SyncStatus.IN_PROGRESS)
        .length,
      completed: allItems.filter((i) => i.status === SyncStatus.COMPLETED)
        .length,
      failed: allItems.filter((i) => i.status === SyncStatus.FAILED).length,
      conflicts: allItems.filter((i) => i.status === SyncStatus.CONFLICT)
        .length,
    };
  }

  /**
   * Start automatic sync (when online)
   */
  startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        console.log("Auto-sync triggered");
        this.syncAll();
      }
    }, intervalMs);

    console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("Auto-sync stopped");
    }
  }

  /**
   * Trigger immediate sync
   */
  triggerSync(): void {
    if (!this.isSyncing && navigator.onLine) {
      this.syncAll();
    }
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Add sync status listener
   */
  addListener(callback: (isSyncing: boolean) => void): void {
    this.listeners.add(callback);
  }

  /**
   * Remove sync status listener
   */
  removeListener(callback: (isSyncing: boolean) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of sync status change
   */
  private notifyListeners(isSyncing: boolean): void {
    this.listeners.forEach((callback) => callback(isSyncing));
  }
}

/**
 * Singleton instance
 */
let syncQueueManager: SyncQueueManager | null = null;

/**
 * Get sync queue manager instance
 */
export function getSyncQueueManager(): SyncQueueManager {
  if (!syncQueueManager) {
    syncQueueManager = new SyncQueueManager();
  }
  return syncQueueManager;
}

/**
 * Common conflict resolution strategies
 */
export const ConflictStrategies = {
  /**
   * Use local data (last write wins - local)
   */
  useLocal: (local: any, remote: any) => local,

  /**
   * Use remote data (last write wins - remote)
   */
  useRemote: (local: any, remote: any) => remote,

  /**
   * Merge based on timestamps
   */
  mergeByTimestamp: (local: any, remote: any) => {
    const localTime = local.updatedAt || local.timestamp || 0;
    const remoteTime = remote.updatedAt || remote.timestamp || 0;
    return localTime > remoteTime ? local : remote;
  },

  /**
   * Deep merge objects
   */
  deepMerge: (local: any, remote: any) => {
    return { ...remote, ...local };
  },

  /**
   * Field-level merge (keep newer fields)
   */
  fieldLevelMerge: (local: any, remote: any) => {
    const merged = { ...remote };

    for (const key in local) {
      if (
        local[key] !== remote[key] &&
        (!remote[key] || local[key + "UpdatedAt"] > remote[key + "UpdatedAt"])
      ) {
        merged[key] = local[key];
      }
    }

    return merged;
  },
};

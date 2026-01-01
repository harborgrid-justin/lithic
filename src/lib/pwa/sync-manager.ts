/**
 * Sync Manager - Background sync queue management for PWA
 * Handles offline mutations with automatic retry and conflict resolution
 *
 * Features:
 * - Background sync queue management
 * - Exponential backoff retry logic
 * - Conflict detection and resolution
 * - Priority-based sync ordering
 * - Network-aware syncing
 */

import {
  syncQueue,
  appointmentStore,
  clinicalNoteStore,
  type SyncQueueItem,
  type SyncStatus,
} from './offline-store';

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  resource: string;
  action: string;
  error: string;
  retryable: boolean;
}

export interface ConflictResolution {
  strategy: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  resolvedData?: any;
}

export type SyncEventType = 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error' | 'conflict-detected';

export interface SyncEvent {
  type: SyncEventType;
  resource?: string;
  progress?: number;
  total?: number;
  error?: string;
  conflict?: ConflictData;
}

export interface ConflictData {
  id: string;
  resource: string;
  localVersion: any;
  serverVersion: any;
  timestamp: number;
}

// ============================================================================
// Configuration
// ============================================================================

const SYNC_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  batchSize: 10,
  timeout: 30000, // 30 seconds per request
};

// Event listeners for sync events
const syncListeners: Map<string, Set<(event: SyncEvent) => void>> = new Map();

// ============================================================================
// Sync Manager Class
// ============================================================================

class SyncManager {
  private isSyncing: boolean = false;
  private syncPromise: Promise<SyncResult> | null = null;

  /**
   * Register a background sync
   */
  async registerSync(tag: string): Promise<boolean> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('[SyncManager] Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('[SyncManager] Failed to register background sync:', error);
        return false;
      }
    } else {
      console.warn('[SyncManager] Background Sync API not supported');
      return false;
    }
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<SyncResult> {
    // If already syncing, return the existing promise
    if (this.isSyncing && this.syncPromise) {
      return this.syncPromise;
    }

    this.isSyncing = true;
    this.emitEvent({ type: 'sync-start' });

    this.syncPromise = this.performSync();

    try {
      const result = await this.syncPromise;
      this.emitEvent({ type: 'sync-complete' });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({ type: 'sync-error', error: errorMessage });
      throw error;
    } finally {
      this.isSyncing = false;
      this.syncPromise = null;
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Check if online
      if (!navigator.onLine) {
        throw new Error('Cannot sync while offline');
      }

      // Get pending items
      const pendingItems = await syncQueue.getPending();

      if (pendingItems.length === 0) {
        console.log('[SyncManager] No items to sync');
        return result;
      }

      console.log('[SyncManager] Syncing', pendingItems.length, 'items');
      const total = pendingItems.length;

      // Process items in batches
      for (let i = 0; i < pendingItems.length; i += SYNC_CONFIG.batchSize) {
        const batch = pendingItems.slice(i, i + SYNC_CONFIG.batchSize);

        for (const item of batch) {
          try {
            await this.syncItem(item);
            result.syncedCount++;

            // Update progress
            this.emitEvent({
              type: 'sync-progress',
              progress: result.syncedCount,
              total,
            });
          } catch (error) {
            result.failedCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            result.errors.push({
              id: item.id,
              resource: item.resource,
              action: item.action,
              error: errorMessage,
              retryable: this.isRetryableError(error),
            });

            // Update item status
            await syncQueue.updateStatus(item.id, 'failed', errorMessage);
          }
        }
      }

      result.success = result.failedCount === 0;
      return result;
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      result.success = false;
      throw error;
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    console.log('[SyncManager] Syncing item:', item.resource, item.action, item.id);

    // Update status to syncing
    await syncQueue.updateStatus(item.id, 'syncing');

    try {
      let response: Response;

      // Perform the sync based on action
      switch (item.action) {
        case 'create':
          response = await this.createResource(item.resource, item.data);
          break;
        case 'update':
          response = await this.updateResource(item.resource, item.data);
          break;
        case 'delete':
          response = await this.deleteResource(item.resource, item.data.id);
          break;
        default:
          throw new Error(`Unknown action: ${item.action}`);
      }

      // Check response
      if (!response.ok) {
        if (response.status === 409) {
          // Conflict - needs resolution
          await this.handleConflict(item, response);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // Success - update local store and remove from queue
        const responseData = await response.json();
        await this.updateLocalStore(item.resource, item.data.id, responseData);
        await syncQueue.remove(item.id);
      }
    } catch (error) {
      // Calculate retry delay with exponential backoff
      const delay = Math.min(
        SYNC_CONFIG.baseDelay * Math.pow(2, item.retryCount),
        SYNC_CONFIG.maxDelay
      );

      console.error('[SyncManager] Sync failed, retry in', delay, 'ms:', error);

      // Update status with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await syncQueue.updateStatus(item.id, 'pending', errorMessage);

      throw error;
    }
  }

  /**
   * Create a resource on the server
   */
  private async createResource(resource: string, data: any): Promise<Response> {
    const endpoint = this.getEndpoint(resource);

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    });
  }

  /**
   * Update a resource on the server
   */
  private async updateResource(resource: string, data: any): Promise<Response> {
    const endpoint = this.getEndpoint(resource, data.id);

    return fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': data.version || '*',
      },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    });
  }

  /**
   * Delete a resource on the server
   */
  private async deleteResource(resource: string, id: string): Promise<Response> {
    const endpoint = this.getEndpoint(resource, id);

    return fetch(endpoint, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(item: SyncQueueItem, response: Response): Promise<void> {
    const serverData = await response.json();

    const conflict: ConflictData = {
      id: item.data.id,
      resource: item.resource,
      localVersion: item.data,
      serverVersion: serverData,
      timestamp: Date.now(),
    };

    console.warn('[SyncManager] Conflict detected:', conflict);

    // Emit conflict event
    this.emitEvent({
      type: 'conflict-detected',
      conflict,
    });

    // Apply conflict resolution strategy
    const resolution = await this.resolveConflict(conflict);

    if (resolution.strategy === 'server-wins') {
      // Accept server version
      await this.updateLocalStore(item.resource, item.data.id, serverData);
      await syncQueue.remove(item.id);
    } else if (resolution.strategy === 'client-wins') {
      // Force update with local version
      const endpoint = this.getEndpoint(item.resource, item.data.id);
      const forceResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Force-Update': 'true',
        },
        body: JSON.stringify(item.data),
        credentials: 'same-origin',
      });

      if (forceResponse.ok) {
        await syncQueue.remove(item.id);
      } else {
        throw new Error('Force update failed');
      }
    } else if (resolution.strategy === 'merge' && resolution.resolvedData) {
      // Merge and update
      const endpoint = this.getEndpoint(item.resource, item.data.id);
      const mergeResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resolution.resolvedData),
        credentials: 'same-origin',
      });

      if (mergeResponse.ok) {
        const mergedData = await mergeResponse.json();
        await this.updateLocalStore(item.resource, item.data.id, mergedData);
        await syncQueue.remove(item.id);
      } else {
        throw new Error('Merge update failed');
      }
    } else {
      // Manual resolution required - keep in queue
      await syncQueue.updateStatus(item.id, 'failed', 'Manual conflict resolution required');
    }
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflict(conflict: ConflictData): Promise<ConflictResolution> {
    // Default strategy: server wins for safety
    // In production, this could be configurable per resource type

    // For critical clinical data, prefer server version
    if (
      conflict.resource === 'clinical-notes' ||
      conflict.resource === 'medications' ||
      conflict.resource === 'allergies'
    ) {
      return { strategy: 'server-wins' };
    }

    // For appointments, try to merge
    if (conflict.resource === 'appointments') {
      const merged = this.mergeAppointmentData(
        conflict.localVersion,
        conflict.serverVersion
      );
      return { strategy: 'merge', resolvedData: merged };
    }

    // Default: server wins
    return { strategy: 'server-wins' };
  }

  /**
   * Merge appointment data
   */
  private mergeAppointmentData(local: any, server: any): any {
    // Simple merge strategy: keep most recent changes per field
    const merged = { ...server };

    // If local has more recent notes, keep them
    if (local.notes && local.updatedAt > server.updatedAt) {
      merged.notes = local.notes;
    }

    // If local status change is more recent, keep it
    if (local.status && local.statusUpdatedAt > (server.statusUpdatedAt || 0)) {
      merged.status = local.status;
      merged.statusUpdatedAt = local.statusUpdatedAt;
    }

    return merged;
  }

  /**
   * Update local store after sync
   */
  private async updateLocalStore(resource: string, id: string, data: any): Promise<void> {
    switch (resource) {
      case 'appointments':
        await appointmentStore.updateSyncStatus(id, 'synced');
        break;
      case 'clinical-notes':
        await clinicalNoteStore.updateSyncStatus(id, 'synced');
        break;
      // Add other resources as needed
    }
  }

  /**
   * Get API endpoint for resource
   */
  private getEndpoint(resource: string, id?: string): string {
    const baseUrl = '/api';
    const resourcePath = this.getResourcePath(resource);

    if (id) {
      return `${baseUrl}/${resourcePath}/${id}`;
    }
    return `${baseUrl}/${resourcePath}`;
  }

  /**
   * Get resource path from resource name
   */
  private getResourcePath(resource: string): string {
    const paths: Record<string, string> = {
      'appointments': 'scheduling/appointments',
      'clinical-notes': 'clinical/notes',
      'medications': 'clinical/medications',
      'allergies': 'clinical/allergies',
      'patients': 'patients',
    };

    return paths[resource] || resource;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError) {
      // Network errors are retryable
      return true;
    }

    if (error instanceof Error) {
      // Specific HTTP errors that are retryable
      const retryableMessages = ['timeout', 'network', '429', '500', '502', '503', '504'];
      return retryableMessages.some((msg) =>
        error.message.toLowerCase().includes(msg)
      );
    }

    return false;
  }

  /**
   * Add event listener
   */
  addEventListener(type: SyncEventType, callback: (event: SyncEvent) => void): void {
    if (!syncListeners.has(type)) {
      syncListeners.set(type, new Set());
    }
    syncListeners.get(type)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: SyncEventType, callback: (event: SyncEvent) => void): void {
    const listeners = syncListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit sync event
   */
  private emitEvent(event: SyncEvent): void {
    const listeners = syncListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    pendingCount: number;
    failedCount: number;
  }> {
    const pending = await syncQueue.getPending();

    return {
      isSyncing: this.isSyncing,
      pendingCount: pending.length,
      failedCount: 0, // TODO: Track failed items separately
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const syncManager = new SyncManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Queue a change for sync
 */
export async function queueChange(
  resource: string,
  action: 'create' | 'update' | 'delete',
  data: any,
  priority: number = 0
): Promise<string> {
  const id = await syncQueue.add(resource, action, data, priority);

  // Try to register background sync
  await syncManager.registerSync('sync-all');

  // If online, trigger immediate sync
  if (navigator.onLine) {
    syncManager.syncAll().catch((error) => {
      console.error('[SyncManager] Immediate sync failed:', error);
    });
  }

  return id;
}

/**
 * Sync specific resource type
 */
export async function syncResource(resource: string): Promise<SyncResult> {
  // For now, this just syncs all - could be optimized to filter by resource
  return syncManager.syncAll();
}

/**
 * Retry failed sync items
 */
export async function retryFailedSync(): Promise<SyncResult> {
  // Reset failed items to pending
  // TODO: Implement failed items tracking
  return syncManager.syncAll();
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  await syncQueue.clear();
}

/**
 * Listen to service worker sync events
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_START') {
      syncManager.syncAll().catch((error) => {
        console.error('[SyncManager] Service worker sync failed:', error);
      });
    }
  });
}

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncManager] Network online - triggering sync');
    syncManager.syncAll().catch((error) => {
      console.error('[SyncManager] Auto-sync on online failed:', error);
    });
  });
}

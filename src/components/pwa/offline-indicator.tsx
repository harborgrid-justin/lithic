/**
 * Offline Indicator Component
 * Shows network status and sync progress
 *
 * Features:
 * - Real-time online/offline status
 * - Sync queue status
 * - Pending changes counter
 * - Auto-sync trigger
 */

'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncManager, type SyncEvent } from '@/lib/pwa/sync-manager';
import { syncQueue } from '@/lib/pwa/offline-store';

type NetworkStatus = 'online' | 'offline' | 'syncing';

export function OfflineIndicator() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Initial network status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    // Listen to network status changes
    const handleOnline = () => {
      setNetworkStatus('online');
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
    };

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
      setNetworkStatus('syncing');
    };

    const handleSyncProgress = (event: SyncEvent) => {
      if (event.progress !== undefined && event.total !== undefined) {
        setSyncProgress({ current: event.progress, total: event.total });
      }
    };

    const handleSyncComplete = () => {
      setNetworkStatus('online');
      setSyncProgress({ current: 0, total: 0 });
      updatePendingCount();
    };

    const handleSyncError = () => {
      setNetworkStatus('online');
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

  const handleSync = async () => {
    try {
      await syncManager.syncAll();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Don't show indicator if online with no pending changes
  if (networkStatus === 'online' && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg transition-all',
          networkStatus === 'offline' && 'border-red-200 bg-red-50 text-red-700',
          networkStatus === 'online' && 'border-green-200 bg-green-50 text-green-700',
          networkStatus === 'syncing' && 'border-blue-200 bg-blue-50 text-blue-700'
        )}
      >
        {/* Status Icon */}
        <div className="flex items-center gap-2">
          {networkStatus === 'offline' && (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </>
          )}
          {networkStatus === 'online' && pendingCount > 0 && (
            <>
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Online</span>
            </>
          )}
          {networkStatus === 'syncing' && (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Syncing...</span>
            </>
          )}
        </div>

        {/* Pending Count or Progress */}
        {networkStatus === 'syncing' && syncProgress.total > 0 ? (
          <span className="text-sm">
            {syncProgress.current}/{syncProgress.total}
          </span>
        ) : (
          pendingCount > 0 && (
            <span className="rounded-full bg-current px-2 py-0.5 text-xs font-semibold text-white">
              {pendingCount}
            </span>
          )
        )}

        {/* Sync Button */}
        {networkStatus === 'online' && pendingCount > 0 && (
          <button
            onClick={handleSync}
            className="ml-2 rounded p-1 hover:bg-black/10"
            title="Sync now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-1 text-xs underline"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div
          className={cn(
            'mt-2 rounded-lg border bg-white p-3 shadow-lg',
            networkStatus === 'offline' && 'border-red-200',
            networkStatus === 'online' && 'border-green-200',
            networkStatus === 'syncing' && 'border-blue-200'
          )}
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Network Status:</span>
              <span className="font-medium">
                {networkStatus === 'offline' && 'Offline'}
                {networkStatus === 'online' && 'Online'}
                {networkStatus === 'syncing' && 'Syncing'}
              </span>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Changes:</span>
                <span className="font-medium">{pendingCount}</span>
              </div>
            )}

            {networkStatus === 'offline' && (
              <div className="flex items-start gap-2 rounded bg-amber-50 p-2 text-xs text-amber-700">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <p>
                  You&apos;re offline. Changes will be saved locally and synced when you&apos;re back
                  online.
                </p>
              </div>
            )}

            {networkStatus === 'online' && pendingCount > 0 && (
              <button
                onClick={handleSync}
                className="w-full rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Sync Now
              </button>
            )}

            {networkStatus === 'online' && pendingCount === 0 && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>All changes synced</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

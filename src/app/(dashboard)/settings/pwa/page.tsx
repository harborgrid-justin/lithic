/**
 * PWA Settings Page
 * Comprehensive settings for PWA features, notifications, offline mode, and storage
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Wifi,
  HardDrive,
  Download,
  RefreshCw,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Database,
  Lock,
  MapPin,
  Camera,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { usePWAStore } from '@/stores/pwa-store';
import { usePWA, useOffline, usePushNotifications, useServiceWorker, useCache } from '@/hooks/use-pwa';
import { formatBytes } from '@/lib/pwa/cache-strategies';
import { cn } from '@/lib/utils';

export default function PWASettingsPage() {
  const pwaStore = usePWAStore();
  const pwa = usePWA();
  const offline = useOffline();
  const notifications = usePushNotifications();
  const serviceWorker = useServiceWorker();
  const cache = useCache();

  const [storageUsage, setStorageUsage] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Update storage usage
    const updateStorageUsage = async () => {
      const usage = await pwaStore.getStorageUsage();
      setStorageUsage(usage);
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await notifications.requestPermission();
    if (permission === 'granted') {
      // Subscribe to push notifications
      // Note: userId should come from auth context
      await notifications.subscribe('current-user-id');
      pwaStore.enableNotifications();
    }
  };

  const handleDisableNotifications = async () => {
    await notifications.unsubscribe();
    pwaStore.disableNotifications();
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await cache.clear();
      await pwaStore.clearAllData();
    } finally {
      setIsClearing(false);
    }
  };

  const handleSync = async () => {
    await offline.sync();
  };

  const handleUpdate = async () => {
    await serviceWorker.update();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">PWA Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage offline access, notifications, and app preferences
        </p>
      </div>

      {/* Installation Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
            <Smartphone className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Installation Status</h2>
            <p className="text-sm text-gray-600">
              {pwa.isInstalled
                ? 'App is installed on this device'
                : pwa.isInstallable
                ? 'Ready to install'
                : 'Install not available'}
            </p>
          </div>
          <div>
            {pwa.isInstalled ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Installed</span>
              </div>
            ) : pwa.isInstallable ? (
              <Button onClick={pwa.installPrompt} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Push Notifications</h2>
              <p className="text-sm text-gray-600">
                Receive alerts for clinical events and appointments
              </p>
            </div>
          </div>
          <Switch
            checked={pwaStore.settings.notificationsEnabled && notifications.permission === 'granted'}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableNotifications();
              } else {
                handleDisableNotifications();
              }
            }}
            disabled={!notifications.isSupported}
          />
        </div>

        {pwaStore.settings.notificationsEnabled && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Notification Categories</h3>

              {Object.entries(pwaStore.settings.notificationCategories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between">
                  <label htmlFor={category} className="text-sm text-gray-600 capitalize">
                    {category.replace('-', ' ')}
                  </label>
                  <Switch
                    id={category}
                    checked={enabled}
                    onCheckedChange={() =>
                      pwaStore.toggleNotificationCategory(category as any)
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Offline Mode */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            offline.isOnline ? "bg-green-100" : "bg-red-100"
          )}>
            <Wifi className={cn(
              "h-5 w-5",
              offline.isOnline ? "text-green-600" : "text-red-600"
            )} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Offline Mode</h2>
            <p className="text-sm text-gray-600">
              {offline.isOnline ? 'Online' : 'Offline'} - {offline.pendingCount} pending changes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto Sync</p>
              <p className="text-xs text-gray-500">
                Automatically sync changes when online
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.autoSyncEnabled}
              onCheckedChange={pwaStore.toggleAutoSync}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Sync on WiFi Only</p>
              <p className="text-xs text-gray-500">
                Save mobile data by syncing only on WiFi
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.syncOnWifi}
              onCheckedChange={pwaStore.toggleSyncOnWifi}
            />
          </div>

          {offline.pendingCount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    {offline.pendingCount} pending changes
                  </p>
                  <p className="text-xs text-amber-700">
                    These changes will be synced when you're back online
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={!offline.isOnline || offline.isSyncing}
                >
                  {offline.isSyncing ? (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cache Management */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <HardDrive className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Storage & Cache</h2>
            <p className="text-sm text-gray-600">
              {formatBytes(storageUsage)} used - {cache.count} cached items
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearCache}
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-3 w-3" />
                Clear Cache
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cache Images</p>
              <p className="text-xs text-gray-500">
                Store images for offline viewing
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.cacheImages}
              onCheckedChange={pwaStore.setCacheImages}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Cache Documents</p>
              <p className="text-xs text-gray-500">
                Store documents for offline access
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.cacheDocuments}
              onCheckedChange={pwaStore.setCacheDocuments}
            />
          </div>
        </div>
      </Card>

      {/* Device Features */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <SettingsIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Device Features</h2>
            <p className="text-sm text-gray-600">
              Manage access to device capabilities
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Biometric Authentication</p>
                <p className="text-xs text-gray-500">
                  Use fingerprint or Face ID to unlock
                </p>
              </div>
            </div>
            <Switch
              checked={pwaStore.settings.biometricAuthEnabled}
              onCheckedChange={pwaStore.toggleBiometricAuth}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location Services</p>
                <p className="text-xs text-gray-500">
                  Enable for facility check-in
                </p>
              </div>
            </div>
            <Switch
              checked={pwaStore.settings.locationServicesEnabled}
              onCheckedChange={pwaStore.toggleLocationServices}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Camera Access</p>
                <p className="text-xs text-gray-500">
                  Enable for document scanning
                </p>
              </div>
            </div>
            <Switch
              checked={pwaStore.settings.cameraAccessEnabled}
              onCheckedChange={pwaStore.toggleCameraAccess}
            />
          </div>
        </div>
      </Card>

      {/* Service Worker */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Database className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Service Worker</h2>
            <p className="text-sm text-gray-600">
              {serviceWorker.isRegistered ? 'Active' : 'Not registered'}
            </p>
          </div>
          {serviceWorker.isUpdateAvailable && (
            <Button size="sm" onClick={handleUpdate}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Update Available
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Auto Update</p>
              <p className="text-xs text-gray-500">
                Automatically update when new version is available
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.autoUpdateEnabled}
              onCheckedChange={pwaStore.toggleAutoUpdate}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Background Sync</p>
              <p className="text-xs text-gray-500">
                Sync data in the background
              </p>
            </div>
            <Switch
              checked={pwaStore.settings.backgroundSyncEnabled}
              onCheckedChange={pwaStore.toggleBackgroundSync}
            />
          </div>
        </div>
      </Card>

      {/* Advanced Options */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Advanced Options</h2>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => cache.clearExpired()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Expired Cache Entries
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={handleClearCache}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Offline Data
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => pwaStore.resetSettings()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Service Worker Update Prompt Component
 * Notifies users when a new version is available
 *
 * Features:
 * - Detects service worker updates
 * - Skip waiting functionality
 * - Automatic reload after update
 * - Non-intrusive notification
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for service worker updates
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();

        if (!reg) {
          return;
        }

        setRegistration(reg);

        // Check for waiting service worker
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Listen for new service worker installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is waiting
                setShowUpdate(true);
              }
            });
          }
        });

        // Listen for controller change (service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page to get the latest content
          window.location.reload();
        });
      } catch (error) {
        console.error('[UpdatePrompt] Error checking for updates:', error);
      }
    };

    checkForUpdates();

    // Check for updates every 30 minutes
    const interval = setInterval(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.update();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      return;
    }

    setIsUpdating(true);

    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:w-96">
      <Card className="border-blue-200 bg-white shadow-lg">
        <div className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Update Available</h3>
                <p className="text-sm text-gray-600">
                  A new version of Lithic Healthcare is available
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleUpdate}
              className="w-full"
              size="sm"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Now
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              The app will reload automatically after updating
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

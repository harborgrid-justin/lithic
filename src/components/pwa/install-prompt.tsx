/**
 * PWA Install Prompt Component
 * Displays a prompt to install the app (Add to Home Screen)
 *
 * Features:
 * - Deferred install handling
 * - Platform-specific instructions
 * - Dismissible with "don't show again" option
 * - iOS-specific install instructions
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user has dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Listen for beforeinstallprompt event (Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show iOS instructions if on iOS
      if (isIOS) {
        setShowIOSInstructions(true);
        return;
      }
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleDismissPermanently = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Install Lithic Healthcare</h3>
              <button
                onClick={handleCloseIOSInstructions}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To install Lithic Healthcare on your iOS device:
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-gray-600">
                      Look for the <Share className="inline h-4 w-4" /> icon in Safari&apos;s toolbar
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Select &quot;Add to Home Screen&quot;</p>
                    <p className="text-gray-600">
                      Scroll down and tap the &quot;Add to Home Screen&quot; option
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Tap &quot;Add&quot;</p>
                    <p className="text-gray-600">
                      Confirm the installation by tapping &quot;Add&quot; in the top right
                    </p>
                  </div>
                </li>
              </ol>

              <Button
                onClick={handleCloseIOSInstructions}
                className="w-full"
              >
                Got it
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Install Prompt */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:w-96">
        <Card className="border-primary-200 bg-white shadow-lg">
          <div className="p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <Smartphone className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Install Lithic Healthcare</h3>
                  <p className="text-sm text-gray-600">
                    {isIOS ? 'Add to your home screen' : 'Install app for offline access'}
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
                onClick={handleInstallClick}
                className="w-full"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                {isIOS ? 'Show Instructions' : 'Install App'}
              </Button>

              <button
                onClick={handleDismissPermanently}
                className="w-full text-xs text-gray-500 hover:text-gray-700"
              >
                Don&apos;t show this again
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

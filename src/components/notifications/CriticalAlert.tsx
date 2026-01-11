/**
 * Critical Alert Component
 * Lithic Healthcare Platform v0.5
 *
 * Full-screen modal for critical notifications that require immediate attention.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface CriticalAlertProps {
  notification: Notification;
  open: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  onAction?: (actionType: string) => void;
}

export function CriticalAlert({
  notification,
  open,
  onClose,
  onAcknowledge,
  onAction,
}: CriticalAlertProps) {
  const [countdown, setCountdown] = useState(30);
  const [acknowledged, setAcknowledged] = useState(false);

  // Auto-close countdown for non-critical alerts
  useEffect(() => {
    if (!open || acknowledged) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, acknowledged]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
    onClose();
  };

  const handleAction = (actionType: string) => {
    if (onAction) {
      onAction(actionType);
    }
    handleAcknowledge();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl border-4 border-red-500 bg-red-50 dark:bg-red-950"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white">
              <AlertCircle className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-red-900 dark:text-red-100">
                {notification.title}
              </DialogTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="destructive">CRITICAL</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription asChild>
          <div className="space-y-4">
            {notification.subtitle && (
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                {notification.subtitle}
              </p>
            )}

            <div className="rounded-lg border-2 border-red-300 bg-white p-4 dark:bg-gray-900">
              <p className="text-base text-gray-900 dark:text-gray-100">
                {notification.message}
              </p>
            </div>

            {notification.imageUrl && (
              <img
                src={notification.imageUrl}
                alt="Critical alert"
                className="w-full rounded-lg border-2 border-red-300"
              />
            )}

            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="space-y-2 rounded-lg border border-red-200 bg-white p-3 dark:bg-gray-900">
                <p className="text-xs font-semibold uppercase text-red-900 dark:text-red-100">
                  Additional Information
                </p>
                <dl className="space-y-1 text-sm">
                  {Object.entries(notification.metadata)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="font-medium text-gray-600 dark:text-gray-400">
                          {key.replace(/_/g, ' ')}:
                        </dt>
                        <dd className="text-gray-900 dark:text-gray-100">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}

            {!acknowledged && countdown > 0 && (
              <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-center dark:bg-red-900">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Please acknowledge this alert
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Auto-closing in {countdown} seconds
                </p>
              </div>
            )}
          </div>
        </DialogDescription>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {notification.actions && notification.actions.length > 0 ? (
            <>
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? 'default' : 'outline'}
                  onClick={() => handleAction(action.type)}
                  className="w-full sm:w-auto"
                >
                  {action.label}
                </Button>
              ))}
            </>
          ) : (
            <Button
              onClick={handleAcknowledge}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Acknowledge Alert
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage critical alert state
 */
export function useCriticalAlerts() {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [currentAlert, setCurrentAlert] = useState<Notification | null>(null);

  useEffect(() => {
    // Show next alert when current is dismissed
    if (!currentAlert && alerts.length > 0) {
      setCurrentAlert(alerts[0]);
      setAlerts((prev) => prev.slice(1));
    }
  }, [currentAlert, alerts]);

  const addAlert = (notification: Notification) => {
    if (currentAlert) {
      setAlerts((prev) => [...prev, notification]);
    } else {
      setCurrentAlert(notification);
    }
  };

  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  return {
    currentAlert,
    addAlert,
    dismissAlert,
    queueLength: alerts.length,
  };
}

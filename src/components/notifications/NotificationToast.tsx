/**
 * Notification Toast Component
 * Lithic Healthcare Platform v0.5
 *
 * Toast notification for real-time alerts using Sonner.
 */

'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import {
  Notification,
  NotificationPriority,
} from '@/types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onAction?: (actionType: string) => void;
}

export function showNotificationToast(
  notification: Notification,
  onAction?: (actionType: string) => void
) {
  const config = {
    [NotificationPriority.CRITICAL]: {
      icon: <AlertCircle className="h-5 w-5" />,
      duration: Infinity, // Don't auto-dismiss critical
    },
    [NotificationPriority.HIGH]: {
      icon: <AlertTriangle className="h-5 w-5" />,
      duration: 10000,
    },
    [NotificationPriority.MEDIUM]: {
      icon: <Info className="h-5 w-5" />,
      duration: 5000,
    },
    [NotificationPriority.LOW]: {
      icon: <Bell className="h-5 w-5" />,
      duration: 3000,
    },
  };

  const settings = config[notification.priority];

  // Determine toast method based on priority
  const toastMethod =
    notification.priority === NotificationPriority.CRITICAL
      ? toast.error
      : notification.priority === NotificationPriority.HIGH
      ? toast.warning
      : notification.priority === NotificationPriority.MEDIUM
      ? toast.info
      : toast;

  toastMethod(notification.title, {
    description: notification.message,
    icon: settings.icon,
    duration: settings.duration,
    action: notification.actions?.[0]
      ? {
          label: notification.actions[0].label,
          onClick: () => {
            if (onAction && notification.actions?.[0]) {
              onAction(notification.actions[0].type);
            }
          },
        }
      : undefined,
    cancel:
      notification.priority === NotificationPriority.CRITICAL
        ? {
            label: 'Dismiss',
            onClick: () => {
              // Handle dismiss
            },
          }
        : undefined,
    className:
      notification.priority === NotificationPriority.CRITICAL
        ? 'border-red-500 bg-red-50 dark:bg-red-950'
        : notification.priority === NotificationPriority.HIGH
        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
        : undefined,
  });
}

export function NotificationToast({
  notification,
  onAction,
}: NotificationToastProps) {
  useEffect(() => {
    showNotificationToast(notification, onAction);
  }, [notification, onAction]);

  return null;
}

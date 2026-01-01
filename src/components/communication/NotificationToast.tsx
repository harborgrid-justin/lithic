'use client';

/**
 * NotificationToast Component
 * Toast notification display with actions
 */

import React from 'react';
import { Notification, NotificationPriority } from '@/types/communication';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCommunicationStore } from '@/stores/communication-store';

interface NotificationToastProps {
  notification: Notification;
  onDismiss?: () => void;
  onAction?: () => void;
}

export function NotificationToast({
  notification,
  onDismiss,
  onAction,
}: NotificationToastProps) {
  const { dismissNotification } = useCommunicationStore();

  const priorityStyles = {
    [NotificationPriority.LOW]: 'border-blue-200 bg-blue-50',
    [NotificationPriority.NORMAL]: 'border-gray-200 bg-white',
    [NotificationPriority.HIGH]: 'border-yellow-200 bg-yellow-50',
    [NotificationPriority.URGENT]: 'border-orange-200 bg-orange-50',
    [NotificationPriority.CRITICAL]: 'border-red-200 bg-red-50',
  };

  const priorityIcons = {
    [NotificationPriority.LOW]: <Info className="h-5 w-5 text-blue-500" />,
    [NotificationPriority.NORMAL]: <Info className="h-5 w-5 text-gray-500" />,
    [NotificationPriority.HIGH]: (
      <AlertCircle className="h-5 w-5 text-yellow-500" />
    ),
    [NotificationPriority.URGENT]: (
      <AlertTriangle className="h-5 w-5 text-orange-500" />
    ),
    [NotificationPriority.CRITICAL]: (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    ),
  };

  const handleDismiss = () => {
    dismissNotification(notification.id);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-md rounded-lg border p-4 shadow-lg',
        priorityStyles[notification.priority]
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {notification.icon ? (
            <img
              src={notification.icon}
              alt=""
              className="h-5 w-5 rounded-full"
            />
          ) : (
            priorityIcons[notification.priority]
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {notification.message}
          </p>

          {/* Timestamp */}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>

          {/* Action button */}
          {notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0"
              onClick={onAction}
            >
              View Details
            </Button>
          )}
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

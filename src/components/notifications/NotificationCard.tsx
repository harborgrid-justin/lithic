/**
 * Notification Card Component
 * Lithic Healthcare Platform v0.5
 *
 * Displays a single notification with actions and metadata.
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Notification,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notifications';

interface NotificationCardProps {
  notification: Notification;
  compact?: boolean;
  onClick?: () => void;
  onAction?: (actionType: string) => void;
  onDismiss?: () => void;
}

export function NotificationCard({
  notification,
  compact = false,
  onClick,
  onAction,
  onDismiss,
}: NotificationCardProps) {
  const isUnread = !notification.readAt;

  const priorityConfig = {
    [NotificationPriority.CRITICAL]: {
      color: 'border-red-500 bg-red-50 dark:bg-red-950',
      badgeVariant: 'destructive' as const,
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    [NotificationPriority.HIGH]: {
      color: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
      badgeVariant: 'default' as const,
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
    },
    [NotificationPriority.MEDIUM]: {
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
      badgeVariant: 'secondary' as const,
      icon: Info,
      iconColor: 'text-blue-600',
    },
    [NotificationPriority.LOW]: {
      color: 'border-gray-300 bg-gray-50 dark:bg-gray-900',
      badgeVariant: 'outline' as const,
      icon: Bell,
      iconColor: 'text-gray-600',
    },
  };

  const config = priorityConfig[notification.priority];
  const Icon = config.icon;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleAction = (actionType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(actionType);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Card
      className={cn(
        'relative cursor-pointer border-l-4 transition-all hover:shadow-md',
        config.color,
        isUnread && 'bg-accent/50',
        compact && 'p-3',
        !compact && 'p-4'
      )}
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('mt-1 flex-shrink-0', compact && 'hidden sm:block')}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    'text-sm font-semibold',
                    isUnread && 'font-bold'
                  )}
                >
                  {notification.title}
                </h4>
                {isUnread && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
              {notification.subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {notification.subtitle}
                </p>
              )}
            </div>

            {!compact && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Message */}
          <p
            className={cn(
              'text-sm text-muted-foreground',
              compact && 'line-clamp-2'
            )}
          >
            {notification.message}
          </p>

          {/* Image */}
          {notification.imageUrl && !compact && (
            <img
              src={notification.imageUrl}
              alt="Notification"
              className="mt-2 h-32 w-full rounded-md object-cover"
            />
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={config.badgeVariant} className="text-xs">
              {notification.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {notification.category.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && !compact && (
            <div className="flex flex-wrap gap-2 pt-2">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={index === 0 ? 'default' : 'outline'}
                  onClick={(e) => handleAction(action.type, e)}
                >
                  {action.label}
                  {action.url && <ExternalLink className="ml-1 h-3 w-3" />}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

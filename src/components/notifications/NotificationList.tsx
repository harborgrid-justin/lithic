/**
 * Notification List Component
 * Lithic Healthcare Platform v0.5
 *
 * Displays a list of notifications with filtering and infinite scroll.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from '@/types/notifications';

interface NotificationListProps {
  limit?: number;
  compact?: boolean;
  showFilters?: boolean;
  onNotificationClick?: () => void;
}

export function NotificationList({
  limit,
  compact = false,
  showFilters = false,
  onNotificationClick,
}: NotificationListProps) {
  const {
    notifications,
    isLoading,
    hasMore,
    markAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications({
    limit,
  });

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') {
      return !notification.readAt;
    }
    if (filter === 'read') {
      return notification.readAt;
    }
    return true;
  });

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleNotificationAction = async (
    notificationId: string,
    actionType: string
  ) => {
    await markAsRead(notificationId);
    // Handle specific action
    console.log('Action:', actionType, 'for notification:', notificationId);
  };

  const handleDismiss = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You are all caught up! Check back later for new notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            compact={compact}
            onClick={() => handleNotificationClick(notification.id)}
            onAction={(actionType) =>
              handleNotificationAction(notification.id, actionType)
            }
            onDismiss={() => handleDismiss(notification.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Notification Bell Component
 * Lithic Healthcare Platform v0.5
 *
 * Displays notification bell icon with unread count badge.
 * Provides quick access to notification center.
 */

'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';

interface NotificationBellProps {
  className?: string;
  showPopover?: boolean;
}

export function NotificationBell({
  className,
  showPopover = true,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount, isLoading } = useNotifications();

  const hasUnread = unreadCount > 0;

  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative', className)}
      aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className={cn('h-5 w-5', hasUnread && 'animate-pulse')} />
      {hasUnread && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  if (!showPopover) {
    return bellButton;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {hasUnread && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <NotificationList
              limit={5}
              compact
              onNotificationClick={() => setOpen(false)}
            />
          </div>
          <div className="border-t px-4 py-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                // Navigate to full notifications page
                window.location.href = '/notifications';
              }}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

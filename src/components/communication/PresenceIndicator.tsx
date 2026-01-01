'use client';

/**
 * PresenceIndicator Component
 * Shows user online/offline/busy status
 */

import React from 'react';
import { PresenceStatus } from '@/types/communication';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function PresenceIndicator({
  status = PresenceStatus.OFFLINE,
  size = 'sm',
  showLabel = false,
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusColors = {
    [PresenceStatus.ONLINE]: 'bg-green-500',
    [PresenceStatus.AWAY]: 'bg-yellow-500',
    [PresenceStatus.BUSY]: 'bg-red-500',
    [PresenceStatus.DO_NOT_DISTURB]: 'bg-red-700',
    [PresenceStatus.OFFLINE]: 'bg-gray-400',
    [PresenceStatus.IN_CALL]: 'bg-blue-500',
  };

  const statusLabels = {
    [PresenceStatus.ONLINE]: 'Online',
    [PresenceStatus.AWAY]: 'Away',
    [PresenceStatus.BUSY]: 'Busy',
    [PresenceStatus.DO_NOT_DISTURB]: 'Do Not Disturb',
    [PresenceStatus.OFFLINE]: 'Offline',
    [PresenceStatus.IN_CALL]: 'In Call',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full ring-2 ring-background',
          sizeClasses[size],
          statusColors[status]
        )}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}

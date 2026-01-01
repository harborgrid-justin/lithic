'use client';

/**
 * Enterprise Timeline Component
 *
 * Event timeline with:
 * - Vertical/horizontal layout
 * - Custom icons
 * - Time formatting
 * - Grouping by date
 * - Interactive events
 * - Status indicators
 * - WCAG 2.1 AA compliant
 */

import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Info, Circle } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  icon?: React.ReactNode;
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending';
  metadata?: Record<string, any>;
  onClick?: () => void;
}

export interface TimelineProps {
  events: TimelineEvent[];
  orientation?: 'vertical' | 'horizontal';
  groupByDate?: boolean;
  showTime?: boolean;
  className?: string;
}

const statusIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
  pending: Circle,
};

const statusColors = {
  success: 'text-success border-success bg-success/10',
  error: 'text-destructive border-destructive bg-destructive/10',
  warning: 'text-warning border-warning bg-warning/10',
  info: 'text-info border-info bg-info/10',
  pending: 'text-muted-foreground border-muted-foreground bg-muted',
};

export function Timeline({
  events,
  orientation = 'vertical',
  groupByDate = true,
  showTime = true,
  className = '',
}: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = typeof a.timestamp === 'string' ? parseISO(a.timestamp) : a.timestamp;
    const dateB = typeof b.timestamp === 'string' ? parseISO(b.timestamp) : b.timestamp;
    return dateB.getTime() - dateA.getTime();
  });

  const groupedEvents = groupByDate
    ? groupEventsByDate(sortedEvents)
    : { 'All Events': sortedEvents };

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <div className="flex items-start gap-4 min-w-max pb-4">
          {sortedEvents.map((event, index) => (
            <HorizontalTimelineItem
              key={event.id}
              event={event}
              showTime={showTime}
              isLast={index === sortedEvents.length - 1}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
        <div key={dateLabel} className="mb-8 last:mb-0">
          {groupByDate && (
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 sticky top-0 bg-background py-2">
              {dateLabel}
            </h3>
          )}

          <div className="relative pl-8 border-l-2 border-border">
            {dateEvents.map((event, index) => (
              <VerticalTimelineItem
                key={event.id}
                event={event}
                showTime={showTime}
                isLast={index === dateEvents.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalTimelineItem({
  event,
  showTime,
  isLast,
}: {
  event: TimelineEvent;
  showTime: boolean;
  isLast: boolean;
}) {
  const timestamp = typeof event.timestamp === 'string' ? parseISO(event.timestamp) : event.timestamp;
  const StatusIcon = event.status ? statusIcons[event.status] : Clock;
  const statusColor = event.status ? statusColors[event.status] : statusColors.pending;

  return (
    <div className={`relative ${isLast ? 'pb-0' : 'pb-8'}`}>
      {/* Icon */}
      <div
        className={`
          absolute -left-[21px] w-10 h-10 rounded-full border-2 flex items-center justify-center
          ${statusColor}
        `}
      >
        {event.icon || <StatusIcon className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div
        className={`
          ml-6 p-4 rounded-lg border border-border bg-card
          ${event.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        `}
        onClick={event.onClick}
        role={event.onClick ? 'button' : undefined}
        tabIndex={event.onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (event.onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            event.onClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {event.title}
            </h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {event.description}
              </p>
            )}
          </div>

          {showTime && (
            <time
              className="text-xs text-muted-foreground whitespace-nowrap"
              dateTime={timestamp.toISOString()}
            >
              {format(timestamp, 'h:mm a')}
            </time>
          )}
        </div>

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {Object.entries(event.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{key}:</span>
                <span className="text-foreground font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HorizontalTimelineItem({
  event,
  showTime,
  isLast,
}: {
  event: TimelineEvent;
  showTime: boolean;
  isLast: boolean;
}) {
  const timestamp = typeof event.timestamp === 'string' ? parseISO(event.timestamp) : event.timestamp;
  const StatusIcon = event.status ? statusIcons[event.status] : Clock;
  const statusColor = event.status ? statusColors[event.status] : statusColors.pending;

  return (
    <div className="flex flex-col items-center">
      {/* Content */}
      <div
        className={`
          w-64 p-4 rounded-lg border border-border bg-card mb-4
          ${event.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        `}
        onClick={event.onClick}
        role={event.onClick ? 'button' : undefined}
        tabIndex={event.onClick ? 0 : undefined}
      >
        <h4 className="text-sm font-semibold text-foreground mb-1">
          {event.title}
        </h4>
        {event.description && (
          <p className="text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
        {showTime && (
          <time
            className="text-xs text-muted-foreground mt-2 block"
            dateTime={timestamp.toISOString()}
          >
            {format(timestamp, 'MMM d, h:mm a')}
          </time>
        )}
      </div>

      {/* Timeline */}
      <div className="flex items-center">
        <div
          className={`
            w-10 h-10 rounded-full border-2 flex items-center justify-center
            ${statusColor}
          `}
        >
          {event.icon || <StatusIcon className="w-5 h-5" />}
        </div>

        {!isLast && (
          <div className="w-16 h-0.5 bg-border" />
        )}
      </div>
    </div>
  );
}

function groupEventsByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {};

  events.forEach(event => {
    const date = typeof event.timestamp === 'string' ? parseISO(event.timestamp) : event.timestamp;

    let label: string;
    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else {
      label = format(date, 'MMMM d, yyyy');
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(event);
  });

  return groups;
}

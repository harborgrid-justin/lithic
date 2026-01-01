'use client';

/**
 * Enterprise MetricGrid Component
 *
 * Dashboard metric grid with:
 * - Responsive grid layout
 * - Multiple metric cards
 * - Customizable columns
 * - Loading states
 * - Empty states
 * - WCAG 2.1 AA compliant
 */

import React from 'react';
import { StatCard, StatCardProps } from './StatCard';
import { LucideIcon } from 'lucide-react';

export interface Metric extends Omit<StatCardProps, 'className'> {
  id: string;
}

export interface MetricGridProps {
  metrics: Metric[];
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function MetricGrid({
  metrics,
  columns = 3,
  gap = 'md',
  loading = false,
  emptyMessage = 'No metrics available',
  className = '',
}: MetricGridProps) {
  if (loading) {
    return (
      <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <StatCard
            key={i}
            title=""
            value=""
            loading={true}
          />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {metrics.map(({ id, ...metricProps }) => (
        <StatCard key={id} {...metricProps} />
      ))}
    </div>
  );
}

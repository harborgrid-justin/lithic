'use client';

import React from 'react';

export interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  12: 'grid-cols-12',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export function DashboardGrid({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}: DashboardGridProps) {
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

export interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  className?: string;
}

export function GridItem({ children, colSpan = 1, rowSpan = 1, className = '' }: GridItemProps) {
  return (
    <div
      className={className}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
    >
      {children}
    </div>
  );
}

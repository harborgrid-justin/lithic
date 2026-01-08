/**
 * Layout Grid Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';

interface LayoutGridProps {
  columns?: number;
  gap?: number;
  children: React.ReactNode;
  className?: string;
}

export function LayoutGrid({
  columns = 12,
  gap = 4,
  children,
  className = '',
}: LayoutGridProps) {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
}

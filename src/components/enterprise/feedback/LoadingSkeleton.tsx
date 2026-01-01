'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  className = '',
}: LoadingSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-md';
      case 'card':
        return 'rounded-lg p-4 space-y-3';
      case 'text':
      default:
        return 'rounded h-4';
    }
  };

  const getDefaultHeight = () => {
    if (height) return height;
    switch (variant) {
      case 'circular':
        return width;
      case 'card':
        return 200;
      case 'text':
      default:
        return 16;
    }
  };

  if (variant === 'card') {
    return (
      <div
        className={`bg-muted animate-pulse ${getVariantStyles()} ${className}`}
        style={{ width, height: getDefaultHeight() }}
      >
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-muted-foreground/20 h-12 w-12" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
            <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-muted animate-pulse ${getVariantStyles()}`}
          style={{ width, height: getDefaultHeight() }}
        />
      ))}
    </div>
  );
}

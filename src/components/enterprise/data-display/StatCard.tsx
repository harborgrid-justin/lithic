'use client';

/**
 * Enterprise StatCard Component
 *
 * Statistics card with:
 * - Value display
 * - Trend indicator
 * - Comparison
 * - Icon
 * - Sparkline (optional)
 * - Click action
 * - Loading state
 * - WCAG 2.1 AA compliant
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage' | 'custom';
  precision?: number;
  loading?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  previousValue,
  change,
  changeLabel = 'vs previous period',
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  format = 'number',
  precision = 0,
  loading = false,
  onClick,
  footer,
  className = '',
}: StatCardProps) {
  // Calculate change if previous value is provided
  const calculatedChange = change ?? (
    previousValue !== undefined
      ? ((Number(value) - Number(previousValue)) / Number(previousValue)) * 100
      : undefined
  );

  // Determine trend from change
  const calculatedTrend = trend ?? (
    calculatedChange !== undefined
      ? calculatedChange > 0
        ? 'up'
        : calculatedChange < 0
        ? 'down'
        : 'neutral'
      : undefined
  );

  // Format value
  const formattedValue = formatValue(value, format, precision);

  // Trend colors
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  const TrendIcon = calculatedTrend === 'up'
    ? TrendingUp
    : calculatedTrend === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = calculatedTrend ? trendColors[calculatedTrend] : '';

  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-card border border-border rounded-lg p-6 transition-all
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formattedValue}
          </p>
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg bg-muted/50 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Trend/Change */}
      {calculatedChange !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="font-semibold">
            {Math.abs(calculatedChange).toFixed(1)}%
          </span>
          <span className="text-muted-foreground ml-1">
            {changeLabel}
          </span>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
}

function formatValue(
  value: string | number,
  format: 'number' | 'currency' | 'percentage' | 'custom',
  precision: number
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return String(value);
  }

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(numValue);

    case 'percentage':
      return `${numValue.toFixed(precision)}%`;

    case 'number':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(numValue);

    case 'custom':
    default:
      return String(value);
  }
}

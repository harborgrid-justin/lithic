/**
 * Metric Card Widget
 * Single metric display with trend indicator and sparkline
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  showSparkline?: boolean;
  sparklineData?: number[];
  target?: number;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
}

export function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  trend,
  trendValue,
  showSparkline = false,
  sparklineData = [],
  target,
  status = 'neutral',
  icon,
  subtitle,
}: MetricCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);

      case 'percentage':
        return `${val.toFixed(1)}%`;

      case 'duration':
        if (val < 60) return `${val}s`;
        if (val < 3600) return `${Math.floor(val / 60)}m`;
        return `${Math.floor(val / 3600)}h`;

      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'stable':
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (status === 'success') return 'text-green-600';
    if (status === 'warning') return 'text-yellow-600';
    if (status === 'danger') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBorder = () => {
    if (status === 'success') return 'border-l-4 border-l-green-500';
    if (status === 'warning') return 'border-l-4 border-l-yellow-500';
    if (status === 'danger') return 'border-l-4 border-l-red-500';
    return 'border-l-4 border-l-gray-300';
  };

  return (
    <Card className={`p-6 ${getStatusBorder()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold text-gray-900">
              {formatValue(value)}
            </p>
            {trendValue !== undefined && (
              <span className={`ml-2 flex items-center text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="ml-1">{Math.abs(trendValue)}%</span>
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}

          {target && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Target: {formatValue(target)}</span>
                <span>
                  {typeof value === 'number' &&
                    `${((value / target) * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    status === 'success'
                      ? 'bg-green-500'
                      : status === 'warning'
                      ? 'bg-yellow-500'
                      : status === 'danger'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      typeof value === 'number' ? (value / target) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
          </div>
        )}
      </div>

      {showSparkline && sparklineData.length > 0 && (
        <div className="mt-4">
          <Sparkline data={sparklineData} color={getTrendColor()} />
        </div>
      )}
    </Card>
  );
}

// Simple sparkline component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-full h-12" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export interface LabResult {
  test: string;
  value: number | string;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    text?: string;
  };
  status: 'normal' | 'low' | 'high' | 'critical';
  timestamp: Date | string;
  trend?: 'up' | 'down' | 'stable';
}

export interface LabResultRowProps {
  result: LabResult;
  showTrend?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

const statusStyles = {
  normal: 'text-success',
  low: 'text-warning',
  high: 'text-warning',
  critical: 'text-destructive font-semibold',
};

const statusBg = {
  normal: 'bg-success/10',
  low: 'bg-warning/10',
  high: 'bg-warning/10',
  critical: 'bg-destructive/10',
};

export function LabResultRow({
  result,
  showTrend = true,
  showTimestamp = true,
  className = '',
}: LabResultRowProps) {
  const isNumeric = typeof result.value === 'number';
  const inRange = isNumeric &&
    result.value >= result.referenceRange.min &&
    result.value <= result.referenceRange.max;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors ${className}`}>
      {/* Test Name */}
      <div className="flex-1 min-w-0">
        <div className="font-medium">{result.test}</div>
        {showTimestamp && (
          <div className="text-xs text-muted-foreground">
            {new Date(result.timestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-lg font-semibold ${statusStyles[result.status]}`}>
            {result.value} <span className="text-sm font-normal">{result.unit}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Ref: {result.referenceRange.text || `${result.referenceRange.min}-${result.referenceRange.max} ${result.unit}`}
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`w-12 h-12 rounded-lg ${statusBg[result.status]} flex items-center justify-center`}>
          {result.status === 'critical' && <AlertCircle className="w-6 h-6 text-destructive" />}
          {result.status === 'high' && <TrendingUp className="w-6 h-6 text-warning" />}
          {result.status === 'low' && <TrendingDown className="w-6 h-6 text-warning" />}
          {result.status === 'normal' && <Minus className="w-6 h-6 text-success" />}
        </div>

        {/* Trend */}
        {showTrend && result.trend && (
          <div className="w-8">
            {result.trend === 'up' && <TrendingUp className="w-5 h-5 text-muted-foreground" />}
            {result.trend === 'down' && <TrendingDown className="w-5 h-5 text-muted-foreground" />}
            {result.trend === 'stable' && <Minus className="w-5 h-5 text-muted-foreground" />}
          </div>
        )}
      </div>
    </div>
  );
}

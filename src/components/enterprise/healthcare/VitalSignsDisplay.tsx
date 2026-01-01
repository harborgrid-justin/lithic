'use client';

import React from 'react';
import { Activity, Heart, Thermometer, Wind, Droplet, TrendingUp, TrendingDown } from 'lucide-react';

export interface VitalSign {
  type: 'bp' | 'hr' | 'temp' | 'rr' | 'o2' | 'pain';
  value: string | number;
  unit: string;
  timestamp?: Date;
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
}

export interface VitalSignsDisplayProps {
  vitals: VitalSign[];
  variant?: 'compact' | 'detailed';
  showTrends?: boolean;
  className?: string;
}

const vitalConfig = {
  bp: { label: 'Blood Pressure', icon: Activity, color: 'text-blue-500' },
  hr: { label: 'Heart Rate', icon: Heart, color: 'text-red-500' },
  temp: { label: 'Temperature', icon: Thermometer, color: 'text-orange-500' },
  rr: { label: 'Respiratory Rate', icon: Wind, color: 'text-cyan-500' },
  o2: { label: 'Oxygen Saturation', icon: Droplet, color: 'text-blue-400' },
  pain: { label: 'Pain Level', icon: Activity, color: 'text-yellow-500' },
};

const statusColors = {
  normal: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function VitalSignsDisplay({
  vitals,
  variant = 'detailed',
  showTrends = true,
  className = '',
}: VitalSignsDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {vitals.map((vital, idx) => {
          const config = vitalConfig[vital.type];
          const Icon = config.icon;

          return (
            <div
              key={idx}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border
                ${vital.status ? statusColors[vital.status] : 'bg-muted border-border'}
              `}
            >
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className="font-semibold">{vital.value}</span>
              <span className="text-xs text-muted-foreground">{vital.unit}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {vitals.map((vital, idx) => {
        const config = vitalConfig[vital.type];
        const Icon = config.icon;

        return (
          <div
            key={idx}
            className={`
              p-4 rounded-lg border
              ${vital.status ? statusColors[vital.status] : 'bg-card border-border'}
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </span>
              </div>
              {showTrends && vital.trend && (
                <div className="flex items-center">
                  {vital.trend === 'up' && <TrendingUp className="w-4 h-4 text-destructive" />}
                  {vital.trend === 'down' && <TrendingDown className="w-4 h-4 text-success" />}
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{vital.value}</span>
              <span className="text-sm text-muted-foreground">{vital.unit}</span>
            </div>

            {vital.timestamp && (
              <div className="text-xs text-muted-foreground mt-2">
                {vital.timestamp.toLocaleTimeString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * KPI Grid Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  target?: string | number;
  unit?: string;
  icon?: React.ReactNode;
}

interface KPIGridProps {
  kpis: KPI[];
  columns?: number;
  className?: string;
}

export function KPIGrid({ kpis, columns = 4, className = '' }: KPIGridProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral', change: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${change < 0 ? 'text-green-500' : 'text-red-500'}`} />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4 ${className}`}>
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {kpi.value}
                  {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
                </span>
              </div>
            </div>
            {kpi.icon}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getTrendIcon(kpi.trend, kpi.change)}
              <span className={`text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            {kpi.target && (
              <span className="text-xs text-muted-foreground">
                Target: {kpi.target}{kpi.unit}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

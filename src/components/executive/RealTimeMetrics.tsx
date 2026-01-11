/**
 * Real-Time Metrics Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: Date;
}

export function RealTimeMetrics({ className = '' }: { className?: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: '1', name: 'System Load', value: 67, unit: '%', status: 'normal', lastUpdate: new Date() },
    { id: '2', name: 'Active Users', value: 1234, unit: '', status: 'normal', lastUpdate: new Date() },
    { id: '3', name: 'API Response Time', value: 145, unit: 'ms', status: 'normal', lastUpdate: new Date() },
    { id: '4', name: 'Database Connections', value: 42, unit: '', status: 'normal', lastUpdate: new Date() },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
        lastUpdate: new Date(),
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 animate-pulse text-green-500" />
        <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
        <Badge variant="secondary" className="text-xs">Live</Badge>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)} animate-pulse`} />
              <div>
                <p className="font-medium">{metric.name}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {metric.lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' ? metric.value.toFixed(0) : metric.value}
                <span className="text-sm ml-1">{metric.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

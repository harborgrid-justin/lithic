/**
 * Executive Dashboard Page - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { CommandCenter } from '@/components/executive/CommandCenter';
import { KPIGrid } from '@/components/executive/KPIGrid';
import { RealTimeMetrics } from '@/components/executive/RealTimeMetrics';
import { AlertStream } from '@/components/executive/AlertStream';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

export default function ExecutivePage() {
  const [alerts] = useState([
    {
      id: '1',
      severity: 'critical' as const,
      title: 'System Performance Alert',
      message: 'Database response time exceeding threshold',
      timestamp: new Date(),
      acknowledged: false,
      source: 'System Monitor',
    },
    {
      id: '2',
      severity: 'warning' as const,
      title: 'High Patient Volume',
      message: 'Emergency department at 95% capacity',
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
      source: 'Operations',
    },
  ]);

  const kpis = [
    {
      id: '1',
      name: 'Total Patients',
      value: '45,231',
      change: 12.5,
      trend: 'up' as const,
      unit: '',
      icon: <Users className="h-5 w-5 text-blue-500" />,
    },
    {
      id: '2',
      name: 'Revenue (MTD)',
      value: '$2.4M',
      change: 8.2,
      trend: 'up' as const,
      unit: '',
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
    },
    {
      id: '3',
      name: 'Patient Satisfaction',
      value: 94,
      change: 3.1,
      trend: 'up' as const,
      unit: '%',
      target: 95,
      icon: <Activity className="h-5 w-5 text-purple-500" />,
    },
    {
      id: '4',
      name: 'Appointments',
      value: '1,284',
      change: 15.3,
      trend: 'up' as const,
      unit: '',
      icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CommandCenter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <KPIGrid kpis={kpis} columns={2} />
        </div>

        <div className="space-y-6">
          <RealTimeMetrics />
          <AlertStream
            alerts={alerts}
            onAcknowledge={(id) => console.log('Acknowledged:', id)}
            onDismiss={(id) => console.log('Dismissed:', id)}
          />
        </div>
      </div>
    </div>
  );
}

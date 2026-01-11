/**
 * Executive Command Center - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export function CommandCenter({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Executive Command Center</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-green-500" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Patients</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mb-1">45,231</div>
          <p className="text-xs text-green-600">+12.5% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Revenue</span>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">$2.4M</div>
          <p className="text-xs text-green-600">+8.2% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Appointments</span>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold mb-1">1,284</div>
          <p className="text-xs text-green-600">+15.3% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Critical Alerts</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold mb-1">7</div>
          <p className="text-xs text-red-600">Requires immediate attention</p>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Overview</h3>
            <p className="text-muted-foreground">Comprehensive system metrics and performance indicators</p>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operational Metrics</h3>
            <p className="text-muted-foreground">Real-time operational data and insights</p>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
            <p className="text-muted-foreground">Revenue, costs, and financial projections</p>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Metrics</h3>
            <p className="text-muted-foreground">Patient outcomes and quality indicators</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

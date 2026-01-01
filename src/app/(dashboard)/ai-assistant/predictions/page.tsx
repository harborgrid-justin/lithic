/**
 * AI Predictions Dashboard
 *
 * Clinical prediction models dashboard with:
 * - Real-time risk predictions
 * - Model performance metrics
 * - Trend analysis
 * - Alert management
 *
 * @page /ai-assistant/predictions
 */

'use client';

import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PredictionCard, type PredictionData } from '@/components/ai/prediction-card';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
}

export default function PredictionsDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedModel, setSelectedModel] = useState('all');

  /**
   * Dashboard statistics
   */
  const stats: StatCard[] = [
    {
      title: 'Total Predictions',
      value: '2,847',
      change: '+12% vs last week',
      trend: 'up',
      icon: Activity,
    },
    {
      title: 'High Risk Alerts',
      value: '47',
      change: '-8% vs last week',
      trend: 'down',
      icon: AlertCircle,
    },
    {
      title: 'Model Accuracy',
      value: '94.2%',
      change: '+1.3% vs last week',
      trend: 'up',
      icon: TrendingUp,
    },
    {
      title: 'Avg Response Time',
      value: '124ms',
      change: '-15ms vs last week',
      trend: 'down',
      icon: Clock,
    },
  ];

  /**
   * Sample predictions
   */
  const predictions: PredictionData[] = [
    {
      title: '30-Day Readmission Risk',
      riskScore: 78,
      riskLevel: 'high',
      trend: 'increasing',
      topFactors: [
        { factor: 'Previous admissions (3 in last 6 months)', contribution: 0.35 },
        { factor: 'Comorbidity burden (5 conditions)', contribution: 0.28 },
        { factor: 'Polypharmacy (12 medications)', contribution: 0.22 },
      ],
      recommendations: [
        'Schedule follow-up within 7 days of discharge',
        'Arrange home health services',
        'Social work consultation for discharge planning',
      ],
      lastUpdated: new Date(),
    },
    {
      title: 'Sepsis Screening',
      riskScore: 42,
      riskLevel: 'moderate',
      trend: 'stable',
      topFactors: [
        { factor: 'Elevated heart rate (112 bpm)', contribution: 0.25 },
        { factor: 'Temperature 38.2°C', contribution: 0.20 },
        { factor: 'Suspected infection (pneumonia)', contribution: 0.18 },
      ],
      recommendations: [
        'Monitor vital signs every 2 hours',
        'Order blood cultures if not already done',
        'Reassess in 4 hours',
      ],
      lastUpdated: new Date(),
    },
    {
      title: 'Length of Stay Prediction',
      riskScore: 6.5,
      riskLevel: 'moderate',
      trend: 'stable',
      topFactors: [
        { factor: 'Planned cardiac procedure', contribution: 0.30 },
        { factor: 'Age 72 years', contribution: 0.15 },
        { factor: 'Multiple comorbidities', contribution: 0.12 },
      ],
      recommendations: [
        'Initiate early discharge planning',
        'Physical therapy evaluation',
        'Assess need for post-acute care',
      ],
      lastUpdated: new Date(),
    },
    {
      title: 'Appointment No-Show Risk',
      riskScore: 65,
      riskLevel: 'high',
      trend: 'decreasing',
      topFactors: [
        { factor: 'Previous no-shows (30% rate)', contribution: 0.32 },
        { factor: 'Long lead time (28 days)', contribution: 0.22 },
        { factor: 'No appointment confirmation', contribution: 0.18 },
      ],
      recommendations: [
        'Send appointment confirmation immediately',
        'Schedule 48-hour reminder call',
        'Offer telehealth alternative',
      ],
      lastUpdated: new Date(),
    },
  ];

  /**
   * Recent alerts
   */
  const recentAlerts = [
    {
      id: '1',
      severity: 'high' as const,
      message: 'High readmission risk detected for Patient MRN: ***1234',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      severity: 'medium' as const,
      message: 'Data drift detected in sepsis model - retraining recommended',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      severity: 'low' as const,
      message: 'Model performance metrics updated',
      timestamp: new Date(Date.now() - 10800000),
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clinical Predictions Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered risk predictions and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-sm">{stat.title}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div
                className={`text-sm flex items-center gap-1 ${
                  stat.trend === 'up'
                    ? 'text-green-600'
                    : stat.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                {stat.change}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="predictions">
                <Activity className="h-4 w-4 mr-1" />
                Active Predictions
              </TabsTrigger>
              <TabsTrigger value="performance">
                <BarChart3 className="h-4 w-4 mr-1" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <AlertCircle className="h-4 w-4 mr-1" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="mt-6">
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <PredictionCard
                    key={index}
                    prediction={prediction}
                    onViewDetails={() => {
                      console.log('View details:', prediction.title);
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Model Performance Metrics</h3>

                <div className="space-y-6">
                  {/* Readmission Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Readmission Risk Model</h4>
                      <Badge variant="secondary">v1.0.0</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold">94.2%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">AUC</p>
                        <p className="text-2xl font-bold">0.91</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Predictions</p>
                        <p className="text-2xl font-bold">1,247</p>
                      </div>
                    </div>
                  </div>

                  {/* Sepsis Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Sepsis Screening Model</h4>
                      <Badge variant="secondary">v1.0.0</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Sensitivity</p>
                        <p className="text-2xl font-bold">96.8%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Specificity</p>
                        <p className="text-2xl font-bold">89.3%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Predictions</p>
                        <p className="text-2xl font-bold">892</p>
                      </div>
                    </div>
                  </div>

                  {/* LOS Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Length of Stay Model</h4>
                      <Badge variant="secondary">v1.0.0</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">MAE</p>
                        <p className="text-2xl font-bold">0.8 days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">R²</p>
                        <p className="text-2xl font-bold">0.84</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Predictions</p>
                        <p className="text-2xl font-bold">456</p>
                      </div>
                    </div>
                  </div>

                  {/* No-Show Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">No-Show Prediction Model</h4>
                      <Badge variant="secondary">v1.0.0</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold">88.5%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precision</p>
                        <p className="text-2xl font-bold">0.83</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Predictions</p>
                        <p className="text-2xl font-bold">252</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <div className="space-y-3">
                {recentAlerts.map(alert => (
                  <Card key={alert.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          alert.severity === 'high'
                            ? 'bg-red-100 text-red-700'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              alert.severity === 'high'
                                ? 'destructive'
                                : alert.severity === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Model Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Model Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Readmission', status: 'active', health: 'excellent' },
                { name: 'Sepsis', status: 'active', health: 'good' },
                { name: 'Length of Stay', status: 'active', health: 'good' },
                { name: 'No-Show', status: 'active', health: 'fair' },
              ].map((model, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{model.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        model.health === 'excellent'
                          ? 'default'
                          : model.health === 'good'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {model.health}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Run Batch Predictions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Model Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

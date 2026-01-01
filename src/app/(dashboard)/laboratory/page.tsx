'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TestTube, 
  FileText, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  ClipboardList,
  Beaker,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function LaboratoryDashboard() {
  const stats = [
    { label: 'Pending Orders', value: '12', icon: Clock, color: 'text-yellow-600' },
    { label: 'In Progress', value: '8', icon: TestTube, color: 'text-blue-600' },
    { label: 'Completed Today', value: '45', icon: FileText, color: 'text-green-600' },
    { label: 'Critical Alerts', value: '2', icon: AlertTriangle, color: 'text-red-600' },
  ];

  const quickLinks = [
    { title: 'Laboratory Orders', href: '/laboratory/orders', icon: ClipboardList, description: 'View and manage lab orders' },
    { title: 'Results', href: '/laboratory/results', icon: FileText, description: 'View and enter lab results' },
    { title: 'Specimens', href: '/laboratory/specimens', icon: TestTube, description: 'Track specimen status' },
    { title: 'Test Panels', href: '/laboratory/panels', icon: Beaker, description: 'Manage test panels' },
    { title: 'Reference Ranges', href: '/laboratory/reference', icon: BookOpen, description: 'View reference ranges' },
    { title: 'Quality Control', href: '/laboratory/qc', icon: TrendingUp, description: 'QC records and monitoring' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Laboratory Information System</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive laboratory management and reporting
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <link.icon className="h-5 w-5 text-primary" />
                    {link.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '10 minutes ago', action: 'Critical result reported for John Doe - Potassium', type: 'alert' },
              { time: '25 minutes ago', action: 'Lab order ORD-2026001-045 completed', type: 'success' },
              { time: '1 hour ago', action: 'New specimen received - Accession #260101-0023', type: 'info' },
              { time: '2 hours ago', action: 'QC performed for Hematology Analyzer A1', type: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="mt-1">
                  {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {activity.type === 'success' && <FileText className="h-4 w-4 text-green-600" />}
                  {activity.type === 'info' && <TestTube className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

/**
 * Lithic Enterprise v0.3 - Enterprise Billing Dashboard
 * Comprehensive revenue cycle management dashboard
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueMetrics } from "@/components/billing/RevenueMetrics";
import { ARAgingChart } from "@/components/billing/ARAgingChart";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";

export default function EnterpriseBillingDashboard() {
  const [dateRange, setDateRange] = useState("month");

  // Mock data - in production, fetch from API
  const metrics = {
    netRevenue: 1250000,
    collectionRate: 87.5,
    daysInAR: 42,
    denialRate: 6.2,
    cleanClaimRate: 92.8,
  };

  const arAgingData = {
    current: { count: 245, amount: 450000 },
    days30: { count: 128, amount: 220000 },
    days60: { count: 87, amount: 150000 },
    days90: { count: 45, amount: 95000 },
    days120Plus: { count: 32, amount: 85000 },
    total: { count: 537, amount: 1000000 },
  };

  const payerMix = [
    { name: "Medicare", charges: 450000, payments: 380000, percentage: 35 },
    { name: "Blue Cross", charges: 380000, payments: 330000, percentage: 28 },
    { name: "Aetna", charges: 250000, payments: 215000, percentage: 18 },
    { name: "United Healthcare", charges: 180000, payments: 158000, percentage: 14 },
    { name: "Self-Pay", charges: 65000, payments: 42000, percentage: 5 },
  ];

  const denialTrends = [
    { category: "Authorization", count: 45, amount: 125000, preventable: true },
    { category: "Coding Error", count: 38, amount: 95000, preventable: true },
    { category: "Medical Necessity", count: 29, amount: 78000, preventable: false },
    { category: "Timely Filing", count: 22, amount: 65000, preventable: true },
    { category: "Eligibility", count: 18, amount: 42000, preventable: true },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "payment",
      description: "ERA processed - $45,230.50",
      time: "15 minutes ago",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "claim",
      description: "Batch of 23 claims submitted",
      time: "1 hour ago",
      icon: FileText,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "denial",
      description: "5 denials require attention",
      time: "2 hours ago",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      id: 4,
      type: "underpayment",
      description: "Underpayment detected - $2,500",
      time: "3 hours ago",
      icon: TrendingDown,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Enterprise Revenue Cycle Management
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive billing analytics and workflow management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            This Month
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <RevenueMetrics metrics={metrics} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ar-aging">A/R Aging</TabsTrigger>
          <TabsTrigger value="denials">Denials</TabsTrigger>
          <TabsTrigger value="payers">Payer Mix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <BarChart3 className="h-16 w-16" />
                  <span className="ml-4">Revenue trend chart would render here</span>
                </div>
              </CardContent>
            </Card>

            {/* Collection Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Performance</CardTitle>
                <CardDescription>Current month vs. target</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Gross Charges</span>
                    <span className="font-semibold">$1,850,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Contractual Adjustments</span>
                    <span className="font-semibold text-red-600">-$450,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other Adjustments</span>
                    <span className="font-semibold text-red-600">-$150,000</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Net Revenue</span>
                    <span className="text-green-600">$1,250,000</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="text-sm text-gray-600 mb-2">Collection Rate</div>
                  <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 flex items-center justify-end pr-2 text-white text-sm font-semibold"
                      style={{ width: "87.5%" }}
                    >
                      87.5%
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    Target: 95%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {activity.description}
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/billing/claims/new">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      New Claim
                    </Button>
                  </Link>
                  <Link href="/billing/workqueue">
                    <Button variant="outline" className="w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      Workqueue
                    </Button>
                  </Link>
                  <Link href="/billing/payments">
                    <Button variant="outline" className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Post Payment
                    </Button>
                  </Link>
                  <Link href="/billing/denials">
                    <Button variant="outline" className="w-full">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Denials
                    </Button>
                  </Link>
                  <Link href="/billing/contracts">
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Contracts
                    </Button>
                  </Link>
                  <Link href="/billing/reports">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ar-aging" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ARAgingChart data={arAgingData} />

            <Card>
              <CardHeader>
                <CardTitle>A/R Follow-Up Priorities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { account: "12345", patient: "John Doe", amount: 5420, days: 95 },
                    { account: "12346", patient: "Jane Smith", amount: 4280, days: 88 },
                    { account: "12347", patient: "Bob Johnson", amount: 3850, days: 76 },
                    { account: "12348", patient: "Alice Williams", amount: 3200, days: 125 },
                  ].map((item) => (
                    <div
                      key={item.account}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div>
                        <div className="font-medium">{item.patient}</div>
                        <div className="text-sm text-gray-500">
                          Account #{item.account}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.amount.toLocaleString()}</div>
                        <div className={`text-sm ${item.days > 90 ? "text-red-600" : "text-orange-600"}`}>
                          {item.days} days old
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="denials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Denial Analysis by Category</CardTitle>
              <CardDescription>
                Focus on preventable denials for maximum impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {denialTrends.map((denial) => (
                  <div key={denial.category} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{denial.category}</span>
                        {denial.preventable && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Preventable
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {denial.count} denials | ${denial.amount.toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payer Mix Analysis</CardTitle>
              <CardDescription>Revenue distribution by insurance payer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payerMix.map((payer) => (
                  <div key={payer.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{payer.name}</span>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${payer.payments.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Reimbursement: {((payer.payments / payer.charges) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 flex items-center justify-end pr-2 text-white text-xs font-semibold"
                        style={{ width: `${payer.percentage}%` }}
                      >
                        {payer.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

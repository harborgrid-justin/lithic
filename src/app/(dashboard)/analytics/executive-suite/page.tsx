"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/analytics/KPICard";
import { SparklineChart } from "@/components/analytics/SparklineChart";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import type { ExecutiveSummary, InitiativeStatus } from "@/types/analytics-enterprise";

export default function ExecutiveSuitePage() {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");

  // Mock data - replace with actual API calls
  const executiveSummary: ExecutiveSummary = {
    organization: "Healthcare System",
    reportDate: new Date(),
    reportPeriod: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    overallScore: 87,
    financialHealth: {
      totalRevenue: 45_000_000,
      revenueChange: 8.5,
      operatingMargin: 12.3,
      marginChange: 1.2,
      daysInAR: 28,
      collectionRate: 96.5,
      denialRate: 4.2,
      revenueByServiceLine: {
        "Cardiology": 12_000_000,
        "Orthopedics": 10_500_000,
        "Emergency": 8_200_000,
        "Surgery": 7_500_000,
        "Primary Care": 6_800_000,
      },
      topPayers: [
        { name: "Medicare", revenue: 15_000_000 },
        { name: "Blue Cross", revenue: 12_000_000 },
        { name: "UnitedHealth", revenue: 8_500_000 },
      ],
    },
    operationalHealth: {
      totalEncounters: 125_500,
      encounterChange: 5.2,
      bedOccupancy: 82,
      averageLOS: 4.2,
      edWaitTime: 18,
      appointmentNoShowRate: 5.8,
      providerProductivity: 22,
      staffingLevels: {
        "RN": 450,
        "MD": 180,
        "Support": 320,
      },
    },
    clinicalQuality: {
      overallScore: 91,
      readmissionRate: 8.2,
      mortalityRate: 1.8,
      infectionRate: 0.9,
      medicationErrorRate: 2.1,
      fallRate: 1.2,
      pressureUlcerRate: 0.4,
      qualityMeasures: [],
    },
    patientSatisfaction: {
      overallScore: 4.6,
      scoreChange: 0.2,
      responseRate: 68,
      npsScore: 72,
      categoryScores: {
        "Provider Communication": 4.8,
        "Facility Cleanliness": 4.5,
        "Wait Times": 4.2,
        "Staff Courtesy": 4.7,
      },
      topComplaints: [
        { category: "Wait Times", count: 245 },
        { category: "Parking", count: 189 },
      ],
      topCompliments: [
        { category: "Staff Kindness", count: 567 },
        { category: "Quality of Care", count: 432 },
      ],
    },
    strategicInitiatives: [
      {
        id: "1",
        name: "Digital Transformation",
        category: "Technology",
        status: "on_track",
        progress: 75,
        targetDate: new Date("2025-12-31"),
        owner: "CIO",
        milestones: [
          { name: "EHR Upgrade", completed: true, dueDate: new Date("2025-06-01") },
          { name: "Patient Portal v2", completed: true, dueDate: new Date("2025-09-01") },
          { name: "Analytics Platform", completed: false, dueDate: new Date("2025-12-01") },
        ],
      },
      {
        id: "2",
        name: "Population Health Program",
        category: "Clinical",
        status: "at_risk",
        progress: 45,
        targetDate: new Date("2025-10-31"),
        owner: "CMO",
        milestones: [
          { name: "Registry Setup", completed: true, dueDate: new Date("2025-04-01") },
          { name: "Care Manager Hiring", completed: false, dueDate: new Date("2025-07-01") },
          { name: "Program Launch", completed: false, dueDate: new Date("2025-10-01") },
        ],
      },
    ],
    alerts: [
      {
        id: "1",
        severity: "high",
        category: "Financial",
        title: "Days in A/R Increasing",
        description: "A/R days have increased from 25 to 28 over past month",
        metric: "days_in_ar",
        currentValue: 28,
        threshold: 25,
        trend: "increasing",
        timestamp: new Date(),
        acknowledged: false,
      },
      {
        id: "2",
        severity: "medium",
        category: "Operational",
        title: "ED Wait Times Above Target",
        description: "Average ED wait time is 18 minutes vs target of 15 minutes",
        metric: "ed_wait_time",
        currentValue: 18,
        threshold: 15,
        trend: "stable",
        timestamp: new Date(),
        acknowledged: false,
      },
    ],
  };

  const revenueData = [
    { month: "Jan", revenue: 42_000_000, expenses: 36_000_000 },
    { month: "Feb", revenue: 43_500_000, expenses: 37_000_000 },
    { month: "Mar", revenue: 45_000_000, expenses: 38_000_000 },
  ];

  const encounterTrendData = [
    { week: "Week 1", encounters: 29_500 },
    { week: "Week 2", encounters: 31_200 },
    { week: "Week 3", encounters: 30_800 },
    { week: "Week 4", encounters: 34_000 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Suite</h1>
          <p className="text-muted-foreground">
            C-Level Dashboard - {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLoading(true)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Overall Health Score
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{executiveSummary.overallScore}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+3.2%</span>
                </div>
              </div>
            </div>
            <div className="h-16 w-32">
              <SparklineChart
                data={[
                  { value: 82 },
                  { value: 84 },
                  { value: 85 },
                  { value: 83 },
                  { value: 87 },
                ]}
                trend="up"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(executiveSummary.financialHealth.totalRevenue / 1_000_000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{executiveSummary.financialHealth.revenueChange}%
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Encounters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveSummary.operationalHealth.totalEncounters.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{executiveSummary.operationalHealth.encounterChange}%
              </span>{" "}
              vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveSummary.clinicalQuality.overallScore}
            </div>
            <p className="text-xs text-muted-foreground">
              Exceeds national benchmark
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveSummary.alerts.filter((a) => !a.acknowledged).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {executiveSummary.alerts.filter((a) => a.severity === "high").length} high
              priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Quality</TabsTrigger>
          <TabsTrigger value="satisfaction">Patient Satisfaction</TabsTrigger>
          <TabsTrigger value="initiatives">Strategic Initiatives</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Operating Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.financialHealth.operatingMargin}%
                </div>
                <p className="text-sm text-green-600">
                  +{executiveSummary.financialHealth.marginChange}% vs last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.financialHealth.collectionRate}%
                </div>
                <p className="text-sm text-muted-foreground">Above target of 95%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Days in A/R</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.financialHealth.daysInAR}
                </div>
                <p className="text-sm text-yellow-600">Trending up - needs attention</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Service Line</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(executiveSummary.financialHealth.revenueByServiceLine).map(
                    ([name, value]) => ({ name, value })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bed Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executiveSummary.operationalHealth.bedOccupancy}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Average LOS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executiveSummary.operationalHealth.averageLOS} days
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ED Wait Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executiveSummary.operationalHealth.edWaitTime} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">No-Show Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executiveSummary.operationalHealth.appointmentNoShowRate}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Encounter Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={encounterTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="encounters"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Readmission Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.clinicalQuality.readmissionRate}%
                </div>
                <p className="text-sm text-green-600">Below national average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medication Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.clinicalQuality.medicationErrorRate}
                </div>
                <p className="text-sm text-muted-foreground">Per 1000 patient days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {executiveSummary.clinicalQuality.infectionRate}%
                </div>
                <p className="text-sm text-green-600">Excellent performance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overall Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {executiveSummary.patientSatisfaction.overallScore}
                </div>
                <p className="text-sm text-muted-foreground">Out of 5.0</p>
                <p className="text-sm text-green-600">
                  +{executiveSummary.patientSatisfaction.scoreChange} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NPS Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {executiveSummary.patientSatisfaction.npsScore}
                </div>
                <p className="text-sm text-muted-foreground">
                  {executiveSummary.patientSatisfaction.responseRate}% response rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Satisfaction by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(executiveSummary.patientSatisfaction.categoryScores).map(
                  ([category, score]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold">{score}/5.0</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          {executiveSummary.strategicInitiatives.map((initiative) => (
            <Card key={initiative.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{initiative.name}</CardTitle>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      initiative.status === "on_track"
                        ? "bg-green-100 text-green-700"
                        : initiative.status === "at_risk"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {initiative.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-bold">{initiative.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${initiative.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm">
                      <span className="font-medium">Owner:</span> {initiative.owner}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Target Date:</span>{" "}
                      {initiative.targetDate.toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Milestones</h4>
                    <div className="space-y-1">
                      {initiative.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div
                            className={`h-4 w-4 rounded-full ${
                              milestone.completed ? "bg-green-600" : "bg-gray-300"
                            }`}
                          />
                          <span className={milestone.completed ? "text-muted-foreground" : ""}>
                            {milestone.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {executiveSummary.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executiveSummary.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    alert.severity === "critical"
                      ? "border-red-300 bg-red-50"
                      : alert.severity === "high"
                        ? "border-orange-300 bg-orange-50"
                        : "border-yellow-300 bg-yellow-50"
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      alert.severity === "critical"
                        ? "text-red-600"
                        : alert.severity === "high"
                          ? "text-orange-600"
                          : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{alert.timestamp.toLocaleString()}</span>
                      <span>
                        Current: {alert.currentValue} | Threshold: {alert.threshold}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

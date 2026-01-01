"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function PopulationHealthDashboard() {
  const [metrics, setMetrics] = useState({
    totalPatients: 3247,
    activeRegistries: 12,
    totalCareGaps: 486,
    closedGapsThisMonth: 127,
    highRiskPatients: 234,
    averageRiskScore: 42.3,
    outreachCompleted: 412,
    outreachPending: 89,
    qualityMeasuresAboveTarget: 8,
    qualityMeasuresBelowTarget: 4,
  });

  const registrySummary = [
    {
      name: "Diabetes Type 2",
      patients: 847,
      highRisk: 94,
      gapsAvg: 2.3,
      performance: 87.2,
    },
    {
      name: "Hypertension",
      patients: 1203,
      highRisk: 142,
      gapsAvg: 1.8,
      performance: 91.5,
    },
    {
      name: "Heart Failure",
      patients: 234,
      highRisk: 67,
      gapsAvg: 3.1,
      performance: 78.9,
    },
    {
      name: "COPD",
      patients: 189,
      highRisk: 45,
      gapsAvg: 2.7,
      performance: 82.4,
    },
    {
      name: "CKD",
      patients: 312,
      highRisk: 78,
      gapsAvg: 2.9,
      performance: 85.1,
    },
  ];

  const gapTrends = [
    { month: "Jul", identified: 145, closed: 98 },
    { month: "Aug", identified: 167, closed: 112 },
    { month: "Sep", identified: 152, closed: 134 },
    { month: "Oct", identified: 189, closed: 141 },
    { month: "Nov", identified: 176, closed: 127 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Population Health Management
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor patient registries, care gaps, and quality measures across
          your population
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalPatients.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across {metrics.activeRegistries} registries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Care Gaps
            </CardTitle>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCareGaps}</div>
            <p className="text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {metrics.closedGapsThisMonth} closed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              High Risk Patients
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.highRiskPatients}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg risk score: {metrics.averageRiskScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quality Measures
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.qualityMeasuresAboveTarget}/
              {metrics.qualityMeasuresAboveTarget +
                metrics.qualityMeasuresBelowTarget}
            </div>
            <p className="text-xs text-green-600 mt-1">Above target</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="registries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registries">Patient Registries</TabsTrigger>
          <TabsTrigger value="gaps">Care Gaps</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="quality">Quality Measures</TabsTrigger>
        </TabsList>

        <TabsContent value="registries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registry Summary</CardTitle>
              <CardDescription>
                Patient counts and performance by registry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registrySummary.map((registry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {registry.name}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>{registry.patients} patients</span>
                        <span className="text-orange-600">
                          {registry.highRisk} high risk
                        </span>
                        <span>{registry.gapsAvg} avg gaps/patient</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${registry.performance >= 85 ? "text-green-600" : "text-orange-600"}`}
                      >
                        {registry.performance}%
                      </div>
                      <div className="text-xs text-gray-500">Performance</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Care Gap Trends</CardTitle>
              <CardDescription>
                Monthly gap identification and closure rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gapTrends.map((month, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium text-gray-600">
                      {month.month}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(month.identified / 200) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">
                          {month.identified}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(month.closed / 200) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-12 text-right">
                          {month.closed}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Identified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Closed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Outreach Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.outreachCompleted}
                </div>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outreach Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.outreachPending}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled or overdue
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Above Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.qualityMeasuresAboveTarget}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Quality measures meeting benchmarks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Below Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {metrics.qualityMeasuresBelowTarget}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Require improvement efforts
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

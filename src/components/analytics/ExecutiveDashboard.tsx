"use client";

import { useState, useEffect } from "react";
import { ChartWidget } from "./ChartWidget";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Clock,
} from "lucide-react";

interface ExecutiveDashboardProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  loading?: boolean;
}

export function ExecutiveDashboard({
  dateRange,
  loading = false,
}: ExecutiveDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    // Simulate API call - in production, fetch from actual API
    // Mock data for demonstration
    setDashboardData({
      revenueData: [
        { period: "Jan", revenue: 450000, target: 420000 },
        { period: "Feb", revenue: 480000, target: 450000 },
        { period: "Mar", revenue: 510000, target: 480000 },
        { period: "Apr", revenue: 495000, target: 500000 },
        { period: "May", revenue: 530000, target: 520000 },
        { period: "Jun", revenue: 560000, target: 540000 },
      ],
      patientVolumeData: [
        { period: "Jan", volume: 1850 },
        { period: "Feb", volume: 1920 },
        { period: "Mar", volume: 2050 },
        { period: "Apr", volume: 1980 },
        { period: "May", volume: 2130 },
        { period: "Jun", volume: 2250 },
      ],
      departmentPerformance: [
        { department: "Cardiology", revenue: 280000, patients: 450 },
        { department: "Orthopedics", revenue: 320000, patients: 380 },
        { department: "Emergency", revenue: 420000, patients: 850 },
        { department: "Primary Care", revenue: 180000, patients: 920 },
        { department: "Radiology", revenue: 250000, patients: 680 },
      ],
      qualityMetrics: [
        { metric: "Patient Satisfaction", score: 92 },
        { metric: "Clinical Quality", score: 88 },
        { metric: "Safety", score: 95 },
        { metric: "Efficiency", score: 85 },
        { metric: "Staff Engagement", score: 90 },
      ],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">$560K</div>
          <div className="text-blue-100 text-sm mt-1">Monthly Revenue</div>
          <div className="mt-3 text-sm">
            <span className="font-semibold">+8.5%</span> vs last month
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">2,250</div>
          <div className="text-green-100 text-sm mt-1">Patient Volume</div>
          <div className="mt-3 text-sm">
            <span className="font-semibold">+5.6%</span> vs last month
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">92%</div>
          <div className="text-purple-100 text-sm mt-1">Quality Score</div>
          <div className="mt-3 text-sm">
            <span className="font-semibold">+2.3%</span> vs last month
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">18min</div>
          <div className="text-orange-100 text-sm mt-1">Avg Wait Time</div>
          <div className="mt-3 text-sm">
            <span className="font-semibold">-12%</span> vs last month
          </div>
        </div>
      </div>

      {/* Revenue and Patient Volume Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          type="line"
          data={dashboardData.revenueData}
          config={{
            xAxis: "period",
            yAxis: ["revenue", "target"],
            colors: ["#3b82f6", "#94a3b8"],
            showLegend: true,
            showGrid: true,
            height: 300,
          }}
          title="Revenue Trend"
        />

        <ChartWidget
          type="area"
          data={dashboardData.patientVolumeData}
          config={{
            xAxis: "period",
            yAxis: "volume",
            colors: ["#10b981"],
            showLegend: false,
            showGrid: true,
            height: 300,
          }}
          title="Patient Volume Trend"
        />
      </div>

      {/* Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          type="bar"
          data={dashboardData.departmentPerformance}
          config={{
            xAxis: "department",
            yAxis: "revenue",
            colors: ["#8b5cf6"],
            showLegend: false,
            showGrid: true,
            height: 300,
          }}
          title="Department Revenue"
        />

        <ChartWidget
          type="radar"
          data={dashboardData.qualityMetrics}
          config={{
            xAxis: "metric",
            yAxis: "score",
            colors: ["#f59e0b"],
            showLegend: false,
            showGrid: false,
            height: 300,
          }}
          title="Quality Metrics Scorecard"
        />
      </div>

      {/* Department Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Department Performance Detail
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Revenue/Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.departmentPerformance.map(
                (dept: any, index: number) => {
                  const avgRevenue = dept.revenue / dept.patients;
                  const performance =
                    avgRevenue > 300
                      ? "excellent"
                      : avgRevenue > 250
                        ? "good"
                        : "fair";
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dept.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(dept.revenue / 1000).toFixed(0)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dept.patients.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${avgRevenue.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            performance === "excellent"
                              ? "bg-green-100 text-green-800"
                              : performance === "good"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {performance.charAt(0).toUpperCase() +
                            performance.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

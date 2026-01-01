"use client";

import { useMemo } from "react";
import { RevenueMetrics } from "@/types/billing";
import { formatCurrency } from "@/lib/utils";
import {
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

interface RevenueChartProps {
  metrics: RevenueMetrics[];
  chartType?: "bar" | "line" | "pie";
}

export default function RevenueChart({
  metrics,
  chartType = "bar",
}: RevenueChartProps) {
  const chartData = useMemo(() => {
    return metrics.map((metric) => ({
      period: metric.period,
      charges: metric.totalCharges,
      payments: metric.totalPayments,
      adjustments: metric.totalAdjustments,
      netRevenue: metric.netRevenue,
      collectionRate: metric.collectionRate,
      denialRate: metric.denialRate,
    }));
  }, [metrics]);

  const pieData = useMemo(() => {
    if (metrics.length === 0) return [];

    const latestMetric = metrics[metrics.length - 1];
    return [
      { name: "Payments", value: latestMetric.totalPayments, color: "#10b981" },
      {
        name: "Adjustments",
        value: latestMetric.totalAdjustments,
        color: "#f59e0b",
      },
      {
        name: "Outstanding",
        value:
          latestMetric.totalCharges -
          latestMetric.totalPayments -
          latestMetric.totalAdjustments,
        color: "#ef4444",
      },
    ];
  }, [metrics]);

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, metric) => ({
        charges: acc.charges + metric.totalCharges,
        payments: acc.payments + metric.totalPayments,
        adjustments: acc.adjustments + metric.totalAdjustments,
        netRevenue: acc.netRevenue + metric.netRevenue,
      }),
      { charges: 0, payments: 0, adjustments: 0, netRevenue: 0 },
    );
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Total Charges</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(totals.charges)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Total Payments</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(totals.payments)}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Total Adjustments</p>
          <p className="text-2xl font-bold text-orange-900">
            {formatCurrency(totals.adjustments)}
          </p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <p className="text-sm text-primary-700">Net Revenue</p>
          <p className="text-2xl font-bold text-primary-900">
            {formatCurrency(totals.netRevenue)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>

        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: "#374151" }}
              />
              <Legend />
              <Bar dataKey="charges" fill="#3b82f6" name="Charges" />
              <Bar dataKey="payments" fill="#10b981" name="Payments" />
              <Bar dataKey="adjustments" fill="#f59e0b" name="Adjustments" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: "#374151" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="charges"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Charges"
              />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#10b981"
                strokeWidth={2}
                name="Payments"
              />
              <Line
                type="monotone"
                dataKey="netRevenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Net Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-3 gap-6">
          {metrics.length > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-500 mb-2">Collection Rate</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {metrics[metrics.length - 1].collectionRate}%
                  </p>
                  <p className="text-sm text-gray-500 mb-1">current</p>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2"
                    style={{
                      width: `${metrics[metrics.length - 1].collectionRate}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Days in A/R</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics[metrics.length - 1].daysInAR}
                </p>
                <p className="text-sm text-gray-500 mt-1">days average</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Denial Rate</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {metrics[metrics.length - 1].denialRate}%
                  </p>
                  <p className="text-sm text-gray-500 mb-1">of claims</p>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 rounded-full h-2"
                    style={{
                      width: `${metrics[metrics.length - 1].denialRate}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

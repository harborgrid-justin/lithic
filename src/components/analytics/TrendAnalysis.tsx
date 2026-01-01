"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import {
  TimeSeriesData,
  FilterConfig,
  analyticsService,
} from "@/services/analytics.service";
import { ChartWidget } from "./ChartWidget";

interface TrendAnalysisProps {
  metric: string;
  metricName?: string;
  filters?: FilterConfig;
  granularity?: "hour" | "day" | "week" | "month" | "quarter" | "year";
  comparisonPeriods?: number;
  className?: string;
}

export function TrendAnalysis({
  metric,
  metricName,
  filters,
  granularity = "day",
  comparisonPeriods = 3,
  className = "",
}: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGranularity, setSelectedGranularity] = useState(granularity);

  useEffect(() => {
    loadTrendData();
  }, [metric, filters, selectedGranularity]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getTimeSeriesData(
        metric,
        filters,
        selectedGranularity,
      );
      setTrendData(data);
    } catch (error) {
      console.error("Failed to load trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrendMetrics = () => {
    if (trendData.length < 2) {
      return {
        currentValue: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: "stable" as const,
      };
    }

    const currentValue = trendData[trendData.length - 1]?.value || 0;
    const previousValue = trendData[trendData.length - 2]?.value || 0;
    const change = currentValue - previousValue;
    const changePercent =
      previousValue !== 0 ? (change / previousValue) * 100 : 0;
    const trend =
      Math.abs(changePercent) < 1
        ? "stable"
        : changePercent > 0
          ? "up"
          : "down";

    return {
      currentValue,
      previousValue,
      change,
      changePercent,
      trend,
    };
  };

  const calculateMovingAverage = (windowSize: number = 7): TimeSeriesData[] => {
    if (trendData.length < windowSize) return trendData;

    return trendData.map((item, index) => {
      if (index < windowSize - 1) {
        return { ...item, movingAverage: undefined };
      }

      const window = trendData.slice(index - windowSize + 1, index + 1);
      const average = window.reduce((sum, d) => sum + d.value, 0) / windowSize;

      return {
        ...item,
        movingAverage: average,
      };
    });
  };

  const chartData = calculateMovingAverage().map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: item.value,
    movingAverage: item.movingAverage,
  }));

  const metrics = calculateTrendMetrics();

  const granularityOptions = [
    { value: "hour", label: "Hourly" },
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
    { value: "quarter", label: "Quarterly" },
    { value: "year", label: "Yearly" },
  ];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}
      >
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {metricName || "Trend Analysis"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedGranularity}
              onChange={(e) =>
                setSelectedGranularity(e.target.value as typeof granularity)
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {granularityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4 border-b border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Current Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US").format(metrics.currentValue)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Previous Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Intl.NumberFormat("en-US").format(metrics.previousValue)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Change</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              metrics.change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {metrics.change >= 0 ? "+" : ""}
            {new Intl.NumberFormat("en-US").format(metrics.change)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Change %</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              metrics.changePercent >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {metrics.changePercent >= 0 ? "+" : ""}
            {metrics.changePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ChartWidget
          type="line"
          data={chartData}
          config={{
            xAxis: "date",
            yAxis: ["value", "movingAverage"],
            colors: ["#3b82f6", "#f59e0b"],
            showLegend: true,
            showGrid: true,
            height: 350,
          }}
        />
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Actual Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-gray-600">7-Day Moving Average</span>
          </div>
        </div>
      </div>

      {/* Statistical Insights */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Statistical Insights
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Average:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Intl.NumberFormat("en-US").format(
                trendData.reduce((sum, d) => sum + d.value, 0) /
                  trendData.length,
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Maximum:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Intl.NumberFormat("en-US").format(
                Math.max(...trendData.map((d) => d.value)),
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Minimum:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Intl.NumberFormat("en-US").format(
                Math.min(...trendData.map((d) => d.value)),
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

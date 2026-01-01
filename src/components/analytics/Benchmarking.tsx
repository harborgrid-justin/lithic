"use client";

import { useEffect, useState } from "react";
import { Target, TrendingUp, Award } from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { ChartWidget } from "./ChartWidget";

interface BenchmarkingProps {
  metric: string;
  metricName?: string;
  compareBy?: "national" | "regional" | "peer" | "historical";
  className?: string;
}

interface BenchmarkData {
  current: number;
  benchmark: number;
  percentile: number;
  comparison: {
    type: string;
    value: number;
    label: string;
  }[];
}

export function Benchmarking({
  metric,
  metricName,
  compareBy = "national",
  className = "",
}: BenchmarkingProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedCompareBy, setSelectedCompareBy] = useState(compareBy);

  useEffect(() => {
    loadBenchmarkData();
  }, [metric, selectedCompareBy]);

  const loadBenchmarkData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getBenchmarkData(
        metric,
        selectedCompareBy,
      );

      // Simulate comparison data (in real app, would come from API)
      setBenchmarkData({
        ...data,
        comparison: [
          { type: "Top 10%", value: data.benchmark * 1.2, label: "Excellence" },
          {
            type: "Top 25%",
            value: data.benchmark * 1.1,
            label: "Above Average",
          },
          { type: "Median", value: data.benchmark, label: "Average" },
          {
            type: "Bottom 25%",
            value: data.benchmark * 0.9,
            label: "Below Average",
          },
          { type: "Your Organization", value: data.current, label: "Current" },
        ],
      });
    } catch (error) {
      console.error("Failed to load benchmark data:", error);
      // Set mock data for demonstration
      setBenchmarkData({
        current: 85,
        benchmark: 80,
        percentile: 65,
        comparison: [
          { type: "Top 10%", value: 96, label: "Excellence" },
          { type: "Top 25%", value: 88, label: "Above Average" },
          { type: "Median", value: 80, label: "Average" },
          { type: "Bottom 25%", value: 72, label: "Below Average" },
          { type: "Your Organization", value: 85, label: "Current" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 90)
      return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (percentile >= 75)
      return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (percentile >= 50)
      return { label: "Average", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (percentile >= 25)
      return {
        label: "Below Average",
        color: "text-orange-600",
        bg: "bg-orange-50",
      };
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      bg: "bg-red-50",
    };
  };

  const compareByOptions = [
    { value: "national", label: "National" },
    { value: "regional", label: "Regional" },
    { value: "peer", label: "Peer Group" },
    { value: "historical", label: "Historical" },
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

  if (!benchmarkData) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}
      >
        <div className="text-center text-gray-500">
          No benchmark data available
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(benchmarkData.percentile);
  const difference = benchmarkData.current - benchmarkData.benchmark;
  const differencePercent = (difference / benchmarkData.benchmark) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {metricName || "Benchmark Comparison"}
            </h3>
          </div>
          <select
            value={selectedCompareBy}
            onChange={(e) =>
              setSelectedCompareBy(e.target.value as typeof compareBy)
            }
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {compareByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} Benchmark
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Your Performance</div>
            <div className="text-3xl font-bold text-gray-900">
              {benchmarkData.current.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Benchmark</div>
            <div className="text-3xl font-bold text-gray-900">
              {benchmarkData.benchmark.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Difference</div>
            <div
              className={`text-3xl font-bold ${
                difference >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {difference >= 0 ? "+" : ""}
              {difference.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Percentile</div>
            <div className={`text-3xl font-bold ${performance.color}`}>
              {benchmarkData.percentile}
              <span className="text-lg">th</span>
            </div>
          </div>
        </div>

        {/* Performance Badge */}
        <div className="mt-6 flex items-center justify-center">
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-full ${performance.bg}`}
          >
            <Award className={`w-5 h-5 ${performance.color}`} />
            <span className={`font-semibold ${performance.color}`}>
              {performance.label} Performance
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Comparison to{" "}
          {selectedCompareBy.charAt(0).toUpperCase() +
            selectedCompareBy.slice(1)}{" "}
          Benchmarks
        </h4>
        <ChartWidget
          type="bar"
          data={benchmarkData.comparison}
          config={{
            xAxis: "type",
            yAxis: "value",
            colors: benchmarkData.comparison.map((item) =>
              item.type === "Your Organization" ? "#3b82f6" : "#e5e7eb",
            ),
            showLegend: false,
            showGrid: true,
            height: 300,
          }}
        />
      </div>

      {/* Percentile Distribution */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Percentile Distribution
        </h4>
        <div className="relative">
          {/* Distribution bar */}
          <div className="h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg relative overflow-hidden">
            {/* Markers */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-white/30"></div>
              <div className="flex-1 border-r border-white/30"></div>
              <div className="flex-1 border-r border-white/30"></div>
              <div className="flex-1"></div>
            </div>
          </div>

          {/* Your position marker */}
          <div
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left: `${benchmarkData.percentile}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-12 bg-gray-900"></div>
              <div className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded whitespace-nowrap">
                You are here
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-14 text-xs text-gray-600">
            <span>0th</span>
            <span>25th</span>
            <span>50th</span>
            <span>75th</span>
            <span>100th</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="px-6 py-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Performance Insights
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            Your organization performs{" "}
            <span
              className={`font-semibold ${difference >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {Math.abs(differencePercent).toFixed(1)}%{" "}
              {difference >= 0 ? "above" : "below"}
            </span>{" "}
            the {selectedCompareBy} benchmark.
          </p>
          <p>
            You are in the{" "}
            <span className={`font-semibold ${performance.color}`}>
              {benchmarkData.percentile}th percentile
            </span>
            , performing better than {benchmarkData.percentile}% of comparable
            organizations.
          </p>
          {difference < 0 && (
            <p className="text-orange-600">
              To reach the benchmark, you need to improve by{" "}
              <span className="font-semibold">
                {Math.abs(difference).toFixed(1)} points
              </span>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

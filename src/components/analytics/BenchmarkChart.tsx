"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line,
  Scatter,
} from "recharts";
import { BenchmarkData } from "@/lib/analytics/benchmarking";

interface BenchmarkChartProps {
  benchmarks: BenchmarkData[];
  loading?: boolean;
  chartType?: "comparison" | "percentile" | "gap";
}

export function BenchmarkChart({
  benchmarks,
  loading = false,
  chartType = "comparison",
}: BenchmarkChartProps) {
  const chartData = useMemo(() => {
    return benchmarks.map((benchmark) => ({
      metric:
        benchmark.metricName.length > 20
          ? benchmark.metricName.substring(0, 20) + "..."
          : benchmark.metricName,
      fullMetric: benchmark.metricName,
      organizationValue: benchmark.organizationValue,
      industryMedian: benchmark.industryMedian,
      industryAverage: benchmark.industryAverage,
      p25: benchmark.percentiles.p25,
      p75: benchmark.percentiles.p75,
      p90: benchmark.percentiles.p90,
      gap: benchmark.gap,
      gapPercent: benchmark.gapPercent,
      percentile: benchmark.organizationPercentile,
      comparison: benchmark.comparison,
    }));
  }, [benchmarks]);

  const getBarColor = (comparison: string) => {
    switch (comparison) {
      case "above":
        return "#10b981"; // green
      case "below":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading benchmark charts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (benchmarks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-center text-gray-600">No benchmark data available</p>
      </div>
    );
  }

  const renderComparisonChart = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance vs Industry
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} />
          <YAxis
            type="category"
            dataKey="metric"
            stroke="#6b7280"
            fontSize={11}
            width={150}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            labelFormatter={(value) => {
              const item = chartData.find((d) => d.metric === value);
              return item?.fullMetric || value;
            }}
          />
          <Legend />

          <Bar
            dataKey="industryMedian"
            fill="#94a3b8"
            name="Industry Median"
            barSize={20}
          />
          <Bar
            dataKey="organizationValue"
            name="Your Organization"
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.comparison)}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600">Above Industry Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-gray-600">At Industry Median</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-600">Below Industry Median</span>
        </div>
      </div>
    </div>
  );

  const renderPercentileChart = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Percentile Rankings
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="metric"
            stroke="#6b7280"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={120}
          />
          <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            labelFormatter={(value) => {
              const item = chartData.find((d) => d.metric === value);
              return item?.fullMetric || value;
            }}
          />
          <ReferenceLine
            y={50}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label="50th Percentile"
          />
          <ReferenceLine
            y={75}
            stroke="#3b82f6"
            strokeDasharray="3 3"
            label="75th Percentile"
          />
          <Bar dataKey="percentile" name="Your Percentile Rank">
            {chartData.map((entry, index) => {
              let color = "#ef4444"; // red for below 50th
              if (entry.percentile >= 75)
                color = "#10b981"; // green for top quartile
              else if (entry.percentile >= 50) color = "#3b82f6"; // blue for above median

              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentile Guide */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="w-full h-2 bg-green-500 rounded mb-2"></div>
          <div className="text-gray-600">Top Quartile (75th+)</div>
        </div>
        <div>
          <div className="w-full h-2 bg-blue-500 rounded mb-2"></div>
          <div className="text-gray-600">Above Median (50-75th)</div>
        </div>
        <div>
          <div className="w-full h-2 bg-red-500 rounded mb-2"></div>
          <div className="text-gray-600">Below Median (&lt;50th)</div>
        </div>
      </div>
    </div>
  );

  const renderGapChart = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gap Analysis</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="metric"
            stroke="#6b7280"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={120}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            label={{ value: "Gap %", angle: -90 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
            labelFormatter={(value) => {
              const item = chartData.find((d) => d.metric === value);
              return item?.fullMetric || value;
            }}
            formatter={(value: any) => `${value.toFixed(1)}%`}
          />
          <ReferenceLine y={0} stroke="#6b7280" />
          <Bar dataKey="gapPercent" name="Gap from Industry Median (%)">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.gapPercent > 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600 text-center">
        Positive values indicate performance above industry median, negative
        values indicate gaps
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {chartType === "comparison" && renderComparisonChart()}
      {chartType === "percentile" && renderPercentileChart()}
      {chartType === "gap" && renderGapChart()}

      {/* All charts view */}
      {!chartType && (
        <>
          {renderComparisonChart()}
          {renderPercentileChart()}
          {renderGapChart()}
        </>
      )}

      {/* Detailed Percentile Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Industry Distribution
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="metric"
              stroke="#6b7280"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={120}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
              labelFormatter={(value) => {
                const item = chartData.find((d) => d.metric === value);
                return item?.fullMetric || value;
              }}
            />
            <Legend />

            {/* Industry percentile bands */}
            <Bar
              dataKey="p25"
              fill="#e5e7eb"
              name="25th Percentile"
              stackId="stack"
            />
            <Bar
              dataKey="industryMedian"
              fill="#cbd5e1"
              name="Median (50th)"
              stackId="stack"
            />
            <Bar
              dataKey="p75"
              fill="#94a3b8"
              name="75th Percentile"
              stackId="stack"
            />

            {/* Organization value as scatter */}
            <Scatter
              dataKey="organizationValue"
              fill="#3b82f6"
              name="Your Value"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 text-sm text-gray-600">
          The stacked bars show industry distribution. Blue dots indicate your
          organization&apos;s performance relative to industry benchmarks.
        </div>
      </div>
    </div>
  );
}

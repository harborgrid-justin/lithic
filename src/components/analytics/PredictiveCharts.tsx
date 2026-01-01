"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { ForecastResult, AnomalyResult } from "@/lib/analytics/predictions";

interface PredictiveChartsProps {
  metric: string;
  forecasts: ForecastResult[];
  anomalies: any[];
  loading?: boolean;
}

export function PredictiveCharts({
  metric,
  forecasts,
  anomalies,
  loading = false,
}: PredictiveChartsProps) {
  // Mock historical data for demonstration
  const historicalData = useMemo(() => {
    const data = [];
    const baseValue = 1000;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const randomVariation = (Math.random() - 0.5) * 100;
      const trend = i * 3;
      data.push({
        date: date.toISOString().split("T")[0],
        actual: baseValue + trend + randomVariation,
        type: "historical",
      });
    }
    return data;
  }, []);

  // Combine historical and forecast data
  const combinedData = useMemo(() => {
    const forecastData = forecasts.map((f) => ({
      date:
        typeof f.timestamp === "string"
          ? f.timestamp.split("T")[0]
          : f.timestamp.toISOString().split("T")[0],
      predicted: f.predicted,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
      type: "forecast",
    }));

    return [...historicalData, ...forecastData];
  }, [historicalData, forecasts]);

  // Prepare anomaly data for scatter plot
  const anomalyPoints = useMemo(() => {
    return anomalies
      .filter((a) => a.isAnomaly)
      .map((a) => ({
        date:
          typeof a.timestamp === "string"
            ? a.timestamp.split("T")[0]
            : a.timestamp.toISOString().split("T")[0],
        value: a.value,
        severity: a.severity,
      }));
  }, [anomalies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Chart with Confidence Intervals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Forecast with Confidence Intervals
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString();
              }}
            />
            <Legend />

            {/* Confidence interval */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
              name="Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
              name="Lower Bound"
            />

            {/* Actual values */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Actual"
            />

            {/* Predicted values */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              name="Forecast"
            />

            {/* Reference line to separate historical from forecast */}
            <ReferenceLine
              x={historicalData[historicalData.length - 1]?.date}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{ value: "Today", position: "top" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Detection Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Anomaly Detection
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />

            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6b7280"
              strokeWidth={2}
              dot={false}
              name="Value"
            />

            {/* Overlay anomaly points */}
            {anomalyPoints.map((point, index) => (
              <ReferenceLine
                key={index}
                x={point.date}
                stroke={
                  point.severity === "high"
                    ? "#ef4444"
                    : point.severity === "medium"
                      ? "#f59e0b"
                      : "#fbbf24"
                }
                strokeWidth={2}
                label={{
                  value: "!",
                  position: "top",
                  fill:
                    point.severity === "high"
                      ? "#ef4444"
                      : point.severity === "medium"
                        ? "#f59e0b"
                        : "#fbbf24",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Anomaly Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">
              High Severity (
              {anomalyPoints.filter((a) => a.severity === "high").length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">
              Medium Severity (
              {anomalyPoints.filter((a) => a.severity === "medium").length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">
              Low Severity (
              {anomalyPoints.filter((a) => a.severity === "low").length})
            </span>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historical Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Avg Growth</div>
              <div className="text-lg font-semibold text-gray-900">+6.5%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Volatility</div>
              <div className="text-lg font-semibold text-gray-900">12.3%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Trend</div>
              <div className="text-lg font-semibold text-green-600">Upward</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Forecast Accuracy
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mean Absolute Error (MAE)
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  24.5
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mean Absolute Percentage Error (MAPE)
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  2.8%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "92%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Root Mean Squared Error (RMSE)
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  31.2
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "88%" }}
                ></div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-900">
                Model Performance: Excellent
              </div>
              <div className="text-xs text-green-700 mt-1">
                High accuracy with low error rates across all metrics
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

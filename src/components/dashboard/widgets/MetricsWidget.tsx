"use client";

/**
 * MetricsWidget - Key Performance Indicators with Sparklines
 * Displays critical healthcare metrics with trend visualization
 */

import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MetricData {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  sparklineData: number[];
  icon: "activity" | "users" | "calendar" | "revenue";
  format?: "number" | "currency" | "percentage";
}

interface MetricsWidgetProps {
  className?: string;
}

// ============================================================================
// Mock Data (In production, this would come from API)
// ============================================================================

const mockMetrics: MetricData[] = [
  {
    label: "Active Patients",
    value: 1247,
    change: 12.5,
    trend: "up",
    sparklineData: [850, 920, 1050, 1100, 1180, 1210, 1247],
    icon: "users",
    format: "number",
  },
  {
    label: "Appointments Today",
    value: 42,
    change: -5.2,
    trend: "down",
    sparklineData: [45, 48, 44, 50, 47, 45, 42],
    icon: "calendar",
    format: "number",
  },
  {
    label: "Patient Satisfaction",
    value: "94.2%",
    change: 2.1,
    trend: "up",
    sparklineData: [89, 90, 91, 92, 93, 93.5, 94.2],
    icon: "activity",
    format: "percentage",
  },
  {
    label: "Revenue MTD",
    value: "$127,450",
    change: 18.7,
    trend: "up",
    sparklineData: [85000, 95000, 102000, 110000, 118000, 123000, 127450],
    icon: "revenue",
    format: "currency",
  },
];

// ============================================================================
// Component
// ============================================================================

export function MetricsWidget({ className }: MetricsWidgetProps) {
  const getIcon = (iconType: MetricData["icon"]) => {
    const iconClass = "w-5 h-5";
    switch (iconType) {
      case "users":
        return <Users className={iconClass} />;
      case "calendar":
        return <Calendar className={iconClass} />;
      case "revenue":
        return <DollarSign className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getTrendIcon = (trend: MetricData["trend"]) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getTrendColor = (trend: MetricData["trend"], change: number) => {
    if (trend === "neutral") return "text-gray-600";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  const formatValue = (value: string | number): string => {
    if (typeof value === "string") return value;
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {mockMetrics.map((metric, index) => (
        <Card
          key={index}
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-gray-200"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                {getIcon(metric.icon)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatValue(metric.value)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  getTrendColor(metric.trend, metric.change),
                )}
              >
                {getTrendIcon(metric.trend)}
                <span>
                  {metric.change > 0 ? "+" : ""}
                  {metric.change.toFixed(1)}%
                </span>
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>

            <div className="w-24 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metric.sparklineData.map((value) => ({ value }))}
                >
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      metric.trend === "up"
                        ? "#10b981"
                        : metric.trend === "down"
                          ? "#ef4444"
                          : "#6b7280"
                    }
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

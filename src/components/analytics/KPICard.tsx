"use client";

import { MetricData } from "@/services/analytics.service";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  metric: MetricData;
  className?: string;
  onClick?: () => void;
}

export function KPICard({ metric, className = "", onClick }: KPICardProps) {
  const formatValue = (
    value: number,
    format?: string,
    unit?: string,
  ): string => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "duration":
        return `${Math.round(value)} ${unit || "min"}`;
      default:
        return (
          new Intl.NumberFormat("en-US").format(value) +
          (unit ? ` ${unit}` : "")
        );
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    // For quality/performance metrics, up is good
    // For cost/time metrics, down might be good
    // This is simplified; in production, this would be configurable per metric
    switch (metric.trend) {
      case "up":
        return "text-green-600 bg-green-50";
      case "down":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const clickableClass = onClick
    ? "cursor-pointer hover:shadow-lg transition-shadow"
    : "";

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${clickableClass} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {metric.name}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {formatValue(metric.value, metric.format, metric.unit)}
          </p>
        </div>
        {metric.trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor()}`}
          >
            {getTrendIcon()}
            {metric.changePercent !== undefined && (
              <span className="text-sm font-medium">
                {Math.abs(metric.changePercent).toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {metric.previousValue !== undefined && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Previous:</span>
          <span className="font-medium text-gray-700">
            {formatValue(metric.previousValue, metric.format, metric.unit)}
          </span>
          {metric.change !== undefined && (
            <span
              className={metric.change >= 0 ? "text-green-600" : "text-red-600"}
            >
              ({metric.change >= 0 ? "+" : ""}
              {formatValue(Math.abs(metric.change), metric.format, metric.unit)}
              )
            </span>
          )}
        </div>
      )}
    </div>
  );
}

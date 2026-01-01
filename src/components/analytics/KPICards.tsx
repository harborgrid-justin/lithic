"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import {
  KPIValue,
  formatKPIValue,
  HEALTHCARE_KPIS,
} from "@/lib/analytics/kpi-engine";

interface KPICardsProps {
  kpis: KPIValue[];
  loading?: boolean;
  onKPIClick?: (kpiId: string) => void;
}

export function KPICards({ kpis, loading = false, onKPIClick }: KPICardsProps) {
  // Group KPIs by category
  const groupedKPIs = useMemo(() => {
    const groups: Record<string, KPIValue[]> = {};

    kpis.forEach((kpi) => {
      const definition = HEALTHCARE_KPIS[kpi.kpiId];
      if (!definition) return;

      const category = definition.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(kpi);
    });

    return groups;
  }, [kpis]);

  const getTrendIcon = (trend: KPIValue["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: KPIValue["trend"], higherIsBetter: boolean) => {
    if (trend === "stable") {
      return "text-gray-600 bg-gray-50";
    }

    const isPositive =
      (trend === "up" && higherIsBetter) ||
      (trend === "down" && !higherIsBetter);
    return isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  };

  const getPerformanceColor = (level: KPIValue["performanceLevel"]) => {
    switch (level) {
      case "excellent":
        return "border-green-500 bg-green-50";
      case "good":
        return "border-blue-500 bg-blue-50";
      case "warning":
        return "border-yellow-500 bg-yellow-50";
      case "critical":
        return "border-red-500 bg-red-50";
      default:
        return "border-gray-300 bg-white";
    }
  };

  const getPerformanceBadgeColor = (level: KPIValue["performanceLevel"]) => {
    switch (level) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No KPI data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedKPIs).map(([category, categoryKPIs]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
            {category.replace("-", " ")} Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryKPIs.map((kpi) => {
              const definition = HEALTHCARE_KPIS[kpi.kpiId];
              if (!definition) return null;

              const clickableClass = onKPIClick
                ? "cursor-pointer hover:shadow-lg transition-shadow"
                : "";

              return (
                <div
                  key={kpi.kpiId}
                  className={`rounded-lg border-2 p-6 ${getPerformanceColor(
                    kpi.performanceLevel,
                  )} ${clickableClass}`}
                  onClick={() => onKPIClick?.(kpi.kpiId)}
                  role={onKPIClick ? "button" : undefined}
                  tabIndex={onKPIClick ? 0 : undefined}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {definition.name}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPerformanceBadgeColor(
                          kpi.performanceLevel,
                        )}`}
                      >
                        {kpi.performanceLevel.charAt(0).toUpperCase() +
                          kpi.performanceLevel.slice(1)}
                      </span>
                    </div>
                    {kpi.trend && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor(
                          kpi.trend,
                          definition.higherIsBetter,
                        )}`}
                      >
                        {getTrendIcon(kpi.trend)}
                      </div>
                    )}
                  </div>

                  {/* Current Value */}
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatKPIValue(kpi.value, definition)}
                    </div>
                  </div>

                  {/* Target and Previous Comparison */}
                  <div className="space-y-2">
                    {kpi.target !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium text-gray-900">
                          {formatKPIValue(kpi.target, definition)}
                        </span>
                      </div>
                    )}

                    {kpi.previousValue !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Previous:</span>
                        <span className="font-medium text-gray-900">
                          {formatKPIValue(kpi.previousValue, definition)}
                        </span>
                      </div>
                    )}

                    {kpi.previousValue !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Change:</span>
                        <span
                          className={
                            kpi.value > kpi.previousValue
                              ? definition.higherIsBetter
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                              : kpi.value < kpi.previousValue
                                ? definition.higherIsBetter
                                  ? "text-red-600 font-medium"
                                  : "text-green-600 font-medium"
                                : "text-gray-600 font-medium"
                          }
                        >
                          {kpi.value > kpi.previousValue ? "+" : ""}
                          {formatKPIValue(
                            kpi.value - kpi.previousValue,
                            definition,
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Target */}
                  {kpi.target !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress to Target</span>
                        <span>
                          {definition.higherIsBetter
                            ? Math.min(
                                100,
                                (kpi.value / kpi.target) * 100,
                              ).toFixed(0)
                            : Math.min(
                                100,
                                (kpi.target / kpi.value) * 100,
                              ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            kpi.performanceLevel === "excellent"
                              ? "bg-green-500"
                              : kpi.performanceLevel === "good"
                                ? "bg-blue-500"
                                : kpi.performanceLevel === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              definition.higherIsBetter
                                ? (kpi.value / kpi.target) * 100
                                : (kpi.target / kpi.value) * 100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

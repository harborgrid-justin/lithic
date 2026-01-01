"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  FilterConfig,
  MetricData,
  analyticsService,
} from "@/services/analytics.service";
import { KPICard } from "@/components/analytics/KPICard";
import { ChartWidget } from "@/components/analytics/ChartWidget";
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis";
import { FilterPanel } from "@/components/analytics/FilterPanel";

export default function PopulationHealthPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
      preset: "year",
    },
  });

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getPopulationMetrics(filters);
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load population metrics:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Mock data for risk stratification
  const riskStratificationData = [
    { name: "Low Risk", value: 45000, percentage: 75 },
    { name: "Medium Risk", value: 12000, percentage: 20 },
    { name: "High Risk", value: 3000, percentage: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Population Health
              </h1>
              <p className="text-gray-500 mt-1">
                Care management, preventive care, and population insights
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableFilters={{
                locations: ["Main Campus", "North Clinic", "South Clinic"],
                providers: ["Dr. Smith", "Dr. Johnson", "Dr. Williams"],
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Population Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric) => (
                      <KPICard key={metric.id} metric={metric} />
                    ))}
                  </div>
                </div>

                {/* Risk Stratification */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Risk Stratification
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <ChartWidget
                      type="pie"
                      data={riskStratificationData}
                      config={{
                        xAxis: "name",
                        yAxis: "value",
                        colors: ["#10b981", "#f59e0b", "#ef4444"],
                        showLegend: true,
                        height: 300,
                      }}
                    />
                    <div className="space-y-4">
                      {riskStratificationData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{
                                backgroundColor:
                                  index === 0
                                    ? "#10b981"
                                    : index === 1
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.percentage}% of population
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat("en-US").format(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Care Gap Closure Trend */}
                <TrendAnalysis
                  metric="care_gap_closure_rate"
                  metricName="Care Gap Closure Rate"
                  filters={filters}
                  granularity="month"
                />

                {/* Preventive Care Compliance */}
                <TrendAnalysis
                  metric="preventive_care_compliance"
                  metricName="Preventive Care Compliance"
                  filters={filters}
                  granularity="month"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Building2,
  Download,
} from "lucide-react";
import {
  MetricData,
  FilterConfig,
  analyticsService,
} from "@/services/analytics.service";
import { KPICard } from "@/components/analytics/KPICard";
import { FilterPanel } from "@/components/analytics/FilterPanel";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [qualityMetrics, setQualityMetrics] = useState<MetricData[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<MetricData[]>([]);
  const [operationalMetrics, setOperationalMetrics] = useState<MetricData[]>(
    [],
  );
  const [populationMetrics, setPopulationMetrics] = useState<MetricData[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
      preset: "month",
    },
  });

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [quality, financial, operational, population] = await Promise.all([
        analyticsService
          .getQualityMetrics(filters)
          .then((data) => data.slice(0, 3)),
        analyticsService
          .getFinancialMetrics(filters)
          .then((data) => data.slice(0, 3)),
        analyticsService
          .getOperationalMetrics(filters)
          .then((data) => data.slice(0, 3)),
        analyticsService
          .getPopulationMetrics(filters)
          .then((data) => data.slice(0, 3)),
      ]);

      setQualityMetrics(quality);
      setFinancialMetrics(financial);
      setOperationalMetrics(operational);
      setPopulationMetrics(population);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: "quality",
      name: "Quality Metrics",
      description: "Patient outcomes and CMS measures",
      icon: <Activity className="w-6 h-6" />,
      color: "bg-blue-500",
      href: "/analytics/quality",
      metrics: qualityMetrics,
    },
    {
      id: "financial",
      name: "Financial Performance",
      description: "Revenue, AR, and collections",
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-500",
      href: "/analytics/financial",
      metrics: financialMetrics,
    },
    {
      id: "operational",
      name: "Operational Efficiency",
      description: "Volume, utilization, and throughput",
      icon: <Building2 className="w-6 h-6" />,
      color: "bg-purple-500",
      href: "/analytics/operational",
      metrics: operationalMetrics,
    },
    {
      id: "population",
      name: "Population Health",
      description: "Care management and prevention",
      icon: <Users className="w-6 h-6" />,
      color: "bg-orange-500",
      href: "/analytics/population",
      metrics: populationMetrics,
    },
  ];

  const quickActions = [
    {
      name: "Custom Dashboards",
      description: "Create and manage custom analytics dashboards",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/analytics/dashboards",
      color: "bg-blue-50 text-blue-600",
    },
    {
      name: "Report Builder",
      description: "Build and schedule custom reports",
      icon: <FileText className="w-6 h-6" />,
      href: "/analytics/reports/builder",
      color: "bg-green-50 text-green-600",
    },
    {
      name: "Exports",
      description: "Export data to PDF, Excel, or CSV",
      icon: <Download className="w-6 h-6" />,
      href: "/analytics/exports",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics & Reporting
              </h1>
              <p className="text-gray-500 mt-1">
                Comprehensive analytics across quality, financial, operational,
                and population health
              </p>
            </div>
            <Link
              href="/analytics/dashboards"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Dashboards
            </Link>
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
                departments: [
                  "Cardiology",
                  "Oncology",
                  "Emergency",
                  "Surgery",
                  "ICU",
                ],
                locations: ["Main Campus", "North Clinic", "South Clinic"],
              }}
              collapsible
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color}`}
                  >
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>

            {/* Metric Categories */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${category.color} text-white flex items-center justify-center`}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={category.href}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        View All
                        <TrendingUp className="w-4 h-4" />
                      </Link>
                    </div>

                    {category.metrics.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {category.metrics.map((metric) => (
                          <KPICard key={metric.id} metric={metric} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No metrics available
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

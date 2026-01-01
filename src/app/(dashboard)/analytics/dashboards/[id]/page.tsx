"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layout, ArrowLeft, Edit, Share2, Download } from "lucide-react";
import {
  Dashboard,
  Widget,
  analyticsService,
} from "@/services/analytics.service";
import { DashboardGrid } from "@/components/analytics/DashboardGrid";
import { KPICard } from "@/components/analytics/KPICard";
import { ChartWidget } from "@/components/analytics/ChartWidget";
import { DataTable } from "@/components/analytics/DataTable";
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis";

export default function DashboardDetailPage() {
  const params = useParams();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadDashboard();
  }, [params.id]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getDashboard(params.id as string);
      setDashboard(data);

      // Load data for each widget
      const dataPromises = data.widgets.map(async (widget) => {
        const widgetDataResult = await analyticsService.getWidgetData(
          widget,
          data.filters,
        );
        return { [widget.id]: widgetDataResult };
      });

      const results = await Promise.all(dataPromises);
      const combinedData = results.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {},
      );
      setWidgetData(combinedData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    const data = widgetData[widget.id];

    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (widget.type) {
      case "kpi":
        return <KPICard metric={data} />;

      case "chart":
        return (
          <ChartWidget
            type={widget.config.chartType || "line"}
            data={data}
            config={{
              xAxis: widget.config.dimensions?.[0] || "name",
              yAxis: widget.config.metrics,
              colors: widget.config.colors,
              stacked: widget.config.stacked,
              showLegend: widget.config.showLegend,
              showGrid: widget.config.showGrid,
            }}
          />
        );

      case "table":
        return (
          <DataTable
            data={data}
            columns={
              widget.config.metrics?.map((metric) => ({
                key: metric,
                label: metric
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
                sortable: true,
              })) || []
            }
            searchable
            exportable
          />
        );

      case "trend":
        return (
          <TrendAnalysis
            metric={widget.config.metrics?.[0] || "value"}
            metricName={widget.title}
            filters={dashboard?.filters}
          />
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Widget type not supported: {widget.type}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dashboard not found
          </h2>
          <p className="text-gray-500 mb-6">
            The dashboard you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/analytics/dashboards"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/analytics/dashboards"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboards
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {dashboard.name}
                  </h1>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm font-medium capitalize">
                    {dashboard.type}
                  </span>
                  {dashboard.shared && (
                    <Share2 className="w-5 h-5 text-gray-400" title="Shared" />
                  )}
                </div>
                {dashboard.description && (
                  <p className="text-gray-500 mt-1">{dashboard.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Export functionality coming soon")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <Link
                href={`/analytics/dashboards/${dashboard.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {dashboard.widgets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Layout className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No widgets added
            </h3>
            <p className="text-gray-500 mb-6">
              Add widgets to this dashboard to start visualizing your data
            </p>
            <Link
              href={`/analytics/dashboards/${dashboard.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Dashboard
            </Link>
          </div>
        ) : (
          <DashboardGrid
            widgets={dashboard.widgets}
            layout={dashboard.layout}
            editable={false}
            renderWidget={renderWidget}
          />
        )}
      </div>
    </div>
  );
}

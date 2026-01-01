"use client";

import { useState, useEffect, useCallback } from "react";
import { ExecutiveDashboard } from "@/components/analytics/ExecutiveDashboard";
import { KPICards } from "@/components/analytics/KPICards";
import { ExportDialog } from "@/components/analytics/ExportDialog";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Calendar } from "lucide-react";
import { KPIValue } from "@/lib/analytics/kpi-engine";

export default function ExecutivePage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIValue[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  const loadExecutiveData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/executive?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load executive data");
      }

      const data = await response.json();
      setKpis(data.kpis || []);
    } catch (error) {
      console.error("Error loading executive data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadExecutiveData();
  }, [loadExecutiveData]);

  const handleRefresh = () => {
    loadExecutiveData();
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Executive Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Strategic insights and key performance indicators for C-suite
              decision making
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Summary */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {dateRange.start.toLocaleDateString()} -{" "}
            {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Key Performance Indicators
        </h2>
        <KPICards kpis={kpis} loading={loading} />
      </div>

      {/* Executive Dashboard */}
      <ExecutiveDashboard dateRange={dateRange} loading={loading} />

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          defaultDateRange={dateRange}
          reportType="executive"
        />
      )}

      {/* Strategic Insights */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Strategic Insights
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
            <div>
              <h3 className="font-medium text-gray-900">Revenue Performance</h3>
              <p className="text-gray-600 text-sm mt-1">
                Overall revenue trending upward with strong growth in outpatient
                services. Consider expanding capacity in high-performing
                departments.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
            <div>
              <h3 className="font-medium text-gray-900">
                Operational Efficiency
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Patient wait times have improved by 15% this quarter. Continue
                focus on process optimization and staff training.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
            <div>
              <h3 className="font-medium text-gray-900">Quality Metrics</h3>
              <p className="text-gray-600 text-sm mt-1">
                Patient satisfaction scores remain strong. Readmission rates
                require attention in cardiology and orthopedics departments.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
            <div>
              <h3 className="font-medium text-gray-900">Financial Health</h3>
              <p className="text-gray-600 text-sm mt-1">
                Days in A/R trending slightly above target. Recommend enhanced
                focus on claims processing and denial management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="text-blue-600 text-sm font-medium mb-2">
            Overall Health
          </div>
          <div className="text-3xl font-bold text-blue-900">Good</div>
          <div className="text-blue-700 text-sm mt-2">
            85% of KPIs meeting targets
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="text-green-600 text-sm font-medium mb-2">
            Top Performers
          </div>
          <div className="text-3xl font-bold text-green-900">8</div>
          <div className="text-green-700 text-sm mt-2">
            KPIs exceeding targets
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="text-orange-600 text-sm font-medium mb-2">
            Needs Attention
          </div>
          <div className="text-3xl font-bold text-orange-900">3</div>
          <div className="text-orange-700 text-sm mt-2">
            KPIs below threshold
          </div>
        </div>
      </div>
    </div>
  );
}

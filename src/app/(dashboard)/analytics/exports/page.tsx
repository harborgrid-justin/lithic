"use client";

import { useState } from "react";
import {
  Download,
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { ExportOptions } from "@/components/analytics/ExportOptions";
import {
  reportingService,
  ExportOptions as ExportOptionsType,
} from "@/services/reporting.service";
import { AnalyticsQuery } from "@/services/analytics.service";

interface ExportHistory {
  id: string;
  name: string;
  format: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  fileUrl?: string;
  fileSize?: number;
}

export default function ExportsPage() {
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    {
      id: "1",
      name: "Quality Metrics Report",
      format: "pdf",
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      fileUrl: "/exports/quality-report.pdf",
      fileSize: 1024 * 512,
    },
    {
      id: "2",
      name: "Financial Dashboard Export",
      format: "excel",
      status: "completed",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      fileUrl: "/exports/financial-dashboard.xlsx",
      fileSize: 1024 * 256,
    },
    {
      id: "3",
      name: "Operational Data",
      format: "csv",
      status: "completed",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fileUrl: "/exports/operational-data.csv",
      fileSize: 1024 * 128,
    },
  ]);

  const handleExport = async (options: ExportOptionsType) => {
    setExporting(true);

    try {
      // Create a sample query
      const query: AnalyticsQuery = {
        metrics: ["patient_volume", "readmission_rate", "patient_satisfaction"],
        dimensions: ["date", "department"],
        filters: {
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0] || "",
            end: new Date().toISOString().split("T")[0] || "",
            preset: "month",
          },
        },
      };

      const result = await reportingService.exportData(query, options);

      // Add to export history
      const newExport: ExportHistory = {
        id: result.executionId,
        name: `Analytics Export - ${new Date().toLocaleString()}`,
        format: options.format,
        status: "completed",
        createdAt: new Date().toISOString(),
        fileUrl: result.fileUrl,
        fileSize: 1024 * 512,
      };

      setExportHistory([newExport, ...exportHistory]);

      // Simulate download
      if (result.fileUrl) {
        alert(
          `Export completed! File would be downloaded from: ${result.fileUrl}`,
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: ExportHistory["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case "failed":
        return <FileText className="w-5 h-5 text-red-600" />;
    }
  };

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
            <div className="w-12 h-12 rounded-lg bg-purple-500 text-white flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Exports</h1>
              <p className="text-gray-500 mt-1">
                Export analytics data to PDF, Excel, or CSV formats
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Configuration */}
          <div className="lg:col-span-1">
            <ExportOptions onExport={handleExport} loading={exporting} />
          </div>

          {/* Export History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Export History
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {exportHistory.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <Download className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No exports yet</p>
                    <p className="text-sm mt-1">
                      Create your first export using the options on the left
                    </p>
                  </div>
                ) : (
                  exportHistory.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(exportItem.status)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {exportItem.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="uppercase">
                                {exportItem.format}
                              </span>
                              {exportItem.fileSize && (
                                <span>
                                  {formatFileSize(exportItem.fileSize)}
                                </span>
                              )}
                              <span>
                                {new Date(
                                  exportItem.createdAt,
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {exportItem.status === "completed" &&
                          exportItem.fileUrl && (
                            <button
                              onClick={() =>
                                alert(`Downloading: ${exportItem.fileUrl}`)
                              }
                              className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Export Templates */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Export Templates
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    handleExport({
                      format: "pdf",
                      includeCharts: true,
                      includeSummary: true,
                      includeRawData: false,
                    })
                  }
                  disabled={exporting}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900">
                    Executive Summary
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PDF with charts
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleExport({
                      format: "excel",
                      includeCharts: true,
                      includeSummary: true,
                      includeRawData: true,
                    })
                  }
                  disabled={exporting}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <FileText className="w-6 h-6 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900">
                    Detailed Report
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Excel with data
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleExport({
                      format: "csv",
                      includeCharts: false,
                      includeSummary: false,
                      includeRawData: true,
                    })
                  }
                  disabled={exporting}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <FileText className="w-6 h-6 text-purple-600 mb-2" />
                  <div className="font-medium text-gray-900">Raw Data</div>
                  <div className="text-xs text-gray-500 mt-1">CSV only</div>
                </button>

                <button
                  onClick={() =>
                    handleExport({
                      format: "pdf",
                      orientation: "landscape",
                      includeCharts: true,
                      includeSummary: true,
                      includeRawData: true,
                    })
                  }
                  disabled={exporting}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <FileText className="w-6 h-6 text-orange-600 mb-2" />
                  <div className="font-medium text-gray-900">Full Report</div>
                  <div className="text-xs text-gray-500 mt-1">
                    PDF landscape
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

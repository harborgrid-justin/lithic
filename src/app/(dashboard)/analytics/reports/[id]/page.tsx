"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, Edit, Play, Calendar } from "lucide-react";
import {
  Report,
  ReportExecution,
  reportingService,
} from "@/services/reporting.service";
import { DataTable } from "@/components/analytics/DataTable";

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [params.id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [reportData, executionHistory] = await Promise.all([
        reportingService.getReport(params.id as string),
        reportingService.getReportExecutions(params.id as string),
      ]);
      setReport(reportData);
      setExecutions(executionHistory);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!report) return;

    try {
      const execution = await reportingService.executeReport(report.id);
      setExecutions([execution, ...executions]);
      alert("Report execution started");
    } catch (error) {
      console.error("Failed to run report:", error);
      alert("Failed to run report");
    }
  };

  const getStatusBadge = (status: ReportExecution["status"]) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      running: "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Report not found
          </h2>
          <p className="text-gray-500 mb-6">
            The report you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/analytics/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const executionColumns = [
    { key: "id", label: "Execution ID", sortable: true },
    { key: "status", label: "Status", sortable: true },
    {
      key: "startedAt",
      label: "Started",
      format: "date" as const,
      sortable: true,
    },
    {
      key: "completedAt",
      label: "Completed",
      format: "date" as const,
      sortable: true,
    },
    {
      key: "fileSize",
      label: "File Size",
      format: "number" as const,
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/analytics/reports"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {report.name}
                  </h1>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm font-medium capitalize">
                    {report.type}
                  </span>
                </div>
                {report.description && (
                  <p className="text-gray-500 mt-1">{report.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
              <Link
                href={`/analytics/reports/${report.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Report Details */}
          <div className="col-span-2 space-y-6">
            {/* Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Metrics
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {report.query.metrics.map((metric) => (
                      <span
                        key={metric}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {metric.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {report.query.dimensions &&
                  report.query.dimensions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Dimensions
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {report.query.dimensions.map((dimension) => (
                          <span
                            key={dimension}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {dimension}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Format
                    </label>
                    <p className="text-gray-900 uppercase mt-1">
                      {report.format}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <p className="mt-1">{getStatusBadge(report.status)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution History */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Execution History
                </h2>
              </div>
              <DataTable
                data={executions}
                columns={executionColumns}
                pageSize={5}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Info */}
            {report.schedule && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Schedule
                  </h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-gray-500">Frequency</label>
                    <p className="text-gray-900 capitalize">
                      {report.schedule.frequency}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500">Time</label>
                    <p className="text-gray-900">{report.schedule.time}</p>
                  </div>
                  {report.nextRun && (
                    <div>
                      <label className="text-gray-500">Next Run</label>
                      <p className="text-gray-900">
                        {new Date(report.nextRun).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recipients */}
            {report.recipients && report.recipients.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recipients
                </h2>
                <div className="space-y-2">
                  {report.recipients.map((email) => (
                    <div
                      key={email}
                      className="px-3 py-2 bg-gray-50 rounded text-sm text-gray-700"
                    >
                      {email}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">Last Modified</label>
                  <p className="text-gray-900">
                    {new Date(report.updatedAt).toLocaleString()}
                  </p>
                </div>
                {report.lastRun && (
                  <div>
                    <label className="text-gray-500">Last Run</label>
                    <p className="text-gray-900">
                      {new Date(report.lastRun).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

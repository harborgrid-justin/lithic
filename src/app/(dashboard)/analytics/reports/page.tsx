'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Edit, Trash2, Play, Calendar, ArrowLeft } from 'lucide-react';
import { Report, reportingService } from '@/services/reporting.service';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'quality' | 'financial' | 'operational' | 'population' | 'regulatory'>('all');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportingService.getReports(
        filter !== 'all' ? { type: filter } : undefined
      );
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportingService.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    }
  };

  const handleRun = async (id: string) => {
    try {
      const execution = await reportingService.executeReport(id);
      alert(`Report execution started. Execution ID: ${execution.id}`);
    } catch (error) {
      console.error('Failed to run report:', error);
      alert('Failed to run report');
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Reports' },
    { value: 'quality', label: 'Quality' },
    { value: 'financial', label: 'Financial' },
    { value: 'operational', label: 'Operational' },
    { value: 'population', label: 'Population Health' },
    { value: 'regulatory', label: 'Regulatory' },
  ];

  const getStatusBadge = (status: Report['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      archived: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-1">
                  Build, schedule, and manage custom reports
                </p>
              </div>
            </div>
            <Link
              href="/analytics/reports/builder"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Report
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first report
            </p>
            <Link
              href="/analytics/reports/builder"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Report
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/analytics/reports/${report.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {report.name}
                      </Link>
                      {getStatusBadge(report.status)}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {report.type}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                        {report.format}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-gray-500 mb-3">{report.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>{report.query.metrics.length} metrics</span>
                      {report.schedule && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {report.schedule.frequency}
                        </span>
                      )}
                      {report.lastRun && (
                        <span>
                          Last run: {new Date(report.lastRun).toLocaleDateString()}
                        </span>
                      )}
                      {report.nextRun && (
                        <span>
                          Next run: {new Date(report.nextRun).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleRun(report.id)}
                      className="p-2 hover:bg-green-100 rounded transition-colors"
                      title="Run Report"
                    >
                      <Play className="w-4 h-4 text-green-600" />
                    </button>
                    <Link
                      href={`/analytics/reports/${report.id}/edit`}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

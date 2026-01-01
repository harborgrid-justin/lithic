/**
 * Dashboard Viewer Page
 * View and interact with a saved dashboard
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Maximize2, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardLayout } from '@/lib/dashboards/engine/dashboard-builder';

export default function DashboardViewerPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [dashboardId]);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      } else {
        console.error('Dashboard not found');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const response = await fetch('/api/dashboards/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardId,
          format,
          widgets: dashboard?.widgets || [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Dashboard exported successfully! Download URL: ${data.downloadUrl}`);
      }
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      alert('Failed to export dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Not Found</h2>
          <p className="text-gray-600">The requested dashboard could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="mt-1 text-sm text-gray-600">{dashboard.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {dashboard.settings?.showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {dashboard.settings?.showExport && (
              <div className="relative group">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            )}

            {dashboard.settings?.showFullscreen && (
              <Button variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-4 auto-rows-[100px]">
          {dashboard.widgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-white rounded-lg shadow p-4"
              style={{
                gridColumn: `span ${widget.position.w}`,
                gridRow: `span ${widget.position.h}`,
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {widget.title}
              </h3>
              <div className="text-sm text-gray-600">
                Widget Type: {widget.type}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Data Source: {widget.dataSource.type}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {dashboard.widgets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">This dashboard has no widgets configured.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Last updated: {new Date(dashboard.metadata.updatedAt).toLocaleString()}
          </div>
          <div>Version {dashboard.metadata.version}</div>
        </div>
      </div>
    </div>
  );
}

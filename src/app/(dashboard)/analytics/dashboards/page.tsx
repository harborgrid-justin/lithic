'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Layout, Edit, Trash2, Share2, ArrowLeft } from 'lucide-react';
import { Dashboard, analyticsService } from '@/services/analytics.service';

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'quality' | 'financial' | 'operational' | 'population' | 'custom'>('all');

  useEffect(() => {
    loadDashboards();
  }, [filter]);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getDashboards(
        filter !== 'all' ? { type: filter } : undefined
      );
      setDashboards(data);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      await analyticsService.deleteDashboard(id);
      setDashboards(dashboards.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      alert('Failed to delete dashboard');
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Dashboards' },
    { value: 'quality', label: 'Quality' },
    { value: 'financial', label: 'Financial' },
    { value: 'operational', label: 'Operational' },
    { value: 'population', label: 'Population Health' },
    { value: 'custom', label: 'Custom' },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboards</h1>
                <p className="text-gray-500 mt-1">
                  Create and manage custom analytics dashboards
                </p>
              </div>
            </div>
            <Link
              href="/analytics/dashboards/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Dashboard
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

        {/* Dashboard Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dashboards.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Layout className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No dashboards found</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first dashboard
            </p>
            <Link
              href="/analytics/dashboards/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <Link href={`/analytics/dashboards/${dashboard.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layout className="w-5 h-5 text-blue-600" />
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {dashboard.type}
                      </span>
                    </div>
                    {dashboard.shared && (
                      <Share2 className="w-4 h-4 text-gray-400" title="Shared" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {dashboard.name}
                  </h3>
                  {dashboard.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {dashboard.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{dashboard.widgets.length} widgets</span>
                    <span>{new Date(dashboard.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                  <Link
                    href={`/analytics/dashboards/${dashboard.id}/edit`}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(dashboard.id)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

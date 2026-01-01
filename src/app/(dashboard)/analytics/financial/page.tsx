'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FilterConfig, MetricData, analyticsService } from '@/services/analytics.service';
import { KPICard } from '@/components/analytics/KPICard';
import { TrendAnalysis } from '@/components/analytics/TrendAnalysis';
import { FilterPanel } from '@/components/analytics/FilterPanel';

export default function FinancialMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      preset: 'quarter',
    },
  });

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getFinancialMetrics(filters);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load financial metrics:', error);
    } finally {
      setLoading(false);
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
            <div className="w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Performance</h1>
              <p className="text-gray-500 mt-1">
                Revenue cycle, accounts receivable, and collection metrics
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
                departments: ['Cardiology', 'Oncology', 'Emergency', 'Surgery', 'ICU'],
                locations: ['Main Campus', 'North Clinic', 'South Clinic'],
                payors: ['Medicare', 'Medicaid', 'Blue Cross', 'Aetna', 'UnitedHealth'],
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Financial Indicators</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((metric) => (
                      <KPICard key={metric.id} metric={metric} />
                    ))}
                  </div>
                </div>

                {/* Revenue Trend */}
                <TrendAnalysis
                  metric="total_revenue"
                  metricName="Total Revenue Trend"
                  filters={filters}
                  granularity="month"
                />

                {/* Collection Rate Trend */}
                <TrendAnalysis
                  metric="collection_rate"
                  metricName="Collection Rate Trend"
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

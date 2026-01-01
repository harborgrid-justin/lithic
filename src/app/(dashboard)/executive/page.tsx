/**
 * Executive Dashboard Page
 * C-suite overview with key organizational metrics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboards/widgets/metric-card';
import { DataTable, Column } from '@/components/dashboards/widgets/data-table';
import {
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Heart,
  Building2,
} from 'lucide-react';

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch KPIs from API
    const fetchKPIs = async () => {
      try {
        const response = await fetch('/api/dashboards/kpis?category=all');
        const data = await response.json();
        setKpis(data.kpis);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  // Extract specific KPIs
  const financialKPIs = kpis.filter(k => k.category === 'revenue' || k.category === 'collections');
  const clinicalKPIs = kpis.filter(k => k.category === 'quality' || k.category === 'safety');
  const operationalKPIs = kpis.filter(k => k.category === 'throughput' || k.category === 'capacity');

  // Sample department performance data
  const departmentData = [
    {
      department: 'Emergency Department',
      volume: 3245,
      revenue: 12500000,
      satisfaction: 88,
      quality: 92,
    },
    {
      department: 'Surgery',
      volume: 1823,
      revenue: 28400000,
      satisfaction: 94,
      quality: 96,
    },
    {
      department: 'Cardiology',
      volume: 1456,
      revenue: 18200000,
      satisfaction: 91,
      quality: 94,
    },
    {
      department: 'Oncology',
      volume: 892,
      revenue: 21300000,
      satisfaction: 89,
      quality: 93,
    },
    {
      department: 'Orthopedics',
      volume: 1234,
      revenue: 15800000,
      satisfaction: 92,
      quality: 95,
    },
  ];

  const columns: Column[] = [
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'volume',
      label: 'Volume',
      sortable: true,
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      format: (v) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(v),
    },
    {
      key: 'satisfaction',
      label: 'Satisfaction',
      sortable: true,
      format: (v) => `${v}%`,
    },
    {
      key: 'quality',
      label: 'Quality Score',
      sortable: true,
      format: (v) => `${v}%`,
    },
  ];

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Organization-wide key performance indicators and metrics
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Net Revenue (MTD)"
          value={42500000}
          format="currency"
          trend="up"
          trendValue={8.3}
          target={45000000}
          status="success"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          subtitle="vs. $39.2M last month"
        />

        <MetricCard
          title="Patient Volume"
          value={8945}
          format="number"
          trend="up"
          trendValue={5.2}
          status="success"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          subtitle="Total encounters this month"
        />

        <MetricCard
          title="Bed Occupancy"
          value={87.5}
          format="percentage"
          trend="stable"
          trendValue={0.3}
          target={85}
          status="warning"
          icon={<Building2 className="w-6 h-6 text-yellow-600" />}
          subtitle="Optimal range: 75-90%"
        />

        <MetricCard
          title="Quality Score"
          value={92.8}
          format="number"
          trend="up"
          trendValue={2.1}
          target={90}
          status="success"
          icon={<Heart className="w-6 h-6 text-red-600" />}
          subtitle="Composite clinical quality"
        />

        <MetricCard
          title="Patient Satisfaction"
          value={88.5}
          format="percentage"
          trend="up"
          trendValue={3.4}
          target={85}
          status="success"
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          subtitle="HCAHPS top-box score"
        />

        <MetricCard
          title="Operating Margin"
          value={12.4}
          format="percentage"
          trend="up"
          trendValue={1.8}
          target={10}
          status="success"
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          subtitle="Above target"
        />
      </div>

      {/* Department Performance Table */}
      <div className="mb-8">
        <DataTable
          title="Department Performance"
          columns={columns}
          data={departmentData}
          pageSize={10}
          showPagination={false}
          showSearch={true}
          showExport={true}
        />
      </div>

      {/* Additional KPI Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial KPIs */}
        {financialKPIs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Financial Performance
            </h2>
            <div className="space-y-4">
              {financialKPIs.slice(0, 4).map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{kpi.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {kpi.format === 'currency' &&
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                        }).format(kpi.value)}
                      {kpi.format === 'percentage' && `${kpi.value.toFixed(1)}%`}
                      {kpi.format === 'number' && kpi.value.toLocaleString()}
                    </span>
                    {kpi.status && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          kpi.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : kpi.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {kpi.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical KPIs */}
        {clinicalKPIs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Clinical Quality
            </h2>
            <div className="space-y-4">
              {clinicalKPIs.slice(0, 4).map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{kpi.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {kpi.format === 'percentage' && `${kpi.value.toFixed(1)}%`}
                      {kpi.format === 'rate' && kpi.value.toFixed(2)}
                      {kpi.format === 'ratio' && kpi.value.toFixed(2)}
                    </span>
                    {kpi.status && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          kpi.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : kpi.status === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {kpi.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * COO (Chief Operating Officer) Dashboard
 * Operational efficiency, capacity management, and throughput metrics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboards/widgets/metric-card';
import { DataTable, Column } from '@/components/dashboards/widgets/data-table';
import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function COODashboard() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch('/api/dashboards/kpis?category=operational');
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

  const operationalData = [
    {
      metric: 'ED Wait Time',
      value: 28,
      target: 30,
      unit: 'min',
      status: 'success',
    },
    {
      metric: 'ED Length of Stay',
      value: 185,
      target: 180,
      unit: 'min',
      status: 'warning',
    },
    {
      metric: 'Bed Turnover Time',
      value: 95,
      target: 120,
      unit: 'min',
      status: 'success',
    },
    {
      metric: 'OR Utilization',
      value: 82,
      target: 80,
      unit: '%',
      status: 'success',
    },
    {
      metric: 'Average Length of Stay',
      value: 4.2,
      target: 4.5,
      unit: 'days',
      status: 'success',
    },
  ];

  const columns: Column[] = [
    { key: 'metric', label: 'Operational Metric', sortable: true },
    {
      key: 'value',
      label: 'Current',
      sortable: true,
      format: (v, row) => `${v} ${row.unit}`,
    },
    {
      key: 'target',
      label: 'Target',
      sortable: true,
      format: (v, row) => `${v} ${row.unit}`,
    },
    {
      key: 'status',
      label: 'Status',
      format: (v) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            v === 'success'
              ? 'bg-green-100 text-green-800'
              : v === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {v}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">COO Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Operational efficiency, capacity, and throughput analytics
        </p>
      </div>

      {/* Key Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Bed Occupancy"
          value={87.5}
          format="percentage"
          trend="stable"
          trendValue={0.3}
          target={85}
          status="warning"
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          subtitle="230/263 beds occupied"
        />

        <MetricCard
          title="ED Throughput"
          value={142}
          format="number"
          trend="up"
          trendValue={4.2}
          status="success"
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          subtitle="Patients per day"
        />

        <MetricCard
          title="Average LOS"
          value={4.2}
          format="number"
          trend="down"
          trendValue={3.5}
          target={4.5}
          status="success"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          subtitle="Days (inpatient)"
        />

        <MetricCard
          title="LWBS Rate"
          value={1.8}
          format="percentage"
          trend="down"
          trendValue={0.5}
          target={2.0}
          status="success"
          icon={<AlertCircle className="w-6 h-6 text-yellow-600" />}
          subtitle="Left without being seen"
        />
      </div>

      {/* Operational Performance Table */}
      <div className="mb-8">
        <DataTable
          title="Key Operational Indicators"
          columns={columns}
          data={operationalData}
          pageSize={10}
          showPagination={false}
          showExport={true}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Capacity Management
          </h2>
          <div className="space-y-4">
            <CapacityMetric
              label="Medical-Surgical"
              occupied={45}
              total={50}
              status="success"
            />
            <CapacityMetric label="ICU" occupied={18} total={20} status="warning" />
            <CapacityMetric label="Telemetry" occupied={28} total={30} status="success" />
            <CapacityMetric label="Emergency" occupied={32} total={35} status="warning" />
            <CapacityMetric label="Surgery" occupied={15} total={18} status="success" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Throughput Metrics
          </h2>
          <div className="space-y-4">
            <ThroughputMetric label="ED Arrivals (24h)" value={142} trend={5.2} />
            <ThroughputMetric label="Admissions (24h)" value={45} trend={-2.1} />
            <ThroughputMetric label="Discharges (24h)" value={48} trend={3.8} />
            <ThroughputMetric label="Surgeries (24h)" value={28} trend={1.5} />
            <ThroughputMetric label="Transfers (24h)" value={12} trend={-0.8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CapacityMetric({
  label,
  occupied,
  total,
  status,
}: {
  label: string;
  occupied: number;
  total: number;
  status: 'success' | 'warning' | 'danger';
}) {
  const percentage = (occupied / total) * 100;
  const colorClass =
    status === 'success'
      ? 'bg-green-500'
      : status === 'warning'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">
          {occupied} / {total} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ThroughputMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: number;
}) {
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">{value}</span>
        <span className={`text-sm ${trendColor}`}>
          {trendIcon} {Math.abs(trend).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

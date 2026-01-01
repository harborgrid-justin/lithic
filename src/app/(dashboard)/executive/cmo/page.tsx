/**
 * CMO (Chief Medical Officer) Dashboard
 * Clinical quality, safety metrics, and patient outcomes
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboards/widgets/metric-card';
import { DataTable, Column } from '@/components/dashboards/widgets/data-table';
import { Heart, Activity, AlertTriangle, TrendingDown } from 'lucide-react';

export default function CMODashboard() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch('/api/dashboards/kpis?category=clinical');
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

  const qualityData = [
    { measure: 'Sepsis Bundle Compliance', value: 92.3, target: 90, status: 'success' },
    { measure: 'Stroke Care (Door-to-Needle)', value: 87.1, target: 85, status: 'success' },
    { measure: 'MI Care Compliance', value: 94.8, target: 95, status: 'warning' },
    { measure: 'VTE Prophylaxis', value: 96.2, target: 95, status: 'success' },
    { measure: 'Antibiotic Timing', value: 98.5, target: 95, status: 'success' },
  ];

  const columns: Column[] = [
    { key: 'measure', label: 'Quality Measure', sortable: true },
    {
      key: 'value',
      label: 'Performance',
      sortable: true,
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      key: 'target',
      label: 'Target',
      sortable: true,
      format: (v) => `${v}%`,
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
        <h1 className="text-3xl font-bold text-gray-900">CMO Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Clinical quality, patient safety, and outcomes tracking
        </p>
      </div>

      {/* Key Clinical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Patient Safety Score"
          value={92.8}
          format="number"
          trend="up"
          trendValue={2.3}
          target={90}
          status="success"
          icon={<Heart className="w-6 h-6 text-red-600" />}
          subtitle="Composite safety index"
        />

        <MetricCard
          title="30-Day Readmission"
          value={11.2}
          format="percentage"
          trend="down"
          trendValue={1.8}
          target={12}
          status="success"
          icon={<TrendingDown className="w-6 h-6 text-green-600" />}
          subtitle="Below target"
        />

        <MetricCard
          title="Mortality Ratio (O/E)"
          value={0.87}
          format="number"
          trend="down"
          trendValue={4.2}
          target={0.9}
          status="success"
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          subtitle="Better than expected"
        />

        <MetricCard
          title="HAC Rate"
          value={2.3}
          format="number"
          trend="stable"
          trendValue={0.1}
          target={2.5}
          status="success"
          icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          subtitle="Per 1000 patient days"
        />
      </div>

      {/* Core Measures */}
      <div className="mb-8">
        <DataTable
          title="Core Measure Performance"
          columns={columns}
          data={qualityData}
          pageSize={10}
          showPagination={false}
          showExport={true}
        />
      </div>

      {/* Safety Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Patient Safety Events
          </h2>
          <div className="space-y-3">
            <SafetyMetric label="Falls with Injury" current={0.28} target={0.3} />
            <SafetyMetric label="Pressure Ulcers (Stage 3+)" current={0.42} target={0.5} />
            <SafetyMetric label="Hospital-Acquired Infections" current={0.92} target={1.0} />
            <SafetyMetric label="Medication Errors" current={0.38} target={0.5} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Clinical Outcomes
          </h2>
          <div className="space-y-3">
            <OutcomeMetric label="HCAHPS Overall Rating" value={88.5} target={85} />
            <OutcomeMetric label="Sepsis Mortality" value={12.3} target={15} inverse />
            <OutcomeMetric label="Stroke Outcomes (mRS 0-2)" value={68.2} target={65} />
            <OutcomeMetric label="CABG Mortality" value={1.8} target={2.5} inverse />
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetyMetric({ label, current, target }: { label: string; current: number; target: number }) {
  const percentage = (current / target) * 100;
  const status = current <= target ? 'success' : 'warning';
  const colorClass = status === 'success' ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">{current.toFixed(2)} per 1000</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">Target: {target} per 1000</div>
    </div>
  );
}

function OutcomeMetric({
  label,
  value,
  target,
  inverse = false,
}: {
  label: string;
  value: number;
  target: number;
  inverse?: boolean;
}) {
  const meetsTarget = inverse ? value <= target : value >= target;
  const colorClass = meetsTarget ? 'text-green-600' : 'text-yellow-600';

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="text-right">
        <span className={`text-lg font-semibold ${colorClass}`}>{value.toFixed(1)}%</span>
        <span className="text-xs text-gray-500 ml-2">/ {target}%</span>
      </div>
    </div>
  );
}

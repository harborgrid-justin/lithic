/**
 * CNO (Chief Nursing Officer) Dashboard
 * Nursing metrics, staffing, and patient care quality
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboards/widgets/metric-card';
import { DataTable, Column } from '@/components/dashboards/widgets/data-table';
import { Users, Clock, Heart, Award } from 'lucide-react';

export default function CNODashboard() {
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

  const unitData = [
    { unit: 'Medical-Surgical', census: 45, capacity: 50, hppd: 8.2, satisfaction: 89 },
    { unit: 'ICU', census: 18, capacity: 20, hppd: 12.5, satisfaction: 92 },
    { unit: 'Emergency', census: 32, capacity: 35, hppd: 6.8, satisfaction: 85 },
    { unit: 'Telemetry', census: 28, capacity: 30, hppd: 7.9, satisfaction: 91 },
    { unit: 'Oncology', census: 22, capacity: 25, hppd: 9.1, satisfaction: 94 },
  ];

  const columns: Column[] = [
    { key: 'unit', label: 'Unit', sortable: true },
    {
      key: 'census',
      label: 'Census',
      sortable: true,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
    },
    {
      key: 'hppd',
      label: 'HPPD',
      sortable: true,
      format: (v) => v.toFixed(1),
    },
    {
      key: 'satisfaction',
      label: 'Satisfaction',
      sortable: true,
      format: (v) => `${v}%`,
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
        <h1 className="text-3xl font-bold text-gray-900">CNO Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Nursing operations, staffing, and care quality metrics
        </p>
      </div>

      {/* Key Nursing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Nursing HPPD"
          value={8.3}
          format="number"
          trend="up"
          trendValue={1.2}
          target={8.0}
          status="success"
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          subtitle="Hours per patient day"
        />

        <MetricCard
          title="Nurse-Patient Ratio"
          value={4.8}
          format="number"
          trend="down"
          trendValue={2.1}
          target={5.0}
          status="success"
          icon={<Users className="w-6 h-6 text-purple-600" />}
          subtitle="1:4.8 average ratio"
        />

        <MetricCard
          title="Nurse Satisfaction"
          value={86.5}
          format="percentage"
          trend="up"
          trendValue={3.2}
          target={85}
          status="success"
          icon={<Heart className="w-6 h-6 text-red-600" />}
          subtitle="Annual survey score"
        />

        <MetricCard
          title="Magnet Recognition"
          value={92}
          format="number"
          trend="stable"
          trendValue={0.5}
          target={90}
          status="success"
          icon={<Award className="w-6 h-6 text-yellow-600" />}
          subtitle="Excellence score"
        />
      </div>

      {/* Unit Performance */}
      <div className="mb-8">
        <DataTable
          title="Unit Performance Summary"
          columns={columns}
          data={unitData}
          pageSize={10}
          showPagination={false}
          showExport={true}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Nursing Quality Indicators
          </h2>
          <div className="space-y-4">
            <QualityIndicator label="Pressure Ulcer Prevention" value={98.2} target={95} />
            <QualityIndicator label="Fall Risk Assessment" value={99.5} target={98} />
            <QualityIndicator label="Pain Management" value={92.8} target={90} />
            <QualityIndicator label="Patient Education" value={96.3} target={95} />
            <QualityIndicator label="Discharge Planning" value={94.1} target={93} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Staffing Overview
          </h2>
          <div className="space-y-4">
            <StaffingMetric label="RN FTEs" current={245} budgeted={250} />
            <StaffingMetric label="LPN FTEs" current={82} budgeted={80} />
            <StaffingMetric label="CNA FTEs" current={156} budgeted={160} />
            <StaffingMetric label="Overtime Hours" current={1250} budgeted={1500} inverse />
            <StaffingMetric label="Agency Hours" current={450} budgeted={600} inverse />
          </div>
        </div>
      </div>
    </div>
  );
}

function QualityIndicator({ label, value, target }: { label: string; value: number; target: number }) {
  const meetsTarget = value >= target;
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

function StaffingMetric({
  label,
  current,
  budgeted,
  inverse = false,
}: {
  label: string;
  current: number;
  budgeted: number;
  inverse?: boolean;
}) {
  const percentage = (current / budgeted) * 100;
  const meetsTarget = inverse ? current <= budgeted : current >= budgeted * 0.95;
  const colorClass = meetsTarget ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">
          {current.toLocaleString()} / {budgeted.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

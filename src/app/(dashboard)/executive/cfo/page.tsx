/**
 * CFO Dashboard Page
 * Financial metrics and revenue cycle performance
 */

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboards/widgets/metric-card';
import { DataTable, Column } from '@/components/dashboards/widgets/data-table';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';

export default function CFODashboard() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch('/api/dashboards/kpis?category=financial');
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

  // Payer mix data
  const payerMixData = [
    { payer: 'Medicare', volume: 4523, revenue: 18500000, percentage: 45 },
    { payer: 'Commercial', volume: 3214, revenue: 15200000, percentage: 37 },
    { payer: 'Medicaid', volume: 1234, revenue: 5800000, percentage: 14 },
    { payer: 'Self-Pay', volume: 456, revenue: 1500000, percentage: 4 },
  ];

  const payerColumns: Column[] = [
    { key: 'payer', label: 'Payer', sortable: true },
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
      key: 'percentage',
      label: 'Mix %',
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
        <h1 className="text-3xl font-bold text-gray-900">CFO Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Financial performance and revenue cycle analytics
        </p>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Net Revenue"
          value={42500000}
          format="currency"
          trend="up"
          trendValue={8.3}
          status="success"
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          subtitle="Month-to-date"
        />

        <MetricCard
          title="Collection Rate"
          value={96.8}
          format="percentage"
          trend="up"
          trendValue={1.2}
          target={95}
          status="success"
          icon={<CreditCard className="w-6 h-6 text-blue-600" />}
          subtitle="Net collections"
        />

        <MetricCard
          title="Days in AR"
          value={42}
          format="number"
          trend="down"
          trendValue={5.2}
          target={45}
          status="success"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          subtitle="Below target"
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
          subtitle="Above industry avg"
        />
      </div>

      {/* Detailed KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Revenue Cycle Performance
          </h2>
          <div className="space-y-4">
            {kpis.slice(0, 6).map((kpi) => (
              <div key={kpi.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{kpi.name}</p>
                  <p className="text-xs text-gray-500">{kpi.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {kpi.format === 'currency' &&
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(kpi.value)}
                    {kpi.format === 'percentage' && `${kpi.value.toFixed(1)}%`}
                    {kpi.format === 'days' && `${kpi.value} days`}
                  </p>
                  {kpi.target && (
                    <p className="text-xs text-gray-500">
                      Target: {kpi.format === 'currency' ? '$' : ''}
                      {kpi.target.toLocaleString()}
                      {kpi.format === 'percentage' ? '%' : ''}
                      {kpi.format === 'days' ? ' days' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AR Aging Analysis
          </h2>
          <div className="space-y-3">
            <ARAgingBar label="0-30 days" value={50} amount={15000000} status="success" />
            <ARAgingBar label="31-60 days" value={25} amount={7500000} status="success" />
            <ARAgingBar label="61-90 days" value={15} amount={4500000} status="warning" />
            <ARAgingBar label="91+ days" value={10} amount={3000000} status="danger" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total AR</span>
              <span>$30,000,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payer Mix */}
      <div className="mb-8">
        <DataTable
          title="Payer Mix Analysis"
          columns={payerColumns}
          data={payerMixData}
          pageSize={10}
          showPagination={false}
          showExport={true}
        />
      </div>
    </div>
  );
}

function ARAgingBar({
  label,
  value,
  amount,
  status,
}: {
  label: string;
  value: number;
  amount: number;
  status: 'success' | 'warning' | 'danger';
}) {
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
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(amount)}{' '}
          ({value}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

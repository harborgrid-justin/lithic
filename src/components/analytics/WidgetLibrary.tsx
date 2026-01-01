'use client';

import { useState } from 'react';
import { Plus, BarChart3, TrendingUp, Table, PieChart, Activity, Target } from 'lucide-react';
import { Widget, WidgetConfig } from '@/services/analytics.service';

interface WidgetTemplate {
  id: string;
  type: Widget['type'];
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultConfig: WidgetConfig;
  category: 'quality' | 'financial' | 'operational' | 'population' | 'general';
}

interface WidgetLibraryProps {
  onAddWidget: (template: WidgetTemplate) => void;
  category?: string;
  className?: string;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // General Widgets
  {
    id: 'kpi-card',
    type: 'kpi',
    name: 'KPI Card',
    description: 'Single metric display with trend',
    icon: <Target className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      metrics: ['total_revenue'],
      aggregation: 'sum',
    },
  },
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    description: 'Time series line chart',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      chartType: 'line',
      metrics: ['patient_volume'],
      dimensions: ['date'],
      showLegend: true,
      showGrid: true,
    },
  },
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    description: 'Comparison bar chart',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      chartType: 'bar',
      metrics: ['patient_volume'],
      dimensions: ['department'],
      showLegend: true,
      showGrid: true,
    },
  },
  {
    id: 'pie-chart',
    type: 'chart',
    name: 'Pie Chart',
    description: 'Distribution pie chart',
    icon: <PieChart className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      chartType: 'pie',
      metrics: ['value'],
      dimensions: ['category'],
      showLegend: true,
    },
  },
  {
    id: 'data-table',
    type: 'table',
    name: 'Data Table',
    description: 'Sortable data table',
    icon: <Table className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      metrics: ['name', 'value', 'change'],
    },
  },
  {
    id: 'trend-analysis',
    type: 'trend',
    name: 'Trend Analysis',
    description: 'Multi-period trend comparison',
    icon: <Activity className="w-5 h-5" />,
    category: 'general',
    defaultConfig: {
      chartType: 'area',
      metrics: ['value'],
      dimensions: ['date'],
      showGrid: true,
    },
  },

  // Quality Metrics Widgets
  {
    id: 'readmission-rate',
    type: 'kpi',
    name: 'Readmission Rate',
    description: '30-day readmission rate',
    icon: <Target className="w-5 h-5" />,
    category: 'quality',
    defaultConfig: {
      metrics: ['readmission_rate'],
      aggregation: 'avg',
    },
  },
  {
    id: 'patient-satisfaction',
    type: 'chart',
    name: 'Patient Satisfaction',
    description: 'HCAHPS scores over time',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'quality',
    defaultConfig: {
      chartType: 'line',
      metrics: ['patient_satisfaction'],
      dimensions: ['date'],
      showLegend: true,
      showGrid: true,
    },
  },
  {
    id: 'core-measures',
    type: 'benchmark',
    name: 'Core Measures',
    description: 'CMS core measures with benchmarks',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'quality',
    defaultConfig: {
      chartType: 'bar',
      metrics: ['core_measures'],
      dimensions: ['measure'],
      showLegend: true,
    },
  },

  // Financial Widgets
  {
    id: 'revenue-trend',
    type: 'chart',
    name: 'Revenue Trend',
    description: 'Monthly revenue trend',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'financial',
    defaultConfig: {
      chartType: 'area',
      metrics: ['total_revenue', 'net_revenue'],
      dimensions: ['month'],
      showLegend: true,
      showGrid: true,
    },
  },
  {
    id: 'ar-metrics',
    type: 'kpi',
    name: 'Days in AR',
    description: 'Accounts receivable days',
    icon: <Target className="w-5 h-5" />,
    category: 'financial',
    defaultConfig: {
      metrics: ['days_in_ar'],
      aggregation: 'avg',
    },
  },
  {
    id: 'collection-rate',
    type: 'kpi',
    name: 'Collection Rate',
    description: 'Revenue collection percentage',
    icon: <Target className="w-5 h-5" />,
    category: 'financial',
    defaultConfig: {
      metrics: ['collection_rate'],
      aggregation: 'avg',
    },
  },

  // Operational Widgets
  {
    id: 'bed-occupancy',
    type: 'chart',
    name: 'Bed Occupancy',
    description: 'Bed occupancy rate over time',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'operational',
    defaultConfig: {
      chartType: 'bar',
      metrics: ['bed_occupancy'],
      dimensions: ['department'],
      showLegend: true,
      showGrid: true,
    },
  },
  {
    id: 'er-wait-time',
    type: 'kpi',
    name: 'ER Wait Time',
    description: 'Average ER wait time',
    icon: <Target className="w-5 h-5" />,
    category: 'operational',
    defaultConfig: {
      metrics: ['er_wait_time'],
      aggregation: 'avg',
    },
  },
  {
    id: 'patient-volume',
    type: 'chart',
    name: 'Patient Volume',
    description: 'Daily patient volume',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'operational',
    defaultConfig: {
      chartType: 'line',
      metrics: ['patient_volume'],
      dimensions: ['date'],
      showLegend: true,
      showGrid: true,
    },
  },

  // Population Health Widgets
  {
    id: 'risk-stratification',
    type: 'chart',
    name: 'Risk Stratification',
    description: 'Patient risk distribution',
    icon: <PieChart className="w-5 h-5" />,
    category: 'population',
    defaultConfig: {
      chartType: 'pie',
      metrics: ['patient_count'],
      dimensions: ['risk_level'],
      showLegend: true,
    },
  },
  {
    id: 'care-gaps',
    type: 'kpi',
    name: 'Care Gap Closure',
    description: 'Care gap closure rate',
    icon: <Target className="w-5 h-5" />,
    category: 'population',
    defaultConfig: {
      metrics: ['care_gap_closure_rate'],
      aggregation: 'avg',
    },
  },
  {
    id: 'chronic-disease',
    type: 'chart',
    name: 'Chronic Disease Prevalence',
    description: 'Chronic disease breakdown',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'population',
    defaultConfig: {
      chartType: 'bar',
      metrics: ['prevalence'],
      dimensions: ['condition'],
      showLegend: true,
      showGrid: true,
    },
  },
];

export function WidgetLibrary({ onAddWidget, category, className = '' }: WidgetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Widgets' },
    { id: 'general', name: 'General' },
    { id: 'quality', name: 'Quality' },
    { id: 'financial', name: 'Financial' },
    { id: 'operational', name: 'Operational' },
    { id: 'population', name: 'Population Health' },
  ];

  const filteredTemplates = WIDGET_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Widget Library</h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search widgets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onAddWidget(template)}
            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
          >
            <div className="flex-shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200">
              {template.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm mb-1">{template.name}</h4>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
          </button>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-2 py-8 text-center text-gray-500">
            <p>No widgets found</p>
          </div>
        )}
      </div>
    </div>
  );
}

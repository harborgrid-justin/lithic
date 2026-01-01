/**
 * Dashboard Builder Page
 * Interactive dashboard builder with drag-drop interface
 */

'use client';

import React, { useState } from 'react';
import { Plus, Save, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardCanvas } from '@/components/dashboards/builder/canvas';
import { DashboardBuilder, WidgetConfig, createDashboard } from '@/lib/dashboards/engine/dashboard-builder';
import { createWidget } from '@/lib/dashboards/engine/widget-registry';

export default function DashboardBuilderPage() {
  const [dashboard, setDashboard] = useState(() => {
    const builder = createDashboard('New Dashboard', 'custom', 'user123');
    return builder;
  });

  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>();
  const [dashboardName, setDashboardName] = useState('New Dashboard');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddWidget = (type: string) => {
    const widget = createWidget(type);
    const updatedDashboard = dashboard.addWidget(widget);
    setWidgets(updatedDashboard.build().widgets);
  };

  const handleWidgetUpdate = (widgetId: string, updates: Partial<WidgetConfig>) => {
    const updatedDashboard = dashboard.updateWidgetConfig(widgetId, updates);
    setWidgets(updatedDashboard.build().widgets);
  };

  const handleWidgetRemove = (widgetId: string) => {
    const updatedDashboard = dashboard.removeWidget(widgetId);
    setWidgets(updatedDashboard.build().widgets);
  };

  const handleWidgetClone = (widgetId: string) => {
    const newId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedDashboard = dashboard.cloneWidget(widgetId, newId);
    setWidgets(updatedDashboard.build().widgets);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      dashboard.setMetadata({ name: dashboardName });
      const built = dashboard.build();

      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(built),
      });

      if (response.ok) {
        alert('Dashboard saved successfully!');
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert('Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Navigate to preview mode
    window.open(`/dashboards/${dashboard.build().id}?preview=true`, '_blank');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="text-xl font-semibold w-96"
              placeholder="Dashboard name..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Dashboard'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Widget Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Widgets</h2>

            <div className="space-y-2">
              <WidgetButton
                label="Metric Card"
                description="Single metric with trend"
                onClick={() => handleAddWidget('metric-card')}
              />
              <WidgetButton
                label="Line Chart"
                description="Time series visualization"
                onClick={() => handleAddWidget('line-chart')}
              />
              <WidgetButton
                label="Bar Chart"
                description="Categorical comparison"
                onClick={() => handleAddWidget('bar-chart')}
              />
              <WidgetButton
                label="Pie Chart"
                description="Part-to-whole relationship"
                onClick={() => handleAddWidget('pie-chart')}
              />
              <WidgetButton
                label="Data Table"
                description="Tabular data display"
                onClick={() => handleAddWidget('data-table')}
              />
              <WidgetButton
                label="Gauge"
                description="Progress indicator"
                onClick={() => handleAddWidget('gauge')}
              />
              <WidgetButton
                label="Heat Map"
                description="Pattern visualization"
                onClick={() => handleAddWidget('heatmap')}
              />
              <WidgetButton
                label="Map"
                description="Geographic visualization"
                onClick={() => handleAddWidget('geo-map')}
              />
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6">
          <DashboardCanvas
            widgets={widgets}
            onWidgetUpdate={handleWidgetUpdate}
            onWidgetRemove={handleWidgetRemove}
            onWidgetClone={handleWidgetClone}
            onWidgetSelect={setSelectedWidgetId}
            selectedWidgetId={selectedWidgetId}
          />
        </div>

        {/* Property Panel */}
        {selectedWidgetId && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWidgetId(undefined)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Widget Title
                </label>
                <Input
                  value={widgets.find(w => w.id === selectedWidgetId)?.title || ''}
                  onChange={(e) =>
                    handleWidgetUpdate(selectedWidgetId, { title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Source
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="api">API Endpoint</option>
                  <option value="query">Database Query</option>
                  <option value="static">Static Data</option>
                  <option value="realtime">Real-time Stream</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Layout</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={widgets.find(w => w.id === selectedWidgetId)?.position.w || 6}
                      onChange={(e) =>
                        handleWidgetUpdate(selectedWidgetId, {
                          position: {
                            ...widgets.find(w => w.id === selectedWidgetId)!.position,
                            w: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <Input
                      type="number"
                      min="1"
                      value={widgets.find(w => w.id === selectedWidgetId)?.position.h || 4}
                      onChange={(e) =>
                        handleWidgetUpdate(selectedWidgetId, {
                          position: {
                            ...widgets.find(w => w.id === selectedWidgetId)!.position,
                            h: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetButton({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </button>
  );
}

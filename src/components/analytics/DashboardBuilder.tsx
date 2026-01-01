"use client";

import { useState } from "react";
import { Save, X, Layout, Settings } from "lucide-react";
import { Dashboard, Widget, LayoutItem } from "@/services/analytics.service";
import { DashboardGrid } from "./DashboardGrid";
import { WidgetLibrary } from "./WidgetLibrary";

interface DashboardBuilderProps {
  dashboard?: Dashboard;
  onSave: (dashboard: Partial<Dashboard>) => void;
  onCancel: () => void;
  renderWidget: (widget: Widget) => React.ReactNode;
}

export function DashboardBuilder({
  dashboard,
  onSave,
  onCancel,
  renderWidget,
}: DashboardBuilderProps) {
  const [name, setName] = useState(dashboard?.name || "");
  const [description, setDescription] = useState(dashboard?.description || "");
  const [type, setType] = useState<Dashboard["type"]>(
    dashboard?.type || "custom",
  );
  const [shared, setShared] = useState(dashboard?.shared || false);
  const [widgets, setWidgets] = useState<Widget[]>(dashboard?.widgets || []);
  const [layout, setLayout] = useState<LayoutItem[]>(dashboard?.layout || []);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleAddWidget = (template: any) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.name,
      description: template.description,
      dataSource: "default",
      config: template.defaultConfig,
    };

    // Find next available position in grid
    const maxY = layout.reduce(
      (max, item) => Math.max(max, item.y + item.h),
      0,
    );

    const newLayoutItem: LayoutItem = {
      widgetId: newWidget.id,
      x: 0,
      y: maxY,
      w: template.type === "kpi" ? 3 : 6,
      h: template.type === "kpi" ? 1 : 2,
      minW: template.type === "kpi" ? 2 : 3,
      minH: 1,
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
    setLayout(layout.filter((l) => l.widgetId !== widgetId));
  };

  const handleEditWidget = (widget: Widget) => {
    // In a real implementation, this would open a widget configuration modal
    console.log("Edit widget:", widget);
  };

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a dashboard name");
      return;
    }

    const dashboardData: Partial<Dashboard> = {
      name: name.trim(),
      description: description.trim(),
      type,
      widgets,
      layout,
      shared,
      createdBy: "current-user", // In real app, get from auth
    };

    if (dashboard) {
      dashboardData.id = dashboard.id;
    }

    onSave(dashboardData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Layout className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {dashboard ? "Edit Dashboard" : "Create Dashboard"}
                </h1>
                <p className="text-sm text-gray-500">
                  Build and customize your analytics dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Widget
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Dashboard
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Dashboard Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dashboard Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter dashboard name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter dashboard description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dashboard Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as Dashboard["type"])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="custom">Custom</option>
                      <option value="quality">Quality</option>
                      <option value="financial">Financial</option>
                      <option value="operational">Operational</option>
                      <option value="population">Population Health</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shared"
                      checked={shared}
                      onChange={(e) => setShared(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="shared" className="text-sm text-gray-700">
                      Share with other users
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {name || "Untitled Dashboard"}
                </h2>
                {description && (
                  <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
              </div>

              <DashboardGrid
                widgets={widgets}
                layout={layout}
                editable={true}
                onLayoutChange={handleLayoutChange}
                onWidgetRemove={handleRemoveWidget}
                onWidgetEdit={handleEditWidget}
                renderWidget={renderWidget}
              />
            </div>
          </div>

          {/* Widget Library Sidebar */}
          {showWidgetLibrary && (
            <div className="w-96 flex-shrink-0">
              <div className="sticky top-24">
                <WidgetLibrary
                  onAddWidget={handleAddWidget}
                  category={type !== "custom" ? type : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

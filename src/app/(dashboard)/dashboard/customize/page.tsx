"use client";

/**
 * Dashboard Customization Page
 * Allows users to customize their dashboard layout, widgets, and presets
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Plus,
  Grid3x3,
  Eye,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStore } from "@/stores/dashboard-store";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

// ============================================================================
// Widget Catalog
// ============================================================================

interface WidgetTemplate {
  type: string;
  title: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  icon: string;
}

const widgetCatalog: WidgetTemplate[] = [
  {
    type: "metrics",
    title: "Key Metrics",
    description: "Display important healthcare KPIs with sparklines",
    category: "Analytics",
    defaultSize: { w: 12, h: 2 },
    icon: "📊",
  },
  {
    type: "tasks",
    title: "Task List",
    description: "Manage your daily tasks and to-dos",
    category: "Productivity",
    defaultSize: { w: 6, h: 2 },
    icon: "✓",
  },
  {
    type: "alerts",
    title: "Critical Alerts",
    description: "Stay informed about important notifications",
    category: "Clinical",
    defaultSize: { w: 6, h: 2 },
    icon: "⚠️",
  },
  {
    type: "schedule",
    title: "Schedule",
    description: "View today's appointments and events",
    category: "Scheduling",
    defaultSize: { w: 6, h: 2 },
    icon: "📅",
  },
  {
    type: "patients",
    title: "Recent Patients",
    description: "Quick access to recent and favorite patients",
    category: "Clinical",
    defaultSize: { w: 6, h: 2 },
    icon: "👤",
  },
];

// ============================================================================
// Component
// ============================================================================

export default function DashboardCustomizePage() {
  const router = useRouter();
  const {
    widgets,
    layouts,
    currentPresetId,
    setPreset,
    updateLayout,
    addWidget,
    removeWidget,
    toggleWidget,
    resetToDefaults,
    getAvailablePresets,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<"layout" | "widgets" | "presets">(
    "layout",
  );
  const [isSaving, setIsSaving] = useState(false);
  const presets = getAvailablePresets();

  const handleSaveChanges = async () => {
    setIsSaving(true);

    // Simulate API call to save dashboard configuration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    toast.success("Dashboard configuration saved successfully!", {
      icon: "✓",
      duration: 3000,
    });
  };

  const handleResetToDefaults = () => {
    if (
      confirm(
        "Are you sure you want to reset to default settings? This cannot be undone.",
      )
    ) {
      resetToDefaults();
      toast.success("Dashboard reset to defaults", {
        icon: "↺",
        duration: 3000,
      });
    }
  };

  const handleAddWidget = (template: WidgetTemplate) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: template.type as any,
      title: template.title,
      enabled: true,
    };

    const newLayout = {
      id: newWidget.id,
      x: 0,
      y: layouts.length > 0 ? Math.max(...layouts.map((l) => l.y)) + 1 : 0,
      w: template.defaultSize.w,
      h: template.defaultSize.h,
    };

    addWidget(newWidget, newLayout);
    toast.success(`${template.title} widget added`, {
      icon: "✓",
      duration: 2000,
    });
  };

  const handlePresetChange = (presetId: string) => {
    if (
      confirm("Switching presets will replace your current layout. Continue?")
    ) {
      setPreset(presetId);
      toast.success("Preset applied successfully", {
        icon: "✓",
        duration: 2000,
      });
    }
  };

  const currentPreset = presets.find((p) => p.id === currentPresetId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customize Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Personalize your workspace with widgets and layouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="layout" className="text-xs">
                  <Grid3x3 className="w-4 h-4 mr-1" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="widgets" className="text-xs">
                  <Plus className="w-4 h-4 mr-1" />
                  Widgets
                </TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">
                  <Settings className="w-4 h-4 mr-1" />
                  Presets
                </TabsTrigger>
              </TabsList>

              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-3">
                    Widget Management
                  </h3>
                  <div className="space-y-3">
                    {widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {widget.title}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {widget.type}
                          </p>
                        </div>
                        <Switch
                          checked={widget.enabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-sm mb-2">Layout Info</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Total Widgets: {widgets.length}</p>
                    <p>Enabled: {widgets.filter((w) => w.enabled).length}</p>
                    <p>Grid Columns: 12</p>
                  </div>
                </div>
              </TabsContent>

              {/* Widgets Tab */}
              <TabsContent value="widgets" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-3">
                    Available Widgets
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Click to add widgets to your dashboard
                  </p>
                </div>

                {["Analytics", "Clinical", "Productivity", "Scheduling"].map(
                  (category) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {widgetCatalog
                          .filter((w) => w.category === category)
                          .map((template) => {
                            const isAdded = widgets.some(
                              (w) => w.type === template.type,
                            );
                            return (
                              <button
                                key={template.type}
                                onClick={() =>
                                  !isAdded && handleAddWidget(template)
                                }
                                disabled={isAdded}
                                className={cn(
                                  "w-full text-left p-3 border rounded-lg transition-all",
                                  isAdded
                                    ? "bg-gray-50 cursor-not-allowed opacity-60"
                                    : "hover:bg-blue-50 hover:border-blue-300 cursor-pointer",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">
                                    {template.icon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-gray-900">
                                        {template.title}
                                      </p>
                                      {isAdded && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {template.description}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="text-xs mt-2"
                                    >
                                      {template.defaultSize.w} ×{" "}
                                      {template.defaultSize.h}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ),
                )}
              </TabsContent>

              {/* Presets Tab */}
              <TabsContent value="presets" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-3">
                    Dashboard Presets
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Choose a pre-configured layout for your role
                  </p>
                </div>

                <div className="space-y-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={cn(
                        "w-full text-left p-4 border-2 rounded-lg transition-all",
                        currentPresetId === preset.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {preset.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {preset.description}
                          </p>
                          {preset.role && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {preset.role}
                            </Badge>
                          )}
                        </div>
                        {currentPresetId === preset.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Preview
                </h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentPreset?.name || "Custom Layout"}
              </Badge>
            </div>

            <Separator className="mb-6" />

            {/* Widget Grid Preview */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <WidgetGrid
                widgets={widgets}
                layouts={layouts}
                isEditing={true}
                onLayoutChange={updateLayout}
                onWidgetRemove={removeWidget}
              />
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Drag widgets to reorder • Click X to remove • Changes save
              automatically
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

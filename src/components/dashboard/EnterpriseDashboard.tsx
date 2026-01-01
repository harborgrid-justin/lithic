"use client";

/**
 * EnterpriseDashboard - Main Dashboard Component
 * Provides customizable, role-based healthcare dashboard with real-time updates
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Bell,
  RefreshCw,
  Download,
  Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/stores/dashboard-store";
import { WidgetGrid } from "./WidgetGrid";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface EnterpriseDashboardProps {
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EnterpriseDashboard({ className }: EnterpriseDashboardProps) {
  const router = useRouter();

  const {
    widgets,
    layouts,
    notifications,
    unreadCount,
    currentPresetId,
    isCustomizing,
    setCustomizing,
    updateLayout,
    removeWidget,
    setPreset,
    getAvailablePresets,
    toggleNotificationCenter,
    toggleCommandPalette,
  } = useDashboardStore();

  const presets = getAvailablePresets();

  // Simulate real-time updates (in production, use WebSocket/Pusher)
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with real-time event listeners
      // For now, it's just a placeholder for the pattern
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    const dashboardData = {
      preset: currentPresetId,
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        title: w.title,
        enabled: w.enabled,
      })),
      layouts,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dashboardData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentPreset = presets.find((p) => p.id === currentPresetId);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentPreset?.name || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {currentPreset?.description || "Welcome back"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Grid3x3 className="w-4 h-4" />
                Layout Preset
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Dashboard Presets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => setPreset(preset.id)}
                  className={cn(
                    "cursor-pointer",
                    currentPresetId === preset.id && "bg-blue-50",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs text-gray-500">
                      {preset.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={toggleNotificationCenter}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge
                variant="danger"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/customize")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Configuration
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleCommandPalette}>
                Quick Actions (Cmd+K)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Customize Toggle */}
          <Button
            onClick={() => setCustomizing(!isCustomizing)}
            variant={isCustomizing ? "default" : "outline"}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            {isCustomizing ? "Done Editing" : "Customize"}
          </Button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isCustomizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Edit Mode Active
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Drag widgets to reorder, click the X to remove, or add new
                widgets from the customize page
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/customize")}
            >
              Advanced Customization
            </Button>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <WidgetGrid
        widgets={widgets}
        layouts={layouts}
        isEditing={isCustomizing}
        onLayoutChange={updateLayout}
        onWidgetRemove={removeWidget}
        onWidgetConfigure={(widgetId) => {
          router.push(`/dashboard/customize?widget=${widgetId}`);
        }}
      />

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{widgets.length}</p>
          <p className="text-xs text-gray-600">Active Widgets</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {widgets.filter((w) => w.enabled).length}
          </p>
          <p className="text-xs text-gray-600">Enabled</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
          <p className="text-xs text-gray-600">Notifications</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {currentPreset?.name.split(" ")[0] || "Custom"}
          </p>
          <p className="text-xs text-gray-600">Active Preset</p>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * WidgetGrid - Responsive Grid Layout for Dashboard Widgets
 * Manages widget positioning with drag-and-drop support
 */

import { useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DraggableWidget } from "./DraggableWidget";
import { MetricsWidget } from "./widgets/MetricsWidget";
import { TasksWidget } from "./widgets/TasksWidget";
import { AlertsWidget } from "./widgets/AlertsWidget";
import { ScheduleWidget } from "./widgets/ScheduleWidget";
import { PatientsWidget } from "./widgets/PatientsWidget";
import { cn } from "@/lib/utils";
import type { WidgetConfig, WidgetLayout } from "@/stores/dashboard-store";

// ============================================================================
// Types
// ============================================================================

interface WidgetGridProps {
  widgets: WidgetConfig[];
  layouts: WidgetLayout[];
  isEditing?: boolean;
  onLayoutChange?: (layouts: WidgetLayout[]) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetConfigure?: (widgetId: string) => void;
}

// ============================================================================
// Widget Renderer
// ============================================================================

function renderWidgetContent(widget: WidgetConfig): React.ReactNode {
  switch (widget.type) {
    case "metrics":
      return <MetricsWidget />;
    case "tasks":
      return <TasksWidget />;
    case "alerts":
      return <AlertsWidget />;
    case "schedule":
      return <ScheduleWidget />;
    case "patients":
      return <PatientsWidget />;
    default:
      return (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Widget type: {widget.type}</p>
          <p className="text-xs text-gray-400 mt-1">Content not available</p>
        </div>
      );
  }
}

// ============================================================================
// Component
// ============================================================================

export function WidgetGrid({
  widgets,
  layouts,
  isEditing = false,
  onLayoutChange,
  onWidgetRemove,
  onWidgetConfigure,
}: WidgetGridProps) {
  const moveWidget = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (!onLayoutChange) return;

      const newLayouts = [...layouts];
      const [draggedLayout] = newLayouts.splice(dragIndex, 1);
      newLayouts.splice(hoverIndex, 0, draggedLayout);

      onLayoutChange(newLayouts);
    },
    [layouts, onLayoutChange],
  );

  const getLayout = (widgetId: string): WidgetLayout | undefined => {
    return layouts.find((l) => l.id === widgetId);
  };

  const getGridClass = (layout: WidgetLayout): string => {
    return cn(
      // Column span
      layout.w === 12 && "col-span-12",
      layout.w === 6 && "col-span-12 md:col-span-6",
      layout.w === 4 && "col-span-12 md:col-span-6 lg:col-span-4",
      layout.w === 3 && "col-span-12 sm:col-span-6 lg:col-span-3",
      // Row span (height)
      layout.h === 1 && "row-span-1",
      layout.h === 2 && "row-span-2",
      layout.h === 3 && "row-span-3",
      layout.h === 4 && "row-span-4",
    );
  };

  const enabledWidgets = widgets.filter((w) => w.enabled);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {enabledWidgets.map((widget, index) => {
          const layout = getLayout(widget.id);
          if (!layout) return null;

          return (
            <div
              key={widget.id}
              className={cn(
                "min-h-[200px] transition-all duration-200",
                getGridClass(layout),
              )}
            >
              <DraggableWidget
                id={widget.id}
                index={index}
                widget={widget}
                isEditing={isEditing}
                onMove={moveWidget}
                onRemove={onWidgetRemove}
                onConfigure={onWidgetConfigure}
              >
                {renderWidgetContent(widget)}
              </DraggableWidget>
            </div>
          );
        })}

        {/* Empty State */}
        {enabledWidgets.length === 0 && (
          <div className="col-span-12 flex items-center justify-center py-16 text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">
                No widgets added
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? "Select a preset or add widgets to customize your dashboard"
                  : "Your dashboard is empty. Click customize to add widgets."}
              </p>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

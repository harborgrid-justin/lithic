'use client';

import { useState, useCallback } from 'react';
import { Trash2, Edit, GripVertical, Maximize2 } from 'lucide-react';
import { Widget, LayoutItem } from '@/services/analytics.service';

interface DashboardGridProps {
  widgets: Widget[];
  layout: LayoutItem[];
  editable?: boolean;
  onLayoutChange?: (layout: LayoutItem[]) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetEdit?: (widget: Widget) => void;
  onWidgetClick?: (widget: Widget) => void;
  renderWidget: (widget: Widget) => React.ReactNode;
}

export function DashboardGrid({
  widgets,
  layout,
  editable = false,
  onLayoutChange,
  onWidgetRemove,
  onWidgetEdit,
  onWidgetClick,
  renderWidget,
}: DashboardGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>(layout);

  const handleDragStart = useCallback((widgetId: string, e: React.DragEvent) => {
    if (!editable) return;
    setIsDragging(true);
    setDraggedItem(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, [editable]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
  }, []);

  const handleDrop = useCallback((targetWidgetId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !editable || draggedItem === targetWidgetId) return;

    const newLayout = [...currentLayout];
    const draggedIndex = newLayout.findIndex(item => item.widgetId === draggedItem);
    const targetIndex = newLayout.findIndex(item => item.widgetId === targetWidgetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Swap positions
      const temp = { ...newLayout[draggedIndex] };
      newLayout[draggedIndex] = {
        ...newLayout[draggedIndex],
        x: newLayout[targetIndex].x,
        y: newLayout[targetIndex].y,
      };
      newLayout[targetIndex] = {
        ...newLayout[targetIndex],
        x: temp.x,
        y: temp.y,
      };

      setCurrentLayout(newLayout);
      onLayoutChange?.(newLayout);
    }

    setIsDragging(false);
    setDraggedItem(null);
  }, [draggedItem, editable, currentLayout, onLayoutChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const getGridPosition = (item: LayoutItem): React.CSSProperties => {
    // Simple grid layout with 12 columns
    const columnWidth = 100 / 12;
    const rowHeight = 100; // pixels

    return {
      gridColumn: `span ${item.w}`,
      gridRow: `span ${item.h}`,
      minHeight: `${item.h * rowHeight}px`,
    };
  };

  const getWidget = (widgetId: string) => {
    return widgets.find(w => w.id === widgetId);
  };

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-fr">
      {currentLayout.map((layoutItem) => {
        const widget = getWidget(layoutItem.widgetId);
        if (!widget) return null;

        return (
          <div
            key={widget.id}
            style={getGridPosition(layoutItem)}
            className={`relative ${
              isDragging && draggedItem === widget.id ? 'opacity-50' : ''
            }`}
            draggable={editable}
            onDragStart={(e) => handleDragStart(widget.id, e)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(widget.id, e)}
            onDragOver={handleDragOver}
          >
            <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Widget Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {editable && (
                    <GripVertical
                      className="w-5 h-5 text-gray-400 cursor-move flex-shrink-0"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900 truncate">
                    {widget.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onWidgetClick && (
                    <button
                      onClick={() => onWidgetClick(widget)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Expand"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  {editable && onWidgetEdit && (
                    <button
                      onClick={() => onWidgetEdit(widget)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  {editable && onWidgetRemove && (
                    <button
                      onClick={() => onWidgetRemove(widget.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Widget Content */}
              <div className="p-4 h-[calc(100%-57px)] overflow-auto">
                {widget.description && (
                  <p className="text-sm text-gray-500 mb-3">
                    {widget.description}
                  </p>
                )}
                {renderWidget(widget)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {currentLayout.length === 0 && (
        <div className="col-span-12 flex items-center justify-center py-16 text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No widgets added</p>
            <p className="text-sm mt-1">
              {editable
                ? 'Add widgets from the library to get started'
                : 'This dashboard is empty'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

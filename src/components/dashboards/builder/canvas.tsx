/**
 * Dashboard Builder Canvas
 * Drag-drop canvas with grid layout and widget resize
 */

'use client';

import React, { useState } from 'react';
import { Plus, Settings, Trash2, Copy, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { WidgetConfig } from '@/lib/dashboards/engine/dashboard-builder';

export interface DashboardCanvasProps {
  widgets: WidgetConfig[];
  onWidgetUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetRemove: (widgetId: string) => void;
  onWidgetClone: (widgetId: string) => void;
  onWidgetSelect: (widgetId: string) => void;
  selectedWidgetId?: string;
  gridColumns?: number;
}

export function DashboardCanvas({
  widgets,
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetClone,
  onWidgetSelect,
  selectedWidgetId,
  gridColumns = 12,
}: DashboardCanvasProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleDrop = (targetX: number, targetY: number) => {
    if (!draggedWidget) return;

    onWidgetUpdate(draggedWidget, {
      position: {
        ...widgets.find(w => w.id === draggedWidget)!.position,
        x: targetX,
        y: targetY,
      },
    });
  };

  // Calculate grid cell size
  const cellWidth = 100 / gridColumns;

  // Sort widgets by position for rendering
  const sortedWidgets = [...widgets].sort((a, b) => {
    if (a.position.y === b.position.y) {
      return a.position.x - b.position.x;
    }
    return a.position.y - b.position.y;
  });

  return (
    <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-screen p-4">
      {/* Grid visualization */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: '0.5rem',
          }}
        >
          {Array.from({ length: gridColumns * 20 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 bg-white/50"
            />
          ))}
        </div>
      </div>

      {/* Widgets */}
      <div className="relative z-10">
        {sortedWidgets.map(widget => (
          <WidgetPlaceholder
            key={widget.id}
            widget={widget}
            isSelected={widget.id === selectedWidgetId}
            isDragging={widget.id === draggedWidget}
            cellWidth={cellWidth}
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
            onSelect={() => onWidgetSelect(widget.id)}
            onConfigure={() => onWidgetSelect(widget.id)}
            onRemove={() => onWidgetRemove(widget.id)}
            onClone={() => onWidgetClone(widget.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No widgets yet
            </h3>
            <p className="text-gray-600">
              Add widgets from the sidebar to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface WidgetPlaceholderProps {
  widget: WidgetConfig;
  isSelected: boolean;
  isDragging: boolean;
  cellWidth: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSelect: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  onClone: () => void;
}

function WidgetPlaceholder({
  widget,
  isSelected,
  isDragging,
  cellWidth,
  onDragStart,
  onDragEnd,
  onSelect,
  onConfigure,
  onRemove,
  onClone,
}: WidgetPlaceholderProps) {
  return (
    <div
      className={`absolute transition-all ${
        isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
      } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
      style={{
        left: `${widget.position.x * cellWidth}%`,
        top: `${widget.position.y * 100}px`,
        width: `calc(${widget.position.w * cellWidth}% - 0.5rem)`,
        height: `${widget.position.h * 100}px`,
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <Card className="h-full flex flex-col">
        {/* Widget header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {widget.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClone();
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Widget content placeholder */}
        <div className="flex-1 p-4 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-sm font-medium mb-1">{widget.type}</div>
            <div className="text-xs">
              {widget.position.w}x{widget.position.h} grid
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

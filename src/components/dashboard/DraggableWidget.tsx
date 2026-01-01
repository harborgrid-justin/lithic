"use client";

/**
 * DraggableWidget - Draggable and Resizable Widget Wrapper
 * Wraps widgets with drag-and-drop and resize capabilities
 */

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { GripVertical, X, Maximize2, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/stores/dashboard-store";

// ============================================================================
// Types
// ============================================================================

interface DraggableWidgetProps {
  id: string;
  index: number;
  widget: WidgetConfig;
  isEditing?: boolean;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onRemove?: (widgetId: string) => void;
  onConfigure?: (widgetId: string) => void;
  children: React.ReactNode;
}

interface DragItem {
  type: string;
  id: string;
  index: number;
}

const WIDGET_TYPE = "DASHBOARD_WIDGET";

// ============================================================================
// Component
// ============================================================================

export function DraggableWidget({
  id,
  index,
  widget,
  isEditing = false,
  onMove,
  onRemove,
  onConfigure,
  children,
}: DraggableWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Drag setup
  const [{ isDragging }, drag, preview] = useDrag({
    type: WIDGET_TYPE,
    item: () => ({ type: WIDGET_TYPE, id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditing,
  });

  // Drop setup
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: WIDGET_TYPE,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove?.(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    canDrop: () => isEditing,
  });

  // Combine drag and drop refs
  drag(drop(ref));

  return (
    <div
      ref={preview}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50",
        isOver && "scale-105",
      )}
    >
      <Card
        className={cn(
          "overflow-hidden border-gray-200 hover:shadow-lg transition-shadow",
          isEditing && "border-2 border-dashed border-blue-400",
        )}
      >
        {/* Widget Header */}
        <div
          className={cn(
            "px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between",
            isEditing && "bg-blue-50",
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditing && (
              <div
                ref={ref}
                className="cursor-move text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-5 h-5" />
              </div>
            )}
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {widget.title}
            </h3>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-200"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </Button>
            )}

            {isEditing && (
              <>
                {onConfigure && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    onClick={() => onConfigure(widget.id)}
                    title="Configure widget"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                  </Button>
                )}

                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100"
                    onClick={() => onRemove(widget.id)}
                    title="Remove widget"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </>
            )}

            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Refresh</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                  <DropdownMenuItem>Configure</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Widget Content */}
        <div className="p-4">{children}</div>
      </Card>

      {/* Edit Mode Overlay */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Edit Mode
          </div>
        </div>
      )}
    </div>
  );
}

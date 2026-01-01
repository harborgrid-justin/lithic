/**
 * Whiteboard Canvas Component
 * Interactive whiteboard with drawing tools
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { CanvasEngine } from "@/lib/collaboration/whiteboard/canvas-engine";
import { WhiteboardSyncManager } from "@/lib/collaboration/whiteboard/sync-manager";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Square,
  Circle,
  Type,
  Eraser,
  Undo,
  Redo,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface WhiteboardCanvasProps {
  whiteboardId: string;
  userId: string;
  onSave?: () => void;
}

export function WhiteboardCanvas({
  whiteboardId,
  userId,
  onSave,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasEngine, setCanvasEngine] = useState<CanvasEngine | null>(null);
  const [activeTool, setActiveTool] = useState<string>("FREEHAND");

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new CanvasEngine(canvasRef.current);
      setCanvasEngine(engine);

      return () => {
        // Cleanup
      };
    }
  }, []);

  const selectTool = (tool: string) => {
    setActiveTool(tool);
    if (canvasEngine) {
      canvasEngine.setTool({
        type: tool as any,
        config: {
          strokeColor: "#000000",
          strokeWidth: 2,
          opacity: 1,
        },
      });
    }
  };

  const handleZoomIn = () => {
    if (canvasEngine) {
      canvasEngine.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (canvasEngine) {
      canvasEngine.zoom(0.8);
    }
  };

  const handleExport = () => {
    if (canvasEngine) {
      const imageData = canvasEngine.exportAsImage("png");
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `whiteboard-${whiteboardId}.png`;
      link.click();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b bg-white p-4">
        <Button
          variant={activeTool === "FREEHAND" ? "default" : "ghost"}
          size="icon"
          onClick={() => selectTool("FREEHAND")}
        >
          <Pen className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTool === "RECTANGLE" ? "default" : "ghost"}
          size="icon"
          onClick={() => selectTool("RECTANGLE")}
        >
          <Square className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTool === "CIRCLE" ? "default" : "ghost"}
          size="icon"
          onClick={() => selectTool("CIRCLE")}
        >
          <Circle className="h-5 w-5" />
        </Button>
        <Button
          variant={activeTool === "TEXT" ? "default" : "ghost"}
          size="icon"
          onClick={() => selectTool("TEXT")}
        >
          <Type className="h-5 w-5" />
        </Button>

        <div className="mx-2 h-6 w-px bg-gray-300" />

        <Button variant="ghost" size="icon">
          <Undo className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Redo className="h-5 w-5" />
        </Button>

        <div className="mx-2 h-6 w-px bg-gray-300" />

        <Button variant="ghost" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExport}>
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

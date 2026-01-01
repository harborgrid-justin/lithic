/**
 * Clinical Whiteboard Canvas Engine
 * Handles canvas rendering, drawing tools, and shape library
 */

import { z } from "zod";

export const ShapeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "FREEHAND",
    "LINE",
    "ARROW",
    "RECTANGLE",
    "CIRCLE",
    "ELLIPSE",
    "TEXT",
    "IMAGE",
    "STICKY_NOTE",
    "CONNECTOR",
  ]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().default(0),
  style: z.object({
    strokeColor: z.string(),
    strokeWidth: z.number(),
    fillColor: z.string().optional(),
    opacity: z.number().default(1),
    lineDash: z.array(z.number()).default([]),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
  }),
  data: z.any(),
  layer: z.number().default(0),
  locked: z.boolean().default(false),
  userId: z.string(),
  userName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Shape = z.infer<typeof ShapeSchema>;

export interface CanvasState {
  shapes: Map<string, Shape>;
  selectedShapes: Set<string>;
  viewportTransform: {
    x: number;
    y: number;
    scale: number;
  };
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

export interface DrawingTool {
  type: Shape["type"];
  config: {
    strokeColor: string;
    strokeWidth: number;
    fillColor?: string;
    opacity: number;
  };
}

export interface Point {
  x: number;
  y: number;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: CanvasState;
  private currentTool: DrawingTool;
  private isDrawing: boolean = false;
  private drawingShape: Shape | null = null;
  private startPoint: Point | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.state = {
      shapes: new Map(),
      selectedShapes: new Set(),
      viewportTransform: { x: 0, y: 0, scale: 1 },
      gridEnabled: false,
      gridSize: 20,
      snapToGrid: false,
    };

    this.currentTool = {
      type: "FREEHAND",
      config: {
        strokeColor: "#000000",
        strokeWidth: 2,
        opacity: 1,
      },
    };

    this.setupEventListeners();
    this.render();
  }

  /**
   * Setup canvas event listeners
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  /**
   * Mouse event handlers
   */
  private handleMouseDown(e: MouseEvent): void {
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    this.startDrawing(point);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    this.continueDrawing(point);
  }

  private handleMouseUp(e: MouseEvent): void {
    const point = this.getCanvasPoint(e.clientX, e.clientY);
    this.finishDrawing(point);
  }

  /**
   * Touch event handlers
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const point = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.startDrawing(point);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDrawing) return;
    const touch = e.touches[0];
    const point = this.getCanvasPoint(touch.clientX, touch.clientY);
    this.continueDrawing(point);
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    if (this.startPoint) {
      this.finishDrawing(this.startPoint);
    }
  }

  /**
   * Zoom/pan handler
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(delta, e.clientX, e.clientY);
    } else {
      // Pan
      this.pan(-e.deltaX, -e.deltaY);
    }
  }

  /**
   * Start drawing
   */
  private startDrawing(point: Point): void {
    this.isDrawing = true;
    this.startPoint = this.state.snapToGrid ? this.snapToGrid(point) : point;

    const shape: Shape = {
      id: this.generateShapeId(),
      type: this.currentTool.type,
      x: this.startPoint.x,
      y: this.startPoint.y,
      rotation: 0,
      style: {
        strokeColor: this.currentTool.config.strokeColor,
        strokeWidth: this.currentTool.config.strokeWidth,
        fillColor: this.currentTool.config.fillColor,
        opacity: this.currentTool.config.opacity,
        lineDash: [],
      },
      data: {},
      layer: 0,
      locked: false,
      userId: "current-user", // Will be replaced with actual user
      userName: "Current User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.currentTool.type === "FREEHAND") {
      shape.data = { points: [this.startPoint] };
    }

    this.drawingShape = shape;
  }

  /**
   * Continue drawing
   */
  private continueDrawing(point: Point): void {
    if (!this.drawingShape || !this.startPoint) return;

    const currentPoint = this.state.snapToGrid ? this.snapToGrid(point) : point;

    if (this.currentTool.type === "FREEHAND") {
      this.drawingShape.data.points.push(currentPoint);
    } else {
      this.drawingShape.width = currentPoint.x - this.startPoint.x;
      this.drawingShape.height = currentPoint.y - this.startPoint.y;
    }

    this.render();
    this.drawShape(this.drawingShape);
  }

  /**
   * Finish drawing
   */
  private finishDrawing(point: Point): void {
    if (!this.drawingShape) return;

    this.isDrawing = false;
    this.state.shapes.set(this.drawingShape.id, this.drawingShape);

    this.emit("shape:created", this.drawingShape);
    this.drawingShape = null;
    this.startPoint = null;

    this.render();
  }

  /**
   * Add shape to canvas
   */
  addShape(shape: Shape): void {
    this.state.shapes.set(shape.id, shape);
    this.render();
    this.emit("shape:added", shape);
  }

  /**
   * Update shape
   */
  updateShape(shapeId: string, updates: Partial<Shape>): void {
    const shape = this.state.shapes.get(shapeId);
    if (!shape) return;

    const updatedShape = { ...shape, ...updates, updatedAt: new Date() };
    this.state.shapes.set(shapeId, updatedShape);
    this.render();
    this.emit("shape:updated", updatedShape);
  }

  /**
   * Delete shape
   */
  deleteShape(shapeId: string): void {
    const shape = this.state.shapes.get(shapeId);
    if (!shape) return;

    this.state.shapes.delete(shapeId);
    this.state.selectedShapes.delete(shapeId);
    this.render();
    this.emit("shape:deleted", shape);
  }

  /**
   * Select shape
   */
  selectShape(shapeId: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.state.selectedShapes.clear();
    }
    this.state.selectedShapes.add(shapeId);
    this.render();
  }

  /**
   * Deselect all shapes
   */
  deselectAll(): void {
    this.state.selectedShapes.clear();
    this.render();
  }

  /**
   * Move shape
   */
  moveShape(shapeId: string, deltaX: number, deltaY: number): void {
    const shape = this.state.shapes.get(shapeId);
    if (!shape || shape.locked) return;

    shape.x += deltaX;
    shape.y += deltaY;
    shape.updatedAt = new Date();

    this.state.shapes.set(shapeId, shape);
    this.render();
    this.emit("shape:moved", shape);
  }

  /**
   * Rotate shape
   */
  rotateShape(shapeId: string, angle: number): void {
    const shape = this.state.shapes.get(shapeId);
    if (!shape || shape.locked) return;

    shape.rotation = (shape.rotation + angle) % 360;
    shape.updatedAt = new Date();

    this.state.shapes.set(shapeId, shape);
    this.render();
    this.emit("shape:rotated", shape);
  }

  /**
   * Set drawing tool
   */
  setTool(tool: DrawingTool): void {
    this.currentTool = tool;
    this.emit("tool:changed", tool);
  }

  /**
   * Pan viewport
   */
  pan(deltaX: number, deltaY: number): void {
    this.state.viewportTransform.x += deltaX;
    this.state.viewportTransform.y += deltaY;
    this.render();
  }

  /**
   * Zoom viewport
   */
  zoom(factor: number, centerX?: number, centerY?: number): void {
    const oldScale = this.state.viewportTransform.scale;
    const newScale = Math.max(0.1, Math.min(10, oldScale * factor));

    if (centerX !== undefined && centerY !== undefined) {
      const point = this.getCanvasPoint(centerX, centerY);
      this.state.viewportTransform.x -= (point.x * (newScale - oldScale)) / newScale;
      this.state.viewportTransform.y -= (point.y * (newScale - oldScale)) / newScale;
    }

    this.state.viewportTransform.scale = newScale;
    this.render();
  }

  /**
   * Reset viewport
   */
  resetViewport(): void {
    this.state.viewportTransform = { x: 0, y: 0, scale: 1 };
    this.render();
  }

  /**
   * Render canvas
   */
  render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply viewport transform
    this.ctx.save();
    this.ctx.translate(
      this.state.viewportTransform.x,
      this.state.viewportTransform.y
    );
    this.ctx.scale(
      this.state.viewportTransform.scale,
      this.state.viewportTransform.scale
    );

    // Draw grid if enabled
    if (this.state.gridEnabled) {
      this.drawGrid();
    }

    // Draw all shapes sorted by layer
    const sortedShapes = Array.from(this.state.shapes.values()).sort(
      (a, b) => a.layer - b.layer
    );

    sortedShapes.forEach((shape) => {
      this.drawShape(shape);

      // Highlight selected shapes
      if (this.state.selectedShapes.has(shape.id)) {
        this.drawSelectionBox(shape);
      }
    });

    this.ctx.restore();
  }

  /**
   * Draw shape
   */
  private drawShape(shape: Shape): void {
    this.ctx.save();

    // Apply shape transform
    this.ctx.translate(shape.x, shape.y);
    this.ctx.rotate((shape.rotation * Math.PI) / 180);

    // Apply style
    this.ctx.strokeStyle = shape.style.strokeColor;
    this.ctx.lineWidth = shape.style.strokeWidth;
    this.ctx.globalAlpha = shape.style.opacity;

    if (shape.style.fillColor) {
      this.ctx.fillStyle = shape.style.fillColor;
    }

    if (shape.style.lineDash.length > 0) {
      this.ctx.setLineDash(shape.style.lineDash);
    }

    // Draw based on type
    switch (shape.type) {
      case "FREEHAND":
        this.drawFreehand(shape);
        break;
      case "LINE":
        this.drawLine(shape);
        break;
      case "ARROW":
        this.drawArrow(shape);
        break;
      case "RECTANGLE":
        this.drawRectangle(shape);
        break;
      case "CIRCLE":
        this.drawCircle(shape);
        break;
      case "ELLIPSE":
        this.drawEllipse(shape);
        break;
      case "TEXT":
        this.drawText(shape);
        break;
      case "IMAGE":
        this.drawImage(shape);
        break;
      case "STICKY_NOTE":
        this.drawStickyNote(shape);
        break;
      case "CONNECTOR":
        this.drawConnector(shape);
        break;
    }

    this.ctx.restore();
  }

  /**
   * Drawing methods for each shape type
   */
  private drawFreehand(shape: Shape): void {
    const points = shape.data.points || [];
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x - shape.x, points[0].y - shape.y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x - shape.x, points[i].y - shape.y);
    }

    this.ctx.stroke();
  }

  private drawLine(shape: Shape): void {
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(shape.width || 0, shape.height || 0);
    this.ctx.stroke();
  }

  private drawArrow(shape: Shape): void {
    const width = shape.width || 0;
    const height = shape.height || 0;

    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(width, height);
    this.ctx.stroke();

    // Draw arrow head
    const angle = Math.atan2(height, width);
    const headLength = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(width, height);
    this.ctx.lineTo(
      width - headLength * Math.cos(angle - Math.PI / 6),
      height - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(width, height);
    this.ctx.lineTo(
      width - headLength * Math.cos(angle + Math.PI / 6),
      height - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawRectangle(shape: Shape): void {
    const width = shape.width || 0;
    const height = shape.height || 0;

    if (shape.style.fillColor) {
      this.ctx.fillRect(0, 0, width, height);
    }
    this.ctx.strokeRect(0, 0, width, height);
  }

  private drawCircle(shape: Shape): void {
    const radius = Math.abs((shape.width || 0) / 2);

    this.ctx.beginPath();
    this.ctx.arc(radius, radius, radius, 0, 2 * Math.PI);

    if (shape.style.fillColor) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  private drawEllipse(shape: Shape): void {
    const radiusX = Math.abs((shape.width || 0) / 2);
    const radiusY = Math.abs((shape.height || 0) / 2);

    this.ctx.beginPath();
    this.ctx.ellipse(radiusX, radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    if (shape.style.fillColor) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  private drawText(shape: Shape): void {
    this.ctx.font = `${shape.style.fontSize || 16}px ${shape.style.fontFamily || "Arial"}`;
    this.ctx.fillText(shape.data.text || "", 0, 0);
  }

  private drawImage(shape: Shape): void {
    if (shape.data.image) {
      this.ctx.drawImage(
        shape.data.image,
        0,
        0,
        shape.width || 100,
        shape.height || 100
      );
    }
  }

  private drawStickyNote(shape: Shape): void {
    const width = shape.width || 150;
    const height = shape.height || 150;

    // Background
    this.ctx.fillStyle = shape.data.color || "#FFEB3B";
    this.ctx.fillRect(0, 0, width, height);

    // Border
    this.ctx.strokeRect(0, 0, width, height);

    // Text
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "14px Arial";
    this.wrapText(shape.data.text || "", 10, 25, width - 20, 18);
  }

  private drawConnector(shape: Shape): void {
    // Draw curved connector between two points
    const startX = 0;
    const startY = 0;
    const endX = shape.width || 0;
    const endY = shape.height || 0;
    const controlX = (startX + endX) / 2;
    const controlY = (startY + endY) / 2 - 50;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    this.ctx.stroke();
  }

  /**
   * Draw selection box
   */
  private drawSelectionBox(shape: Shape): void {
    this.ctx.save();
    this.ctx.strokeStyle = "#0066FF";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    const padding = 5;
    const width = (shape.width || 20) + padding * 2;
    const height = (shape.height || 20) + padding * 2;

    this.ctx.strokeRect(
      shape.x - padding,
      shape.y - padding,
      width,
      height
    );

    this.ctx.restore();
  }

  /**
   * Draw grid
   */
  private drawGrid(): void {
    const gridSize = this.state.gridSize;
    const width = this.canvas.width / this.state.viewportTransform.scale;
    const height = this.canvas.height / this.state.viewportTransform.scale;

    this.ctx.strokeStyle = "#E0E0E0";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Snap point to grid
   */
  private snapToGrid(point: Point): Point {
    const gridSize = this.state.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  /**
   * Get canvas point from screen coordinates
   */
  private getCanvasPoint(screenX: number, screenY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const x =
      (screenX - rect.left - this.state.viewportTransform.x) /
      this.state.viewportTransform.scale;
    const y =
      (screenY - rect.top - this.state.viewportTransform.y) /
      this.state.viewportTransform.scale;
    return { x, y };
  }

  /**
   * Wrap text for multi-line display
   */
  private wrapText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    this.ctx.fillText(line, x, currentY);
  }

  /**
   * Generate shape ID
   */
  private generateShapeId(): string {
    return `shape_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Event emitter
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Export canvas as image
   */
  exportAsImage(format: "png" | "jpeg" = "png"): string {
    return this.canvas.toDataURL(`image/${format}`);
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.state.shapes.clear();
    this.state.selectedShapes.clear();
    this.render();
  }

  /**
   * Get all shapes
   */
  getShapes(): Shape[] {
    return Array.from(this.state.shapes.values());
  }

  /**
   * Toggle grid
   */
  toggleGrid(enabled?: boolean): void {
    this.state.gridEnabled = enabled !== undefined ? enabled : !this.state.gridEnabled;
    this.render();
  }

  /**
   * Toggle snap to grid
   */
  toggleSnapToGrid(enabled?: boolean): void {
    this.state.snapToGrid = enabled !== undefined ? enabled : !this.state.snapToGrid;
  }
}

/**
 * Whiteboard Sync Manager
 * Real-time synchronization using CRDT (Conflict-free Replicated Data Type)
 * Handles conflict resolution and history management
 */

import { Shape } from "./canvas-engine";
import { z } from "zod";

export const OperationSchema = z.object({
  id: z.string(),
  type: z.enum(["CREATE", "UPDATE", "DELETE", "MOVE", "STYLE"]),
  shapeId: z.string(),
  userId: z.string(),
  timestamp: z.number(),
  data: z.any(),
  vectorClock: z.record(z.number()),
});

export type Operation = z.infer<typeof OperationSchema>;

export interface SyncState {
  shapes: Map<string, Shape>;
  operations: Operation[];
  vectorClock: Map<string, number>;
  lastSyncTimestamp: number;
}

export interface HistoryEntry {
  operation: Operation;
  previousState?: any;
  timestamp: number;
}

export class WhiteboardSyncManager {
  private whiteboardId: string;
  private userId: string;
  private state: SyncState;
  private history: HistoryEntry[] = [];
  private maxHistorySize: number = 1000;
  private websocket: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private pendingOperations: Map<string, Operation> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(whiteboardId: string, userId: string) {
    this.whiteboardId = whiteboardId;
    this.userId = userId;

    this.state = {
      shapes: new Map(),
      operations: [],
      vectorClock: new Map(),
      lastSyncTimestamp: Date.now(),
    };

    this.state.vectorClock.set(userId, 0);
  }

  /**
   * Connect to sync server
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        console.log("Whiteboard sync connected");

        // Send join message
        this.send({
          type: "join",
          whiteboardId: this.whiteboardId,
          userId: this.userId,
        });

        // Request initial state
        this.send({
          type: "sync-request",
          whiteboardId: this.whiteboardId,
          vectorClock: Object.fromEntries(this.state.vectorClock),
        });

        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error("Whiteboard sync error:", error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log("Whiteboard sync disconnected");
        this.emit("disconnected");
        this.attemptReconnect(serverUrl);
      };
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(serverUrl: string): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      console.log("Attempting to reconnect...");
      this.connect(serverUrl).catch((error) => {
        console.error("Reconnection failed:", error);
        this.attemptReconnect(serverUrl);
      });
    }, 5000);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    const { type, data } = message;

    switch (type) {
      case "sync-response":
        this.handleSyncResponse(data);
        break;

      case "operation":
        this.handleRemoteOperation(data);
        break;

      case "operations-batch":
        this.handleOperationsBatch(data);
        break;

      case "ack":
        this.handleAcknowledgment(data);
        break;

      default:
        console.warn("Unknown message type:", type);
    }
  }

  /**
   * Handle sync response with initial state
   */
  private handleSyncResponse(data: any): void {
    const { shapes, operations, vectorClock } = data;

    // Update shapes
    shapes.forEach((shape: Shape) => {
      this.state.shapes.set(shape.id, shape);
    });

    // Update operations
    this.state.operations = operations;

    // Merge vector clocks
    Object.entries(vectorClock).forEach(([userId, clock]) => {
      this.state.vectorClock.set(userId, clock as number);
    });

    this.state.lastSyncTimestamp = Date.now();
    this.emit("synced", { shapes: this.getShapes() });
  }

  /**
   * Handle remote operation
   */
  private handleRemoteOperation(operation: Operation): void {
    // Check if we've already applied this operation
    if (this.hasAppliedOperation(operation)) {
      return;
    }

    // Apply operation using CRDT logic
    this.applyOperation(operation);

    // Update vector clock
    this.updateVectorClock(operation);

    // Add to history
    this.addToHistory(operation);

    // Emit event
    this.emit("operation:received", operation);
  }

  /**
   * Handle batch of operations
   */
  private handleOperationsBatch(operations: Operation[]): void {
    operations
      .sort((a, b) => this.compareOperations(a, b))
      .forEach((op) => this.handleRemoteOperation(op));
  }

  /**
   * Handle acknowledgment of sent operation
   */
  private handleAcknowledgment(data: { operationId: string }): void {
    this.pendingOperations.delete(data.operationId);
  }

  /**
   * Create shape
   */
  createShape(shape: Shape): void {
    const operation = this.createOperation("CREATE", shape.id, shape);
    this.applyOperation(operation);
    this.broadcastOperation(operation);
  }

  /**
   * Update shape
   */
  updateShape(shapeId: string, updates: Partial<Shape>): void {
    const operation = this.createOperation("UPDATE", shapeId, updates);
    this.applyOperation(operation);
    this.broadcastOperation(operation);
  }

  /**
   * Delete shape
   */
  deleteShape(shapeId: string): void {
    const operation = this.createOperation("DELETE", shapeId, null);
    this.applyOperation(operation);
    this.broadcastOperation(operation);
  }

  /**
   * Move shape
   */
  moveShape(shapeId: string, x: number, y: number): void {
    const operation = this.createOperation("MOVE", shapeId, { x, y });
    this.applyOperation(operation);
    this.broadcastOperation(operation);
  }

  /**
   * Update shape style
   */
  updateStyle(shapeId: string, style: Partial<Shape["style"]>): void {
    const operation = this.createOperation("STYLE", shapeId, { style });
    this.applyOperation(operation);
    this.broadcastOperation(operation);
  }

  /**
   * Create operation
   */
  private createOperation(
    type: Operation["type"],
    shapeId: string,
    data: any
  ): Operation {
    // Increment local clock
    const currentClock = this.state.vectorClock.get(this.userId) || 0;
    this.state.vectorClock.set(this.userId, currentClock + 1);

    return {
      id: this.generateOperationId(),
      type,
      shapeId,
      userId: this.userId,
      timestamp: Date.now(),
      data,
      vectorClock: Object.fromEntries(this.state.vectorClock),
    };
  }

  /**
   * Apply operation to local state
   */
  private applyOperation(operation: Operation): void {
    const { type, shapeId, data } = operation;

    switch (type) {
      case "CREATE":
        this.state.shapes.set(shapeId, data);
        this.emit("shape:created", data);
        break;

      case "UPDATE": {
        const shape = this.state.shapes.get(shapeId);
        if (shape) {
          const updatedShape = { ...shape, ...data, updatedAt: new Date() };
          this.state.shapes.set(shapeId, updatedShape);
          this.emit("shape:updated", updatedShape);
        }
        break;
      }

      case "DELETE":
        this.state.shapes.delete(shapeId);
        this.emit("shape:deleted", { shapeId });
        break;

      case "MOVE": {
        const shape = this.state.shapes.get(shapeId);
        if (shape) {
          shape.x = data.x;
          shape.y = data.y;
          shape.updatedAt = new Date();
          this.state.shapes.set(shapeId, shape);
          this.emit("shape:moved", shape);
        }
        break;
      }

      case "STYLE": {
        const shape = this.state.shapes.get(shapeId);
        if (shape) {
          shape.style = { ...shape.style, ...data.style };
          shape.updatedAt = new Date();
          this.state.shapes.set(shapeId, shape);
          this.emit("shape:styled", shape);
        }
        break;
      }
    }

    // Add to operations log
    this.state.operations.push(operation);
  }

  /**
   * Broadcast operation to other clients
   */
  private broadcastOperation(operation: Operation): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      // Queue for retry
      this.pendingOperations.set(operation.id, operation);
      return;
    }

    this.send({
      type: "operation",
      whiteboardId: this.whiteboardId,
      operation,
    });

    this.pendingOperations.set(operation.id, operation);
  }

  /**
   * Update vector clock
   */
  private updateVectorClock(operation: Operation): void {
    Object.entries(operation.vectorClock).forEach(([userId, clock]) => {
      const currentClock = this.state.vectorClock.get(userId) || 0;
      this.state.vectorClock.set(userId, Math.max(currentClock, clock));
    });
  }

  /**
   * Check if operation has been applied
   */
  private hasAppliedOperation(operation: Operation): boolean {
    return this.state.operations.some((op) => op.id === operation.id);
  }

  /**
   * Compare operations for ordering (CRDT)
   */
  private compareOperations(a: Operation, b: Operation): number {
    // Compare vector clocks
    const aGreater = this.vectorClockGreaterThan(
      a.vectorClock,
      b.vectorClock
    );
    const bGreater = this.vectorClockGreaterThan(
      b.vectorClock,
      a.vectorClock
    );

    if (aGreater && !bGreater) return 1;
    if (bGreater && !aGreater) return -1;

    // Concurrent operations - use timestamp
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }

    // Same timestamp - use user ID for deterministic ordering
    return a.userId.localeCompare(b.userId);
  }

  /**
   * Check if vector clock A is greater than B
   */
  private vectorClockGreaterThan(
    a: Record<string, number>,
    b: Record<string, number>
  ): boolean {
    let hasGreater = false;

    for (const userId in a) {
      if (a[userId] > (b[userId] || 0)) {
        hasGreater = true;
      } else if (a[userId] < (b[userId] || 0)) {
        return false;
      }
    }

    return hasGreater;
  }

  /**
   * Add operation to history
   */
  private addToHistory(operation: Operation): void {
    this.history.push({
      operation,
      timestamp: Date.now(),
    });

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    const userOperations = this.history
      .filter((entry) => entry.operation.userId === this.userId)
      .reverse();

    if (userOperations.length === 0) return false;

    const lastOperation = userOperations[0].operation;

    // Create inverse operation
    const inverseOperation = this.createInverseOperation(lastOperation);
    if (!inverseOperation) return false;

    this.applyOperation(inverseOperation);
    this.broadcastOperation(inverseOperation);

    return true;
  }

  /**
   * Create inverse operation for undo
   */
  private createInverseOperation(operation: Operation): Operation | null {
    const { type, shapeId, data } = operation;

    switch (type) {
      case "CREATE":
        return this.createOperation("DELETE", shapeId, null);

      case "DELETE":
        return this.createOperation("CREATE", shapeId, data);

      case "UPDATE": {
        const shape = this.state.shapes.get(shapeId);
        if (!shape) return null;
        // Would need to store previous state for proper undo
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Get current shapes
   */
  getShapes(): Shape[] {
    return Array.from(this.state.shapes.values());
  }

  /**
   * Get operation history
   */
  getHistory(limit?: number): HistoryEntry[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return this.history;
  }

  /**
   * Clear whiteboard
   */
  clear(): void {
    const shapeIds = Array.from(this.state.shapes.keys());
    shapeIds.forEach((shapeId) => this.deleteShape(shapeId));
  }

  /**
   * Export state for persistence
   */
  exportState(): {
    shapes: Shape[];
    operations: Operation[];
    vectorClock: Record<string, number>;
  } {
    return {
      shapes: this.getShapes(),
      operations: this.state.operations,
      vectorClock: Object.fromEntries(this.state.vectorClock),
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: {
    shapes: Shape[];
    operations: Operation[];
    vectorClock: Record<string, number>;
  }): void {
    this.state.shapes.clear();
    state.shapes.forEach((shape) => {
      this.state.shapes.set(shape.id, shape);
    });

    this.state.operations = state.operations;

    this.state.vectorClock.clear();
    Object.entries(state.vectorClock).forEach(([userId, clock]) => {
      this.state.vectorClock.set(userId, clock);
    });

    this.emit("state:imported", { shapes: this.getShapes() });
  }

  /**
   * Send message via WebSocket
   */
  private send(message: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
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
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `op_${this.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    connected: boolean;
    pendingOperations: number;
    lastSync: number;
  } {
    return {
      connected: this.websocket?.readyState === WebSocket.OPEN,
      pendingOperations: this.pendingOperations.size,
      lastSync: this.state.lastSyncTimestamp,
    };
  }
}

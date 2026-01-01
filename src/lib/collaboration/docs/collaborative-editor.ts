/**
 * Collaborative Document Editor
 * Real-time text editing with cursor presence and change tracking
 */

import { z } from "zod";

export const DocumentChangeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  type: z.enum(["INSERT", "DELETE", "FORMAT", "REPLACE"]),
  position: z.number(),
  length: z.number().optional(),
  content: z.string().optional(),
  format: z.record(z.any()).optional(),
  timestamp: z.number(),
  vectorClock: z.record(z.number()),
});

export type DocumentChange = z.infer<typeof DocumentChangeSchema>;

export interface CursorPosition {
  userId: string;
  userName: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  color: string;
  timestamp: number;
}

export interface DocumentState {
  content: string;
  changes: DocumentChange[];
  cursors: Map<string, CursorPosition>;
  vectorClock: Map<string, number>;
  version: number;
}

export interface FormatStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right" | "justify";
  listType?: "bullet" | "numbered";
  heading?: 1 | 2 | 3 | 4 | 5 | 6;
}

export class CollaborativeEditor {
  private documentId: string;
  private userId: string;
  private userName: string;
  private state: DocumentState;
  private websocket: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private pendingChanges: Map<string, DocumentChange> = new Map();
  private localCursor: CursorPosition;

  constructor(documentId: string, userId: string, userName: string) {
    this.documentId = documentId;
    this.userId = userId;
    this.userName = userName;

    this.state = {
      content: "",
      changes: [],
      cursors: new Map(),
      vectorClock: new Map(),
      version: 0,
    };

    this.state.vectorClock.set(userId, 0);

    this.localCursor = {
      userId,
      userName,
      position: 0,
      color: this.generateUserColor(userId),
      timestamp: Date.now(),
    };
  }

  /**
   * Connect to collaboration server
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        console.log("Document collaboration connected");

        this.send({
          type: "join",
          documentId: this.documentId,
          userId: this.userId,
          userName: this.userName,
        });

        this.send({
          type: "sync-request",
          documentId: this.documentId,
          version: this.state.version,
        });

        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error("Document collaboration error:", error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log("Document collaboration disconnected");
        this.emit("disconnected");
      };
    });
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

      case "change":
        this.handleRemoteChange(data);
        break;

      case "cursor-update":
        this.handleCursorUpdate(data);
        break;

      case "user-joined":
        this.emit("user:joined", data);
        break;

      case "user-left":
        this.handleUserLeft(data);
        break;

      default:
        console.warn("Unknown message type:", type);
    }
  }

  /**
   * Handle sync response
   */
  private handleSyncResponse(data: any): void {
    const { content, changes, cursors, vectorClock, version } = data;

    this.state.content = content;
    this.state.changes = changes;
    this.state.version = version;

    // Update cursors
    cursors.forEach((cursor: CursorPosition) => {
      if (cursor.userId !== this.userId) {
        this.state.cursors.set(cursor.userId, cursor);
      }
    });

    // Merge vector clocks
    Object.entries(vectorClock).forEach(([userId, clock]) => {
      this.state.vectorClock.set(userId, clock as number);
    });

    this.emit("synced", { content: this.state.content });
  }

  /**
   * Handle remote change
   */
  private handleRemoteChange(change: DocumentChange): void {
    // Skip if already applied
    if (this.hasAppliedChange(change)) {
      return;
    }

    // Apply change
    this.applyChange(change);

    // Update vector clock
    this.updateVectorClock(change);

    // Add to history
    this.state.changes.push(change);

    this.emit("change:remote", { change, content: this.state.content });
  }

  /**
   * Handle cursor update
   */
  private handleCursorUpdate(cursor: CursorPosition): void {
    if (cursor.userId === this.userId) return;

    this.state.cursors.set(cursor.userId, cursor);
    this.emit("cursor:updated", cursor);
  }

  /**
   * Handle user left
   */
  private handleUserLeft(data: { userId: string }): void {
    this.state.cursors.delete(data.userId);
    this.emit("user:left", data);
  }

  /**
   * Insert text at position
   */
  insertText(position: number, content: string): void {
    const change = this.createChange("INSERT", position, content.length, content);
    this.applyChange(change);
    this.broadcastChange(change);
  }

  /**
   * Delete text
   */
  deleteText(position: number, length: number): void {
    const change = this.createChange("DELETE", position, length);
    this.applyChange(change);
    this.broadcastChange(change);
  }

  /**
   * Replace text
   */
  replaceText(position: number, length: number, content: string): void {
    const change = this.createChange("REPLACE", position, length, content);
    this.applyChange(change);
    this.broadcastChange(change);
  }

  /**
   * Format text
   */
  formatText(position: number, length: number, format: FormatStyle): void {
    const change = this.createChange("FORMAT", position, length, undefined, format);
    this.applyChange(change);
    this.broadcastChange(change);
  }

  /**
   * Create change
   */
  private createChange(
    type: DocumentChange["type"],
    position: number,
    length?: number,
    content?: string,
    format?: FormatStyle
  ): DocumentChange {
    // Increment local clock
    const currentClock = this.state.vectorClock.get(this.userId) || 0;
    this.state.vectorClock.set(this.userId, currentClock + 1);

    return {
      id: this.generateChangeId(),
      userId: this.userId,
      userName: this.userName,
      type,
      position,
      length,
      content,
      format,
      timestamp: Date.now(),
      vectorClock: Object.fromEntries(this.state.vectorClock),
    };
  }

  /**
   * Apply change to document
   */
  private applyChange(change: DocumentChange): void {
    const { type, position, length, content } = change;

    switch (type) {
      case "INSERT":
        if (content) {
          this.state.content =
            this.state.content.slice(0, position) +
            content +
            this.state.content.slice(position);
        }
        break;

      case "DELETE":
        if (length) {
          this.state.content =
            this.state.content.slice(0, position) +
            this.state.content.slice(position + length);
        }
        break;

      case "REPLACE":
        if (length && content) {
          this.state.content =
            this.state.content.slice(0, position) +
            content +
            this.state.content.slice(position + length);
        }
        break;

      case "FORMAT":
        // Format changes don't modify content, just metadata
        // Would be handled by rich text editor
        break;
    }

    this.state.version++;
  }

  /**
   * Broadcast change to other clients
   */
  private broadcastChange(change: DocumentChange): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.pendingChanges.set(change.id, change);
      return;
    }

    this.send({
      type: "change",
      documentId: this.documentId,
      change,
    });

    this.pendingChanges.set(change.id, change);
  }

  /**
   * Update cursor position
   */
  updateCursor(position: number, selection?: { start: number; end: number }): void {
    this.localCursor.position = position;
    this.localCursor.selection = selection;
    this.localCursor.timestamp = Date.now();

    this.send({
      type: "cursor-update",
      documentId: this.documentId,
      cursor: this.localCursor,
    });

    this.emit("cursor:local", this.localCursor);
  }

  /**
   * Get text content
   */
  getContent(): string {
    return this.state.content;
  }

  /**
   * Get all cursors
   */
  getCursors(): CursorPosition[] {
    return Array.from(this.state.cursors.values());
  }

  /**
   * Get change history
   */
  getHistory(limit?: number): DocumentChange[] {
    if (limit) {
      return this.state.changes.slice(-limit);
    }
    return this.state.changes;
  }

  /**
   * Search in document
   */
  search(query: string, caseSensitive: boolean = false): number[] {
    const positions: number[] = [];
    const content = caseSensitive ? this.state.content : this.state.content.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    let position = 0;

    while (position < content.length) {
      const index = content.indexOf(searchQuery, position);
      if (index === -1) break;

      positions.push(index);
      position = index + 1;
    }

    return positions;
  }

  /**
   * Replace all occurrences
   */
  replaceAll(search: string, replace: string): number {
    const positions = this.search(search, true);

    // Apply replacements from end to start to maintain positions
    positions.reverse().forEach((position) => {
      this.replaceText(position, search.length, replace);
    });

    return positions.length;
  }

  /**
   * Export document
   */
  exportDocument(format: "text" | "html" | "markdown" = "text"): string {
    switch (format) {
      case "text":
        return this.state.content;

      case "html":
        // Convert to HTML (simplified)
        return `<div>${this.state.content.replace(/\n/g, "<br>")}</div>`;

      case "markdown":
        // Convert to Markdown (simplified)
        return this.state.content;

      default:
        return this.state.content;
    }
  }

  /**
   * Check if change has been applied
   */
  private hasAppliedChange(change: DocumentChange): boolean {
    return this.state.changes.some((c) => c.id === change.id);
  }

  /**
   * Update vector clock
   */
  private updateVectorClock(change: DocumentChange): void {
    Object.entries(change.vectorClock).forEach(([userId, clock]) => {
      const currentClock = this.state.vectorClock.get(userId) || 0;
      this.state.vectorClock.set(userId, Math.max(currentClock, clock));
    });
  }

  /**
   * Generate user color
   */
  private generateUserColor(userId: string): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B739",
      "#52B788",
    ];

    const hash = userId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
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
   * Generate change ID
   */
  private generateChangeId(): string {
    return `change_${this.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.websocket) {
      this.send({
        type: "leave",
        documentId: this.documentId,
        userId: this.userId,
      });

      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Get document state for persistence
   */
  getState(): {
    content: string;
    version: number;
    changes: DocumentChange[];
  } {
    return {
      content: this.state.content,
      version: this.state.version,
      changes: this.state.changes,
    };
  }
}

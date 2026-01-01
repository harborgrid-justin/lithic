/**
 * Awareness Manager
 * Handles cursor awareness, selection awareness, and typing indicators for collaborative editing
 */

import { z } from "zod";

export const CursorAwarenessSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  color: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  selection: z.object({
    start: z.object({
      x: z.number(),
      y: z.number(),
    }),
    end: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }).optional(),
  timestamp: z.number(),
});

export type CursorAwareness = z.infer<typeof CursorAwarenessSchema>;

export interface SelectionRange {
  start: number;
  end: number;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  location: string;
  isTyping: boolean;
  timestamp: number;
}

export class AwarenessManager {
  private cursors: Map<string, CursorAwareness> = new Map();
  private selections: Map<string, SelectionRange> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private websocket: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private currentUserId: string;
  private currentLocation: string;
  private typingTimeout: NodeJS.Timeout | null = null;

  constructor(userId: string, location: string) {
    this.currentUserId = userId;
    this.currentLocation = location;
  }

  /**
   * Connect to awareness server
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        console.log("Awareness connection established");

        this.send({
          type: "awareness:join",
          userId: this.currentUserId,
          location: this.currentLocation,
        });

        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error("Awareness connection error:", error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log("Awareness connection closed");
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
      case "awareness:cursors":
        this.handleCursorsList(data);
        break;

      case "awareness:cursor-update":
        this.handleCursorUpdate(data);
        break;

      case "awareness:cursor-remove":
        this.handleCursorRemove(data);
        break;

      case "awareness:selection-update":
        this.handleSelectionUpdate(data);
        break;

      case "awareness:typing":
        this.handleTypingIndicator(data);
        break;

      default:
        console.warn("Unknown awareness message type:", type);
    }
  }

  /**
   * Handle cursors list
   */
  private handleCursorsList(cursors: CursorAwareness[]): void {
    cursors.forEach((cursor) => {
      if (cursor.userId !== this.currentUserId) {
        this.cursors.set(cursor.userId, cursor);
      }
    });

    this.emit("cursors:loaded", Array.from(this.cursors.values()));
  }

  /**
   * Handle cursor update
   */
  private handleCursorUpdate(cursor: CursorAwareness): void {
    if (cursor.userId === this.currentUserId) return;

    this.cursors.set(cursor.userId, cursor);
    this.emit("cursor:updated", cursor);
  }

  /**
   * Handle cursor remove
   */
  private handleCursorRemove(data: { userId: string }): void {
    this.cursors.delete(data.userId);
    this.emit("cursor:removed", data.userId);
  }

  /**
   * Handle selection update
   */
  private handleSelectionUpdate(data: { userId: string; selection: SelectionRange }): void {
    if (data.userId === this.currentUserId) return;

    this.selections.set(data.userId, data.selection);
    this.emit("selection:updated", data);
  }

  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(indicator: TypingIndicator): void {
    if (indicator.userId === this.currentUserId) return;

    if (indicator.isTyping) {
      this.typingIndicators.set(indicator.userId, indicator);
      this.emit("typing:started", indicator);
    } else {
      this.typingIndicators.delete(indicator.userId);
      this.emit("typing:stopped", indicator);
    }
  }

  /**
   * Update local cursor position
   */
  updateCursor(x: number, y: number, selection?: CursorAwareness["selection"]): void {
    const cursor: CursorAwareness = {
      userId: this.currentUserId,
      userName: "", // Should be set from user context
      color: this.getUserColor(this.currentUserId),
      position: { x, y },
      selection,
      timestamp: Date.now(),
    };

    this.send({
      type: "awareness:cursor-update",
      cursor,
      location: this.currentLocation,
    });
  }

  /**
   * Update selection
   */
  updateSelection(start: number, end: number): void {
    const selection: SelectionRange = { start, end };
    this.selections.set(this.currentUserId, selection);

    this.send({
      type: "awareness:selection-update",
      userId: this.currentUserId,
      selection,
      location: this.currentLocation,
    });
  }

  /**
   * Start typing indicator
   */
  startTyping(): void {
    const indicator: TypingIndicator = {
      userId: this.currentUserId,
      userName: "", // Should be set from user context
      location: this.currentLocation,
      isTyping: true,
      timestamp: Date.now(),
    };

    this.typingIndicators.set(this.currentUserId, indicator);

    this.send({
      type: "awareness:typing",
      indicator,
    });

    // Auto-stop typing after 3 seconds of inactivity
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.typingIndicators.delete(this.currentUserId);

    this.send({
      type: "awareness:typing",
      indicator: {
        userId: this.currentUserId,
        userName: "",
        location: this.currentLocation,
        isTyping: false,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get all cursors
   */
  getAllCursors(): CursorAwareness[] {
    return Array.from(this.cursors.values());
  }

  /**
   * Get cursor for user
   */
  getUserCursor(userId: string): CursorAwareness | undefined {
    return this.cursors.get(userId);
  }

  /**
   * Get all selections
   */
  getAllSelections(): Map<string, SelectionRange> {
    return new Map(this.selections);
  }

  /**
   * Get selection for user
   */
  getUserSelection(userId: string): SelectionRange | undefined {
    return this.selections.get(userId);
  }

  /**
   * Get typing users
   */
  getTypingUsers(): TypingIndicator[] {
    return Array.from(this.typingIndicators.values()).filter(
      (indicator) => indicator.userId !== this.currentUserId
    );
  }

  /**
   * Check if user is typing
   */
  isUserTyping(userId: string): boolean {
    const indicator = this.typingIndicators.get(userId);
    return indicator?.isTyping || false;
  }

  /**
   * Get typing users text
   */
  getTypingText(): string {
    const typing = this.getTypingUsers();

    if (typing.length === 0) {
      return "";
    } else if (typing.length === 1) {
      return `${typing[0].userName} is typing...`;
    } else if (typing.length === 2) {
      return `${typing[0].userName} and ${typing[1].userName} are typing...`;
    } else {
      return `${typing[0].userName} and ${typing.length - 1} others are typing...`;
    }
  }

  /**
   * Get cursor color for user
   */
  private getUserColor(userId: string): string {
    const colors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#FFA07A", // Salmon
      "#98D8C8", // Mint
      "#F7DC6F", // Yellow
      "#BB8FCE", // Purple
      "#85C1E2", // Sky Blue
      "#F8B739", // Orange
      "#52B788", // Green
    ];

    const hash = userId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Render cursor overlay (for canvas or custom editors)
   */
  renderCursor(cursor: CursorAwareness, container: HTMLElement): HTMLElement {
    const cursorElement = document.createElement("div");
    cursorElement.className = "collaboration-cursor";
    cursorElement.style.position = "absolute";
    cursorElement.style.pointerEvents = "none";
    cursorElement.style.zIndex = "1000";

    if (cursor.position) {
      cursorElement.style.left = `${cursor.position.x}px`;
      cursorElement.style.top = `${cursor.position.y}px`;
    }

    // Cursor pointer
    const pointer = document.createElement("div");
    pointer.style.width = "2px";
    pointer.style.height = "20px";
    pointer.style.backgroundColor = cursor.color;
    pointer.style.position = "relative";
    cursorElement.appendChild(pointer);

    // User name label
    const label = document.createElement("div");
    label.textContent = cursor.userName;
    label.style.position = "absolute";
    label.style.top = "-20px";
    label.style.left = "0";
    label.style.padding = "2px 6px";
    label.style.backgroundColor = cursor.color;
    label.style.color = "#FFFFFF";
    label.style.fontSize = "12px";
    label.style.borderRadius = "3px";
    label.style.whiteSpace = "nowrap";
    cursorElement.appendChild(label);

    // Selection highlight
    if (cursor.selection) {
      const selection = document.createElement("div");
      selection.style.position = "absolute";
      selection.style.backgroundColor = cursor.color;
      selection.style.opacity = "0.2";
      selection.style.pointerEvents = "none";
      selection.style.left = `${cursor.selection.start.x}px`;
      selection.style.top = `${cursor.selection.start.y}px`;
      selection.style.width = `${cursor.selection.end.x - cursor.selection.start.x}px`;
      selection.style.height = `${cursor.selection.end.y - cursor.selection.start.y}px`;
      cursorElement.appendChild(selection);
    }

    container.appendChild(cursorElement);
    return cursorElement;
  }

  /**
   * Clear all cursors
   */
  clearCursors(): void {
    this.cursors.clear();
    this.selections.clear();
    this.emit("cursors:cleared");
  }

  /**
   * Update location
   */
  updateLocation(location: string): void {
    this.currentLocation = location;

    this.send({
      type: "awareness:location-change",
      userId: this.currentUserId,
      oldLocation: this.currentLocation,
      newLocation: location,
    });

    // Clear local state
    this.clearCursors();
    this.typingIndicators.clear();
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
   * Disconnect
   */
  disconnect(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    if (this.websocket) {
      this.send({
        type: "awareness:leave",
        userId: this.currentUserId,
        location: this.currentLocation,
      });

      this.websocket.close();
      this.websocket = null;
    }

    this.clearCursors();
    this.typingIndicators.clear();
  }

  /**
   * Get awareness statistics
   */
  getStats(): {
    activeCursors: number;
    activeSelections: number;
    typingUsers: number;
  } {
    return {
      activeCursors: this.cursors.size,
      activeSelections: this.selections.size,
      typingUsers: this.typingIndicators.size,
    };
  }
}

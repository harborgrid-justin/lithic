/**
 * Presence Manager
 * Tracks user presence, status, and activity indicators
 */

import { z } from "zod";

export const UserPresenceSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  avatar: z.string().optional(),
  status: z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]),
  lastSeen: z.date(),
  currentLocation: z.object({
    type: z.enum(["ROOM", "DOCUMENT", "WHITEBOARD", "PAGE"]),
    id: z.string(),
    name: z.string(),
  }).optional(),
  device: z.object({
    type: z.enum(["desktop", "mobile", "tablet"]),
    browser: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export type UserPresence = z.infer<typeof UserPresenceSchema>;

export interface ActivityIndicator {
  userId: string;
  type: "TYPING" | "VIEWING" | "EDITING" | "IDLE";
  location: string;
  timestamp: number;
}

export class PresenceManager {
  private presences: Map<string, UserPresence> = new Map();
  private activities: Map<string, ActivityIndicator> = new Map();
  private websocket: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private currentUserId: string;

  constructor(userId: string) {
    this.currentUserId = userId;
    this.setupInactivityDetection();
  }

  /**
   * Connect to presence server
   */
  async connect(serverUrl: string, userInfo: Omit<UserPresence, "status" | "lastSeen">): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(serverUrl);

      this.websocket.onopen = () => {
        console.log("Presence connection established");

        // Send initial presence
        this.send({
          type: "presence:update",
          presence: {
            ...userInfo,
            status: "ONLINE",
            lastSeen: new Date(),
          },
        });

        // Start heartbeat
        this.startHeartbeat();

        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error("Presence connection error:", error);
        reject(error);
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log("Presence connection closed");
        this.stopHeartbeat();
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
      case "presence:list":
        this.handlePresenceList(data);
        break;

      case "presence:update":
        this.handlePresenceUpdate(data);
        break;

      case "presence:remove":
        this.handlePresenceRemove(data);
        break;

      case "activity:update":
        this.handleActivityUpdate(data);
        break;

      default:
        console.warn("Unknown presence message type:", type);
    }
  }

  /**
   * Handle presence list
   */
  private handlePresenceList(presences: UserPresence[]): void {
    presences.forEach((presence) => {
      this.presences.set(presence.userId, presence);
    });

    this.emit("presences:loaded", Array.from(this.presences.values()));
  }

  /**
   * Handle presence update
   */
  private handlePresenceUpdate(presence: UserPresence): void {
    this.presences.set(presence.userId, presence);
    this.emit("presence:updated", presence);

    // Update activity if user became active
    if (presence.status === "ONLINE") {
      this.emit("user:online", presence);
    } else if (presence.status === "OFFLINE") {
      this.emit("user:offline", presence);
    }
  }

  /**
   * Handle presence remove
   */
  private handlePresenceRemove(data: { userId: string }): void {
    const presence = this.presences.get(data.userId);
    this.presences.delete(data.userId);
    this.activities.delete(data.userId);

    if (presence) {
      this.emit("presence:removed", presence);
    }
  }

  /**
   * Handle activity update
   */
  private handleActivityUpdate(activity: ActivityIndicator): void {
    this.activities.set(activity.userId, activity);
    this.emit("activity:updated", activity);
  }

  /**
   * Update current user status
   */
  updateStatus(status: UserPresence["status"]): void {
    this.send({
      type: "presence:update",
      presence: {
        userId: this.currentUserId,
        status,
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Update current location
   */
  updateLocation(location: UserPresence["currentLocation"]): void {
    this.send({
      type: "presence:update",
      presence: {
        userId: this.currentUserId,
        currentLocation: location,
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Set activity
   */
  setActivity(type: ActivityIndicator["type"], location: string): void {
    const activity: ActivityIndicator = {
      userId: this.currentUserId,
      type,
      location,
      timestamp: Date.now(),
    };

    this.activities.set(this.currentUserId, activity);

    this.send({
      type: "activity:update",
      activity,
    });

    // Reset inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Clear activity
   */
  clearActivity(): void {
    this.activities.delete(this.currentUserId);

    this.send({
      type: "activity:clear",
      userId: this.currentUserId,
    });
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: string): UserPresence | undefined {
    return this.presences.get(userId);
  }

  /**
   * Get all presences
   */
  getAllPresences(): UserPresence[] {
    return Array.from(this.presences.values());
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presences.values()).filter(
      (p) => p.status === "ONLINE" || p.status === "BUSY"
    );
  }

  /**
   * Get users in location
   */
  getUsersInLocation(locationType: string, locationId: string): UserPresence[] {
    return Array.from(this.presences.values()).filter(
      (p) =>
        p.currentLocation?.type === locationType &&
        p.currentLocation?.id === locationId
    );
  }

  /**
   * Get user activity
   */
  getUserActivity(userId: string): ActivityIndicator | undefined {
    return this.activities.get(userId);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const presence = this.presences.get(userId);
    return presence?.status === "ONLINE" || presence?.status === "BUSY";
  }

  /**
   * Check if user is typing
   */
  isUserTyping(userId: string, location: string): boolean {
    const activity = this.activities.get(userId);
    return activity?.type === "TYPING" && activity?.location === location;
  }

  /**
   * Get typing users in location
   */
  getTypingUsers(location: string): UserPresence[] {
    const typingUserIds = Array.from(this.activities.values())
      .filter((a) => a.type === "TYPING" && a.location === location)
      .map((a) => a.userId);

    return typingUserIds
      .map((id) => this.presences.get(id))
      .filter((p): p is UserPresence => p !== undefined);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: "heartbeat",
        userId: this.currentUserId,
        timestamp: Date.now(),
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Setup inactivity detection
   */
  private setupInactivityDetection(): void {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      document.addEventListener(event, () => {
        this.resetInactivityTimer();
      });
    });

    this.resetInactivityTimer();
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Set status to ONLINE
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.updateStatus("ONLINE");
    }

    // Set to AWAY after 5 minutes of inactivity
    this.inactivityTimer = setTimeout(() => {
      this.updateStatus("AWAY");
    }, 5 * 60 * 1000);
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
    this.stopHeartbeat();

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.websocket) {
      this.send({
        type: "presence:offline",
        userId: this.currentUserId,
      });

      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Get presence statistics
   */
  getStats(): {
    total: number;
    online: number;
    away: number;
    busy: number;
    offline: number;
  } {
    const presences = Array.from(this.presences.values());

    return {
      total: presences.length,
      online: presences.filter((p) => p.status === "ONLINE").length,
      away: presences.filter((p) => p.status === "AWAY").length,
      busy: presences.filter((p) => p.status === "BUSY").length,
      offline: presences.filter((p) => p.status === "OFFLINE").length,
    };
  }
}

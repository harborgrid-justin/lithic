/**
 * WebSocket Server
 *
 * Real-time communication server for healthcare events
 */

import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../utils/logger";
import { EventEmitter } from "events";

// Client Connection
export interface SocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  roles?: string[];
  subscriptions: Set<string>;
  authenticated: boolean;
  connectedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

// Message Types
export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

/**
 * WebSocket Manager
 */
export class SocketManager extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<string, SocketClient> = new Map();
  private pingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(server: HTTPServer, path: string = "/ws") {
    super();

    this.wss = new WebSocketServer({
      server,
      path,
    });

    this.setupWebSocketServer();
    this.startPingInterval();
    this.startCleanupInterval();

    logger.info("WebSocket server initialized", { path });
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: WebSocket, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on("error", (error) => {
      logger.error("WebSocket server error", { error: error.message });
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = crypto.randomUUID();

    const client: SocketClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      authenticated: false,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);

    logger.info("WebSocket client connected", {
      clientId,
      ip: request.socket.remoteAddress,
    });

    this.emit("connection", client);

    // Send welcome message
    this.sendToClient(client, {
      type: "welcome",
      payload: {
        clientId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Setup message handler
    ws.on("message", (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Setup close handler
    ws.on("close", () => {
      this.handleDisconnect(client);
    });

    // Setup error handler
    ws.on("error", (error) => {
      logger.error("WebSocket client error", {
        clientId,
        error: error.message,
      });
    });

    // Setup pong handler
    ws.on("pong", () => {
      client.lastActivity = new Date();
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(client: SocketClient, data: Buffer): void {
    try {
      const message: SocketMessage = JSON.parse(data.toString());

      client.lastActivity = new Date();

      logger.debug("WebSocket message received", {
        clientId: client.id,
        type: message.type,
      });

      this.emit("message", client, message);
    } catch (error: any) {
      logger.error("Failed to parse WebSocket message", {
        clientId: client.id,
        error: error.message,
      });

      this.sendToClient(client, {
        type: "error",
        payload: {
          error: "Invalid message format",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(client: SocketClient): void {
    logger.info("WebSocket client disconnected", {
      clientId: client.id,
      userId: client.userId,
    });

    this.clients.delete(client.id);
    this.emit("disconnect", client);
  }

  /**
   * Send message to client
   */
  sendToClient(client: SocketClient, message: SocketMessage): boolean {
    if (client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error: any) {
      logger.error("Failed to send message to client", {
        clientId: client.id,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Send message to user (all their connections)
   */
  sendToUser(userId: string, message: SocketMessage): number {
    let sent = 0;

    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        if (this.sendToClient(client, message)) {
          sent++;
        }
      }
    }

    return sent;
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(
    message: SocketMessage,
    filter?: (client: SocketClient) => boolean,
  ): number {
    let sent = 0;

    for (const client of this.clients.values()) {
      if (!filter || filter(client)) {
        if (this.sendToClient(client, message)) {
          sent++;
        }
      }
    }

    logger.debug("Broadcast message sent", {
      type: message.type,
      recipientsCount: sent,
    });

    return sent;
  }

  /**
   * Broadcast to channel (topic)
   */
  broadcastToChannel(channel: string, message: SocketMessage): number {
    return this.broadcast(message, (client) =>
      client.subscriptions.has(channel),
    );
  }

  /**
   * Authenticate client
   */
  authenticateClient(
    clientId: string,
    userId: string,
    roles: string[] = [],
  ): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    client.authenticated = true;
    client.userId = userId;
    client.roles = roles;

    logger.info("Client authenticated", {
      clientId,
      userId,
      roles,
    });

    this.emit("authenticated", client);

    return true;
  }

  /**
   * Subscribe client to channel
   */
  subscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    client.subscriptions.add(channel);

    logger.debug("Client subscribed to channel", {
      clientId,
      userId: client.userId,
      channel,
    });

    this.emit("subscribe", client, channel);

    return true;
  }

  /**
   * Unsubscribe client from channel
   */
  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    client.subscriptions.delete(channel);

    logger.debug("Client unsubscribed from channel", {
      clientId,
      userId: client.userId,
      channel,
    });

    this.emit("unsubscribe", client, channel);

    return true;
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): SocketClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients for a user
   */
  getUserClients(userId: string): SocketClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId,
    );
  }

  /**
   * Get all authenticated clients
   */
  getAuthenticatedClients(): SocketClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.authenticated,
    );
  }

  /**
   * Get clients subscribed to channel
   */
  getChannelClients(channel: string): SocketClient[] {
    return Array.from(this.clients.values()).filter((client) =>
      client.subscriptions.has(channel),
    );
  }

  /**
   * Disconnect client
   */
  disconnectClient(clientId: string, reason?: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    if (reason) {
      this.sendToClient(client, {
        type: "disconnect",
        payload: { reason },
        timestamp: new Date().toISOString(),
      });
    }

    client.ws.close();
    return true;
  }

  /**
   * Start ping interval
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      for (const client of this.clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute timeout

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastActivity.getTime() > timeout) {
          logger.warn("Disconnecting inactive client", {
            clientId,
            lastActivity: client.lastActivity,
          });

          this.disconnectClient(clientId, "Inactivity timeout");
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalClients: number;
    authenticatedClients: number;
    channels: Record<string, number>;
  } {
    const stats = {
      totalClients: this.clients.size,
      authenticatedClients: this.getAuthenticatedClients().length,
      channels: {} as Record<string, number>,
    };

    // Count subscriptions per channel
    for (const client of this.clients.values()) {
      for (const channel of client.subscriptions) {
        stats.channels[channel] = (stats.channels[channel] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Close server
   */
  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.wss.close();
    logger.info("WebSocket server closed");
  }
}

/**
 * Create socket manager
 */
export function createSocketManager(
  server: HTTPServer,
  path?: string,
): SocketManager {
  return new SocketManager(server, path);
}

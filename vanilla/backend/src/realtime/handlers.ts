/**
 * WebSocket Message Handlers
 *
 * Handle incoming WebSocket messages from clients
 */

import { SocketManager, SocketClient, SocketMessage } from "./socket";
import { logger } from "../utils/logger";

/**
 * Setup message handlers
 */
export function setupMessageHandlers(socketManager: SocketManager): void {
  socketManager.on(
    "message",
    (client: SocketClient, message: SocketMessage) => {
      handleMessage(socketManager, client, message);
    },
  );

  logger.info("WebSocket message handlers setup complete");
}

/**
 * Handle incoming message
 */
function handleMessage(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  try {
    switch (message.type) {
      case "auth":
        handleAuth(socketManager, client, message);
        break;

      case "subscribe":
        handleSubscribe(socketManager, client, message);
        break;

      case "unsubscribe":
        handleUnsubscribe(socketManager, client, message);
        break;

      case "ping":
        handlePing(socketManager, client, message);
        break;

      case "heartbeat":
        handleHeartbeat(socketManager, client, message);
        break;

      default:
        logger.warn("Unknown message type", {
          clientId: client.id,
          type: message.type,
        });

        socketManager.sendToClient(client, {
          type: "error",
          payload: {
            error: `Unknown message type: ${message.type}`,
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error: any) {
    logger.error("Error handling message", {
      clientId: client.id,
      messageType: message.type,
      error: error.message,
    });

    socketManager.sendToClient(client, {
      type: "error",
      payload: {
        error: "Internal server error",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle authentication
 */
function handleAuth(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  const { token, userId, roles } = message.payload;

  if (!token) {
    socketManager.sendToClient(client, {
      type: "auth:error",
      payload: {
        error: "Token is required",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // TODO: Validate token with auth service
  // For now, simulate validation
  const isValid = true;

  if (!isValid) {
    socketManager.sendToClient(client, {
      type: "auth:error",
      payload: {
        error: "Invalid token",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Authenticate client
  socketManager.authenticateClient(client.id, userId || "unknown", roles || []);

  socketManager.sendToClient(client, {
    type: "auth:success",
    payload: {
      userId: client.userId,
      roles: client.roles,
    },
    timestamp: new Date().toISOString(),
  });

  logger.info("Client authenticated via WebSocket", {
    clientId: client.id,
    userId: client.userId,
  });
}

/**
 * Handle subscribe request
 */
function handleSubscribe(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  const { channel } = message.payload;

  if (!channel) {
    socketManager.sendToClient(client, {
      type: "subscribe:error",
      payload: {
        error: "Channel is required",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check if client is authenticated for protected channels
  if (channel.startsWith("user:") || channel.startsWith("provider:")) {
    if (!client.authenticated) {
      socketManager.sendToClient(client, {
        type: "subscribe:error",
        payload: {
          error: "Authentication required for this channel",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check authorization
    const channelUserId = channel.split(":")[1];
    if (channelUserId !== client.userId && !client.roles?.includes("admin")) {
      socketManager.sendToClient(client, {
        type: "subscribe:error",
        payload: {
          error: "Not authorized to subscribe to this channel",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Subscribe to channel
  socketManager.subscribe(client.id, channel);

  socketManager.sendToClient(client, {
    type: "subscribe:success",
    payload: {
      channel,
    },
    timestamp: new Date().toISOString(),
  });

  logger.debug("Client subscribed to channel", {
    clientId: client.id,
    userId: client.userId,
    channel,
  });
}

/**
 * Handle unsubscribe request
 */
function handleUnsubscribe(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  const { channel } = message.payload;

  if (!channel) {
    socketManager.sendToClient(client, {
      type: "unsubscribe:error",
      payload: {
        error: "Channel is required",
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  socketManager.unsubscribe(client.id, channel);

  socketManager.sendToClient(client, {
    type: "unsubscribe:success",
    payload: {
      channel,
    },
    timestamp: new Date().toISOString(),
  });

  logger.debug("Client unsubscribed from channel", {
    clientId: client.id,
    userId: client.userId,
    channel,
  });
}

/**
 * Handle ping request
 */
function handlePing(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  socketManager.sendToClient(client, {
    type: "pong",
    payload: {
      timestamp: message.timestamp,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle heartbeat
 */
function handleHeartbeat(
  socketManager: SocketManager,
  client: SocketClient,
  message: SocketMessage,
): void {
  client.lastActivity = new Date();

  socketManager.sendToClient(client, {
    type: "heartbeat:ack",
    payload: {
      clientTime: message.timestamp,
      serverTime: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast system announcement
 */
export function broadcastAnnouncement(
  socketManager: SocketManager,
  announcement: {
    title: string;
    message: string;
    level: "info" | "warning" | "error";
  },
): void {
  socketManager.broadcast({
    type: "announcement",
    payload: announcement,
    timestamp: new Date().toISOString(),
  });

  logger.info("System announcement broadcasted", {
    title: announcement.title,
    level: announcement.level,
  });
}

/**
 * Disconnect idle clients
 */
export function disconnectIdleClients(
  socketManager: SocketManager,
  idleTimeout: number = 300000, // 5 minutes
): number {
  let disconnected = 0;
  const now = Date.now();

  for (const client of socketManager.getAuthenticatedClients()) {
    if (now - client.lastActivity.getTime() > idleTimeout) {
      socketManager.disconnectClient(client.id, "Idle timeout");
      disconnected++;
    }
  }

  if (disconnected > 0) {
    logger.info("Disconnected idle clients", { count: disconnected });
  }

  return disconnected;
}

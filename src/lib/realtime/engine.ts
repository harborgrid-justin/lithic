/**
 * Real-time Engine for Lithic Enterprise Healthcare Platform
 * WebSocket connection management, presence tracking, and room management
 */

import { io, Socket } from 'socket.io-client';
import {
  WebSocketConfig,
  SocketConnection,
  RealtimeEvent,
  RealtimeEventPayload,
  UserPresence,
  PresenceStatus,
} from '@/types/communication';

export class RealtimeEngine {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private connection: SocketConnection;
  private eventHandlers: Map<RealtimeEvent, Set<(payload: any) => void>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: RealtimeEventPayload[] = [];
  private rooms: Set<string> = new Set();
  private presence: Map<string, UserPresence> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...config,
    };

    this.connection = {
      id: '',
      userId: '',
      connected: false,
      reconnectAttempts: 0,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Establish WebSocket connection
   */
  public async connect(userId?: string): Promise<void> {
    if (this.socket?.connected) {
      console.warn('Already connected');
      return;
    }

    if (userId) {
      this.connection.userId = userId;
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.config.url, {
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        reconnectionDelayMax: this.config.reconnectionDelayMax,
        timeout: this.config.timeout,
        auth: {
          userId: this.connection.userId,
        },
        transports: ['websocket', 'polling'],
      });

      this.setupEventHandlers();

      this.socket.on('connect', () => {
        this.connection.connected = true;
        this.connection.lastConnected = new Date();
        this.connection.id = this.socket!.id;
        this.connection.reconnectAttempts = 0;

        console.log('Connected to real-time server:', this.socket!.id);

        // Process queued messages
        this.processMessageQueue();

        // Start heartbeat
        this.startHeartbeat();

        // Emit connected event
        this.emit(RealtimeEvent.CONNECTED, {
          connectionId: this.connection.id,
          userId: this.connection.userId,
        });

        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.emit(RealtimeEvent.ERROR, { error: error.message });
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connection.connected = false;
        this.connection.lastDisconnected = new Date();

        console.log('Disconnected from real-time server:', reason);

        this.stopHeartbeat();

        this.emit(RealtimeEvent.DISCONNECTED, {
          reason,
          userId: this.connection.userId,
        });

        if (reason === 'io server disconnect') {
          // Server disconnected, attempt to reconnect
          this.handleReconnection();
        }
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        this.connection.reconnectAttempts = attemptNumber;
        console.log(`Reconnection attempt ${attemptNumber}`);
        this.emit(RealtimeEvent.RECONNECTING, { attemptNumber });
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        this.connection.reconnectAttempts = 0;
        this.rejoinRooms();
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
        this.emit(RealtimeEvent.ERROR, {
          error: 'Failed to reconnect after maximum attempts',
        });
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.connection.connected = false;
      this.rooms.clear();
      this.presence.clear();
    }
  }

  /**
   * Subscribe to real-time events
   */
  public on<T = any>(event: RealtimeEvent, handler: (payload: T) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event to handlers
   */
  private emit(event: RealtimeEvent, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Send message to server
   */
  public send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue message for later
      this.queueMessage(event, data);
    }
  }

  /**
   * Queue message when disconnected
   */
  private queueMessage(event: string, data: any): void {
    this.messageQueue.push({
      event: event as RealtimeEvent,
      data,
      timestamp: new Date(),
    });

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket?.emit(message.event, message.data);
      }
    }
  }

  /**
   * Join a room/channel
   */
  public joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', { roomId });
      this.rooms.add(roomId);
    }
  }

  /**
   * Leave a room/channel
   */
  public leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', { roomId });
      this.rooms.delete(roomId);
    }
  }

  /**
   * Rejoin all rooms after reconnection
   */
  private rejoinRooms(): void {
    this.rooms.forEach((roomId) => {
      this.socket?.emit('join_room', { roomId });
    });
  }

  /**
   * Update user presence
   */
  public updatePresence(status: PresenceStatus, statusMessage?: string): void {
    const presence: UserPresence = {
      userId: this.connection.userId,
      status,
      lastSeen: new Date(),
      statusMessage,
    };

    this.send('presence_update', presence);
    this.emit(RealtimeEvent.PRESENCE_UPDATE, presence);
  }

  /**
   * Get user presence
   */
  public getPresence(userId: string): UserPresence | undefined {
    return this.presence.get(userId);
  }

  /**
   * Subscribe to presence updates for specific users
   */
  public subscribeToPresence(userIds: string[]): void {
    this.send('subscribe_presence', { userIds });
  }

  /**
   * Unsubscribe from presence updates
   */
  public unsubscribeFromPresence(userIds: string[]): void {
    this.send('unsubscribe_presence', { userIds });
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Presence events
    this.socket.on('presence_update', (data: UserPresence) => {
      this.presence.set(data.userId, data);
      this.emit(RealtimeEvent.PRESENCE_UPDATE, data);

      if (data.status === PresenceStatus.ONLINE) {
        this.emit(RealtimeEvent.USER_ONLINE, data);
      } else if (data.status === PresenceStatus.OFFLINE) {
        this.emit(RealtimeEvent.USER_OFFLINE, data);
      }
    });

    // Message events
    this.socket.on('message_received', (data) => {
      this.emit(RealtimeEvent.MESSAGE_RECEIVED, data);
    });

    this.socket.on('message_updated', (data) => {
      this.emit(RealtimeEvent.MESSAGE_UPDATED, data);
    });

    this.socket.on('message_deleted', (data) => {
      this.emit(RealtimeEvent.MESSAGE_DELETED, data);
    });

    this.socket.on('message_read', (data) => {
      this.emit(RealtimeEvent.MESSAGE_READ, data);
    });

    // Typing events
    this.socket.on('typing_start', (data) => {
      this.emit(RealtimeEvent.TYPING_START, data);
    });

    this.socket.on('typing_stop', (data) => {
      this.emit(RealtimeEvent.TYPING_STOP, data);
    });

    // Conversation events
    this.socket.on('conversation_created', (data) => {
      this.emit(RealtimeEvent.CONVERSATION_CREATED, data);
    });

    this.socket.on('conversation_updated', (data) => {
      this.emit(RealtimeEvent.CONVERSATION_UPDATED, data);
    });

    this.socket.on('participant_joined', (data) => {
      this.emit(RealtimeEvent.PARTICIPANT_JOINED, data);
    });

    this.socket.on('participant_left', (data) => {
      this.emit(RealtimeEvent.PARTICIPANT_LEFT, data);
    });

    // Notification events
    this.socket.on('notification_received', (data) => {
      this.emit(RealtimeEvent.NOTIFICATION_RECEIVED, data);
    });

    // Call events
    this.socket.on('call_incoming', (data) => {
      this.emit(RealtimeEvent.CALL_INCOMING, data);
    });

    this.socket.on('call_accepted', (data) => {
      this.emit(RealtimeEvent.CALL_ACCEPTED, data);
    });

    this.socket.on('call_rejected', (data) => {
      this.emit(RealtimeEvent.CALL_REJECTED, data);
    });

    this.socket.on('call_ended', (data) => {
      this.emit(RealtimeEvent.CALL_ENDED, data);
    });

    this.socket.on('participant_joined_call', (data) => {
      this.emit(RealtimeEvent.PARTICIPANT_JOINED_CALL, data);
    });

    this.socket.on('participant_left_call', (data) => {
      this.emit(RealtimeEvent.PARTICIPANT_LEFT_CALL, data);
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.config.reconnectionDelay! * Math.pow(2, this.connection.reconnectAttempts),
      this.config.reconnectionDelayMax!
    );

    this.reconnectTimer = setTimeout(() => {
      if (!this.socket?.connected && this.connection.reconnectAttempts < this.config.reconnectionAttempts!) {
        console.log('Attempting to reconnect...');
        this.connect();
      }
    }, delay);
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): SocketConnection {
    return { ...this.connection };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connection.connected && this.socket?.connected === true;
  }

  /**
   * Get current rooms
   */
  public getCurrentRooms(): string[] {
    return Array.from(this.rooms);
  }

  /**
   * Clear all event handlers
   */
  public clearEventHandlers(): void {
    this.eventHandlers.clear();
  }
}

// Singleton instance
let realtimeEngine: RealtimeEngine | null = null;

/**
 * Get or create realtime engine instance
 */
export function getRealtimeEngine(config?: WebSocketConfig): RealtimeEngine {
  if (!realtimeEngine && config) {
    realtimeEngine = new RealtimeEngine(config);
  }

  if (!realtimeEngine) {
    throw new Error('RealtimeEngine not initialized. Please provide config on first call.');
  }

  return realtimeEngine;
}

/**
 * Initialize realtime engine
 */
export function initializeRealtimeEngine(config: WebSocketConfig): RealtimeEngine {
  realtimeEngine = new RealtimeEngine(config);
  return realtimeEngine;
}

/**
 * Destroy realtime engine
 */
export function destroyRealtimeEngine(): void {
  if (realtimeEngine) {
    realtimeEngine.disconnect();
    realtimeEngine.clearEventHandlers();
    realtimeEngine = null;
  }
}

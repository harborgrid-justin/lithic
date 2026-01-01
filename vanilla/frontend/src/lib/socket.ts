/**
 * WebSocket Client
 *
 * Frontend WebSocket client for real-time communication
 */

// Message interface
interface SocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

// Event callback
type EventCallback = (payload: any) => void;

// Connection state
type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

/**
 * WebSocket Client
 */
export class SocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private state: ConnectionState = 'disconnected';
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private subscriptions: Set<string> = new Set();

  constructor(url?: string) {
    this.url = url || this.getWebSocketURL();
  }

  /**
   * Get WebSocket URL from environment or construct from window.location
   */
  private getWebSocketURL(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === 'connected' || this.state === 'connecting') {
        resolve();
        return;
      }

      this.state = 'connecting';
      this.token = token || this.token;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Socket] Connected');
          this.state = 'connected';
          this.reconnectAttempts = 0;

          // Authenticate if token is provided
          if (this.token) {
            this.authenticate(this.token);
          }

          // Start heartbeat
          this.startHeartbeat();

          // Resubscribe to channels
          this.resubscribe();

          this.emit('connect', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[Socket] Error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = () => {
          console.log('[Socket] Disconnected');
          this.state = 'disconnected';
          this.stopHeartbeat();
          this.emit('disconnect', {});

          // Attempt reconnection
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[Socket] Connection failed:', error);
        this.state = 'disconnected';
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (!this.ws || this.state === 'disconnected') {
      return;
    }

    this.state = 'disconnecting';
    this.stopHeartbeat();
    this.ws.close();
    this.ws = null;
    this.state = 'disconnected';
  }

  /**
   * Authenticate with token
   */
  private authenticate(token: string): void {
    this.send({
      type: 'auth',
      payload: { token },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send message to server
   */
  private send(message: SocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Socket] Cannot send message, not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: SocketMessage = JSON.parse(data);

      console.log('[Socket] Message received:', message.type);

      // Emit to specific type handlers
      this.emit(message.type, message.payload);

      // Emit to general message handler
      this.emit('message', message);

      // Handle special message types
      switch (message.type) {
        case 'welcome':
          console.log('[Socket] Welcome:', message.payload);
          break;

        case 'auth:success':
          console.log('[Socket] Authenticated');
          this.emit('authenticated', message.payload);
          break;

        case 'auth:error':
          console.error('[Socket] Authentication failed:', message.payload.error);
          break;

        case 'event':
          this.handleEvent(message.payload);
          break;

        case 'error':
          console.error('[Socket] Server error:', message.payload.error);
          break;

        case 'pong':
          // Heartbeat response
          break;

        case 'heartbeat:ack':
          // Heartbeat acknowledged
          break;
      }
    } catch (error) {
      console.error('[Socket] Failed to parse message:', error);
    }
  }

  /**
   * Handle event message
   */
  private handleEvent(eventPayload: any): void {
    const { eventType, data, metadata } = eventPayload;

    console.log('[Socket] Event received:', eventType);

    // Emit to event-specific handlers
    this.emit(`event:${eventType}`, { data, metadata });

    // Emit to general event handler
    this.emit('event', eventPayload);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);

    if (this.state === 'connected') {
      this.send({
        type: 'subscribe',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);

    if (this.state === 'connected') {
      this.send({
        type: 'unsubscribe',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribe(): void {
    for (const channel of this.subscriptions) {
      this.send({
        type: 'subscribe',
        payload: { channel },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Register event handler
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(callback);
  }

  /**
   * Unregister event handler
   */
  off(event: string, callback: EventCallback): void {
    const handlers = this.eventHandlers.get(event);

    if (handlers) {
      handlers.delete(callback);

      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, payload: any): void {
    const handlers = this.eventHandlers.get(event);

    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[Socket] Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'heartbeat',
        payload: {},
        timestamp: new Date().toISOString(),
      });
    }, 30000); // Every 30 seconds
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
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Socket] Max reconnection attempts reached');
      this.emit('reconnect:failed', {});
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay,
    });

    setTimeout(() => {
      this.connect(this.token || undefined);
    }, delay);
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }
}

/**
 * Create and export default socket client instance
 */
export const socketClient = new SocketClient();

/**
 * Helper function to initialize socket with token
 */
export function initializeSocket(token: string): Promise<void> {
  return socketClient.connect(token);
}

/**
 * Helper function to disconnect socket
 */
export function disconnectSocket(): void {
  socketClient.disconnect();
}

/**
 * Export types
 */
export type { EventCallback, ConnectionState };

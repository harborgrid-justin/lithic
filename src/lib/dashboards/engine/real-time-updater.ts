/**
 * Real-Time Updater
 * Manages WebSocket connections, polling fallback, and delta updates for dashboards
 */

import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const UpdateEventSchema = z.object({
  type: z.enum(['full', 'delta', 'append', 'remove']),
  widgetId: z.string(),
  timestamp: z.number(),
  data: z.any(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

export interface UpdateSubscription {
  widgetId: string;
  callback: (event: UpdateEvent) => void;
  filters?: Record<string, any>;
}

export interface ConnectionConfig {
  url: string;
  protocol: 'websocket' | 'sse' | 'polling';
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pollingInterval?: number;
  heartbeatInterval?: number;
}

// ============================================================================
// WebSocket Manager
// ============================================================================

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private subscriptions: Map<string, Set<(event: UpdateEvent) => void>>;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  constructor(config: ConnectionConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
    this.subscriptions = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Resubscribe to all widgets
        this.subscriptions.forEach((_, widgetId) => {
          this.sendSubscribe(widgetId);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          this.handleUpdate(update);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to widget updates
   */
  subscribe(widgetId: string, callback: (event: UpdateEvent) => void): void {
    if (!this.subscriptions.has(widgetId)) {
      this.subscriptions.set(widgetId, new Set());
      this.sendSubscribe(widgetId);
    }

    this.subscriptions.get(widgetId)!.add(callback);
  }

  /**
   * Unsubscribe from widget updates
   */
  unsubscribe(widgetId: string, callback: (event: UpdateEvent) => void): void {
    const callbacks = this.subscriptions.get(widgetId);
    if (callbacks) {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.subscriptions.delete(widgetId);
        this.sendUnsubscribe(widgetId);
      }
    }
  }

  /**
   * Send subscribe message
   */
  private sendSubscribe(widgetId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        widgetId,
      }));
    }
  }

  /**
   * Send unsubscribe message
   */
  private sendUnsubscribe(widgetId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        widgetId,
      }));
    }
  }

  /**
   * Handle incoming update
   */
  private handleUpdate(update: UpdateEvent): void {
    const validated = UpdateEventSchema.parse(update);
    const callbacks = this.subscriptions.get(validated.widgetId);

    if (callbacks) {
      callbacks.forEach(callback => callback(validated));
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, this.config.heartbeatInterval);
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
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Get connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return 'connected';
    } else if (this.isConnecting) {
      return 'connecting';
    }
    return 'disconnected';
  }
}

// ============================================================================
// Polling Manager
// ============================================================================

class PollingManager {
  private intervals: Map<string, NodeJS.Timeout>;
  private callbacks: Map<string, Set<(event: UpdateEvent) => void>>;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = {
      pollingInterval: 30000,
      ...config,
    };
    this.intervals = new Map();
    this.callbacks = new Map();
  }

  /**
   * Subscribe to widget updates via polling
   */
  subscribe(widgetId: string, callback: (event: UpdateEvent) => void): void {
    if (!this.callbacks.has(widgetId)) {
      this.callbacks.set(widgetId, new Set());
      this.startPolling(widgetId);
    }

    this.callbacks.get(widgetId)!.add(callback);
  }

  /**
   * Unsubscribe from widget updates
   */
  unsubscribe(widgetId: string, callback: (event: UpdateEvent) => void): void {
    const callbacks = this.callbacks.get(widgetId);
    if (callbacks) {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.stopPolling(widgetId);
        this.callbacks.delete(widgetId);
      }
    }
  }

  /**
   * Start polling for widget
   */
  private startPolling(widgetId: string): void {
    if (this.intervals.has(widgetId)) {
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`${this.config.url}/widgets/${widgetId}/data`);
        if (response.ok) {
          const data = await response.json();
          const event: UpdateEvent = {
            type: 'full',
            widgetId,
            timestamp: Date.now(),
            data,
          };

          const callbacks = this.callbacks.get(widgetId);
          if (callbacks) {
            callbacks.forEach(callback => callback(event));
          }
        }
      } catch (error) {
        console.error(`Failed to poll widget ${widgetId}:`, error);
      }
    };

    // Initial poll
    poll();

    // Start interval
    const interval = setInterval(poll, this.config.pollingInterval);
    this.intervals.set(widgetId, interval);
  }

  /**
   * Stop polling for widget
   */
  private stopPolling(widgetId: string): void {
    const interval = this.intervals.get(widgetId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(widgetId);
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.callbacks.clear();
  }
}

// ============================================================================
// Real-Time Updater Class
// ============================================================================

export class RealTimeUpdater {
  private wsManager: WebSocketManager | null = null;
  private pollingManager: PollingManager | null = null;
  private config: ConnectionConfig;
  private lastUpdates: Map<string, any>;

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.lastUpdates = new Map();

    if (config.protocol === 'websocket') {
      this.wsManager = new WebSocketManager(config);
      this.wsManager.connect();
    } else if (config.protocol === 'polling') {
      this.pollingManager = new PollingManager(config);
    }
  }

  /**
   * Subscribe to widget updates
   */
  subscribe(subscription: UpdateSubscription): () => void {
    const callback = subscription.callback;

    if (this.wsManager) {
      this.wsManager.subscribe(subscription.widgetId, callback);
    } else if (this.pollingManager) {
      this.pollingManager.subscribe(subscription.widgetId, callback);
    }

    // Return unsubscribe function
    return () => {
      if (this.wsManager) {
        this.wsManager.unsubscribe(subscription.widgetId, callback);
      } else if (this.pollingManager) {
        this.pollingManager.unsubscribe(subscription.widgetId, callback);
      }
    };
  }

  /**
   * Apply delta update to data
   */
  applyDelta(currentData: any[], delta: UpdateEvent): any[] {
    switch (delta.type) {
      case 'full':
        return delta.data;

      case 'append':
        return [...currentData, ...delta.data];

      case 'remove':
        const idsToRemove = new Set(delta.data);
        return currentData.filter(item => !idsToRemove.has(item.id));

      case 'delta':
        const updates = new Map(delta.data.map((item: any) => [item.id, item]));
        return currentData.map(item =>
          updates.has(item.id) ? { ...item, ...updates.get(item.id) } : item
        );

      default:
        return currentData;
    }
  }

  /**
   * Calculate delta between two datasets
   */
  calculateDelta(oldData: any[], newData: any[]): UpdateEvent | null {
    const oldMap = new Map(oldData.map(item => [item.id, item]));
    const newMap = new Map(newData.map(item => [item.id, item]));

    const added: any[] = [];
    const updated: any[] = [];
    const removed: string[] = [];

    // Find added and updated
    newData.forEach(item => {
      if (!oldMap.has(item.id)) {
        added.push(item);
      } else if (JSON.stringify(item) !== JSON.stringify(oldMap.get(item.id))) {
        updated.push(item);
      }
    });

    // Find removed
    oldData.forEach(item => {
      if (!newMap.has(item.id)) {
        removed.push(item.id);
      }
    });

    // Return appropriate update type
    if (added.length === 0 && updated.length === 0 && removed.length === 0) {
      return null;
    }

    if (added.length > 0 && updated.length === 0 && removed.length === 0) {
      return {
        type: 'append',
        widgetId: '',
        timestamp: Date.now(),
        data: added,
      };
    }

    if (removed.length > 0 && added.length === 0 && updated.length === 0) {
      return {
        type: 'remove',
        widgetId: '',
        timestamp: Date.now(),
        data: removed,
      };
    }

    if (updated.length > 0 && added.length === 0 && removed.length === 0) {
      return {
        type: 'delta',
        widgetId: '',
        timestamp: Date.now(),
        data: updated,
      };
    }

    // Mixed changes - return full update
    return {
      type: 'full',
      widgetId: '',
      timestamp: Date.now(),
      data: newData,
    };
  }

  /**
   * Get connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'polling' {
    if (this.wsManager) {
      return this.wsManager.getStatus();
    } else if (this.pollingManager) {
      return 'polling';
    }
    return 'disconnected';
  }

  /**
   * Reconnect
   */
  reconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect();
      this.wsManager.connect();
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect();
    } else if (this.pollingManager) {
      this.pollingManager.stopAll();
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let updaterInstance: RealTimeUpdater | null = null;

/**
 * Create or get real-time updater instance
 */
export function getRealTimeUpdater(config?: ConnectionConfig): RealTimeUpdater {
  if (!updaterInstance && config) {
    updaterInstance = new RealTimeUpdater(config);
  } else if (!updaterInstance) {
    // Default config
    const defaultConfig: ConnectionConfig = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
      protocol: 'websocket',
    };
    updaterInstance = new RealTimeUpdater(defaultConfig);
  }

  return updaterInstance;
}

/**
 * Reset updater instance (useful for testing)
 */
export function resetUpdater(): void {
  if (updaterInstance) {
    updaterInstance.disconnect();
    updaterInstance = null;
  }
}

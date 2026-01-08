/**
 * Lithic Healthcare Platform v0.5 - Event Bus
 * Coordination Hub - Agent 13
 *
 * This file provides a centralized event bus for inter-module communication
 * Enables loose coupling between modules while maintaining type safety
 */

import type { IntegrationEvent, EventSubscription } from "@/types/shared";
import { WS_EVENTS } from "./constants";
import { errorLogger, AppError } from "./error-handling";

// ============================================================================
// Event Types
// ============================================================================

export type EventCallback<T = any> = (data: T, event: Event) => void | Promise<void>;

export interface Event {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EventFilter {
  source?: string;
  target?: string;
  type?: string;
}

export interface EventSubscriptionOptions {
  filter?: EventFilter;
  priority?: number;
  once?: boolean;
}

// ============================================================================
// Event Bus Implementation
// ============================================================================

export class EventBus {
  private subscribers = new Map<
    string,
    Array<{
      callback: EventCallback;
      filter?: EventFilter;
      priority: number;
      once: boolean;
    }>
  >();
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;
  private middleware: Array<(event: Event) => Promise<Event>> = [];

  constructor() {
    // Initialize with empty subscribers
  }

  /**
   * Subscribe to events
   */
  on<T = any>(
    eventType: string,
    callback: EventCallback<T>,
    options: EventSubscriptionOptions = {},
  ): () => void {
    const { filter, priority = 0, once = false } = options;

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const subscription = {
      callback: callback as EventCallback,
      filter,
      priority,
      once,
    };

    const subscribers = this.subscribers.get(eventType)!;
    subscribers.push(subscription);

    // Sort by priority (higher priority first)
    subscribers.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Subscribe to events (one-time)
   */
  once<T = any>(
    eventType: string,
    callback: EventCallback<T>,
    options: Omit<EventSubscriptionOptions, "once"> = {},
  ): () => void {
    return this.on(eventType, callback, { ...options, once: true });
  }

  /**
   * Unsubscribe from events
   */
  off(eventType: string, callback?: EventCallback): void {
    if (!callback) {
      // Remove all subscribers for this event type
      this.subscribers.delete(eventType);
      return;
    }

    const subscribers = this.subscribers.get(eventType);
    if (!subscribers) return;

    const index = subscribers.findIndex((sub) => sub.callback === callback);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }

    if (subscribers.length === 0) {
      this.subscribers.delete(eventType);
    }
  }

  /**
   * Emit an event
   */
  async emit(
    eventType: string,
    payload: any,
    source: string,
    target?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const event: Event = {
      id: this.generateEventId(),
      type: eventType,
      source,
      target,
      payload,
      timestamp: new Date(),
      metadata,
    };

    try {
      // Apply middleware
      let processedEvent = event;
      for (const middleware of this.middleware) {
        processedEvent = await middleware(processedEvent);
      }

      // Add to history
      this.addToHistory(processedEvent);

      // Get subscribers
      const subscribers = this.subscribers.get(eventType);
      if (!subscribers || subscribers.length === 0) return;

      // Filter and execute callbacks
      const filteredSubscribers = subscribers.filter((sub) =>
        this.matchesFilter(processedEvent, sub.filter),
      );

      const promises = filteredSubscribers.map(async (sub) => {
        try {
          await sub.callback(processedEvent.payload, processedEvent);

          // Remove one-time subscribers
          if (sub.once) {
            this.off(eventType, sub.callback);
          }
        } catch (error) {
          const appError = new AppError(
            `Error in event handler for ${eventType}`,
            "EVENT_HANDLER_ERROR",
            500,
            { error, event: processedEvent },
          );
          errorLogger.log(appError, { event: processedEvent });
        }
      });

      await Promise.all(promises);
    } catch (error) {
      const appError = new AppError(
        `Error emitting event ${eventType}`,
        "EVENT_EMIT_ERROR",
        500,
        { error, event },
      );
      errorLogger.log(appError, { event });
      throw appError;
    }
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  emitSync(
    eventType: string,
    payload: any,
    source: string,
    target?: string,
    metadata?: Record<string, any>,
  ): void {
    // Fire and forget - don't wait for completion
    this.emit(eventType, payload, source, target, metadata).catch((error) => {
      console.error("Error in async event emission:", error);
    });
  }

  /**
   * Add middleware
   */
  use(middleware: (event: Event) => Promise<Event>): void {
    this.middleware.push(middleware);
  }

  /**
   * Get event history
   */
  getHistory(filter?: EventFilter, limit?: number): Event[] {
    let history = this.eventHistory;

    if (filter) {
      history = history.filter((event) => this.matchesFilter(event, filter));
    }

    if (limit) {
      return history.slice(-limit);
    }

    return [...history];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(eventType?: string): Map<string, number> {
    const subscriptions = new Map<string, number>();

    if (eventType) {
      const subs = this.subscribers.get(eventType);
      if (subs) {
        subscriptions.set(eventType, subs.length);
      }
    } else {
      this.subscribers.forEach((subs, type) => {
        subscriptions.set(type, subs.length);
      });
    }

    return subscriptions;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscribers.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesFilter(event: Event, filter?: EventFilter): boolean {
    if (!filter) return true;

    if (filter.source && event.source !== filter.source) return false;
    if (filter.target && event.target !== filter.target) return false;
    if (filter.type && event.type !== filter.type) return false;

    return true;
  }

  private addToHistory(event: Event): void {
    this.eventHistory.push(event);

    // Keep only the most recent events
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// ============================================================================
// Global Event Bus Instance
// ============================================================================

export const eventBus = new EventBus();

// ============================================================================
// Module-Specific Event Helpers
// ============================================================================

export const MobileEvents = {
  SYNC_STARTED: "mobile:sync:started",
  SYNC_COMPLETED: "mobile:sync:completed",
  SYNC_FAILED: "mobile:sync:failed",
  DEVICE_REGISTERED: "mobile:device:registered",
  DEVICE_UPDATED: "mobile:device:updated",
  OFFLINE_MODE_ENABLED: "mobile:offline:enabled",
  OFFLINE_MODE_DISABLED: "mobile:offline:disabled",
} as const;

export const NotificationEvents = {
  CREATED: "notification:created",
  SENT: "notification:sent",
  DELIVERED: "notification:delivered",
  READ: "notification:read",
  FAILED: "notification:failed",
  CANCELLED: "notification:cancelled",
} as const;

export const AIEvents = {
  REQUEST_STARTED: "ai:request:started",
  REQUEST_COMPLETED: "ai:request:completed",
  REQUEST_FAILED: "ai:request:failed",
  INSIGHT_GENERATED: "ai:insight:generated",
  MODEL_UPDATED: "ai:model:updated",
} as const;

export const VoiceEvents = {
  SESSION_STARTED: "voice:session:started",
  SESSION_ENDED: "voice:session:ended",
  TRANSCRIPTION_UPDATED: "voice:transcription:updated",
  COMMAND_RECOGNIZED: "voice:command:recognized",
  COMMAND_EXECUTED: "voice:command:executed",
} as const;

export const RPMEvents = {
  READING_RECEIVED: "rpm:reading:received",
  ALERT_TRIGGERED: "rpm:alert:triggered",
  DEVICE_CONNECTED: "rpm:device:connected",
  DEVICE_DISCONNECTED: "rpm:device:disconnected",
  THRESHOLD_EXCEEDED: "rpm:threshold:exceeded",
} as const;

export const SDOHEvents = {
  ASSESSMENT_COMPLETED: "sdoh:assessment:completed",
  INTERVENTION_STARTED: "sdoh:intervention:started",
  INTERVENTION_COMPLETED: "sdoh:intervention:completed",
  RESOURCE_REFERRED: "sdoh:resource:referred",
} as const;

export const ResearchEvents = {
  PARTICIPANT_ENROLLED: "research:participant:enrolled",
  VISIT_COMPLETED: "research:visit:completed",
  ADVERSE_EVENT_REPORTED: "research:ae:reported",
  PROTOCOL_DEVIATION: "research:deviation:reported",
} as const;

export const EngagementEvents = {
  MILESTONE_ACHIEVED: "engagement:milestone:achieved",
  ACTIVITY_COMPLETED: "engagement:activity:completed",
  REWARD_EARNED: "engagement:reward:earned",
  LEVEL_UP: "engagement:level:up",
  STREAK_UPDATED: "engagement:streak:updated",
} as const;

export const DocumentEvents = {
  UPLOADED: "document:uploaded",
  UPDATED: "document:updated",
  DELETED: "document:deleted",
  SHARED: "document:shared",
  ACCESSED: "document:accessed",
} as const;

export const ESignatureEvents = {
  REQUEST_SENT: "esignature:request:sent",
  DOCUMENT_VIEWED: "esignature:document:viewed",
  DOCUMENT_SIGNED: "esignature:document:signed",
  DOCUMENT_DECLINED: "esignature:document:declined",
  REQUEST_COMPLETED: "esignature:request:completed",
} as const;

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Emit a mobile event
 */
export function emitMobileEvent(
  event: keyof typeof MobileEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(MobileEvents[event], payload, "mobile", target);
}

/**
 * Emit a notification event
 */
export function emitNotificationEvent(
  event: keyof typeof NotificationEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(NotificationEvents[event], payload, "notifications", target);
}

/**
 * Emit an AI event
 */
export function emitAIEvent(
  event: keyof typeof AIEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(AIEvents[event], payload, "ai", target);
}

/**
 * Emit a voice event
 */
export function emitVoiceEvent(
  event: keyof typeof VoiceEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(VoiceEvents[event], payload, "voice", target);
}

/**
 * Emit an RPM event
 */
export function emitRPMEvent(
  event: keyof typeof RPMEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(RPMEvents[event], payload, "rpm", target);
}

/**
 * Emit an SDOH event
 */
export function emitSDOHEvent(
  event: keyof typeof SDOHEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(SDOHEvents[event], payload, "sdoh", target);
}

/**
 * Emit a research event
 */
export function emitResearchEvent(
  event: keyof typeof ResearchEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(ResearchEvents[event], payload, "research", target);
}

/**
 * Emit an engagement event
 */
export function emitEngagementEvent(
  event: keyof typeof EngagementEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(EngagementEvents[event], payload, "engagement", target);
}

/**
 * Emit a document event
 */
export function emitDocumentEvent(
  event: keyof typeof DocumentEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(DocumentEvents[event], payload, "documents", target);
}

/**
 * Emit an e-signature event
 */
export function emitESignatureEvent(
  event: keyof typeof ESignatureEvents,
  payload: any,
  target?: string,
): void {
  eventBus.emitSync(ESignatureEvents[event], payload, "esignature", target);
}

// ============================================================================
// Event Logging Middleware
// ============================================================================

export function createLoggingMiddleware(enabled = true) {
  return async (event: Event): Promise<Event> => {
    if (enabled && process.env.NODE_ENV === "development") {
      console.log(`[Event Bus] ${event.type}`, {
        source: event.source,
        target: event.target,
        timestamp: event.timestamp,
        payload: event.payload,
      });
    }
    return event;
  };
}

// ============================================================================
// Event Validation Middleware
// ============================================================================

export function createValidationMiddleware(
  validators: Map<string, (payload: any) => boolean>,
) {
  return async (event: Event): Promise<Event> => {
    const validator = validators.get(event.type);
    if (validator && !validator(event.payload)) {
      throw new AppError(
        `Invalid payload for event ${event.type}`,
        "INVALID_EVENT_PAYLOAD",
        400,
        { event },
      );
    }
    return event;
  };
}

// ============================================================================
// Event Transformation Middleware
// ============================================================================

export function createTransformationMiddleware(
  transformers: Map<string, (payload: any) => any>,
) {
  return async (event: Event): Promise<Event> => {
    const transformer = transformers.get(event.type);
    if (transformer) {
      event.payload = await transformer(event.payload);
    }
    return event;
  };
}

// ============================================================================
// Initialize Default Middleware
// ============================================================================

// Add logging middleware in development
if (process.env.NODE_ENV === "development") {
  eventBus.use(createLoggingMiddleware(true));
}

// ============================================================================
// Export All
// ============================================================================

export default {
  eventBus,
  EventBus,
  MobileEvents,
  NotificationEvents,
  AIEvents,
  VoiceEvents,
  RPMEvents,
  SDOHEvents,
  ResearchEvents,
  EngagementEvents,
  DocumentEvents,
  ESignatureEvents,
  emitMobileEvent,
  emitNotificationEvent,
  emitAIEvent,
  emitVoiceEvent,
  emitRPMEvent,
  emitSDOHEvent,
  emitResearchEvent,
  emitEngagementEvent,
  emitDocumentEvent,
  emitESignatureEvent,
  createLoggingMiddleware,
  createValidationMiddleware,
  createTransformationMiddleware,
};

/**
 * Webhook Manager
 *
 * Comprehensive webhook management system with retry logic,
 * signature verification, and delivery tracking
 */

import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

// Webhook Event Types
export type WebhookEventType =
  | 'patient.created'
  | 'patient.updated'
  | 'patient.deleted'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'order.created'
  | 'order.completed'
  | 'result.available'
  | 'prescription.created'
  | 'prescription.filled'
  | 'encounter.created'
  | 'encounter.completed'
  | 'document.created'
  | 'billing.claim.created'
  | 'billing.claim.submitted'
  | 'billing.payment.received';

// Webhook Subscription
export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  headers?: Record<string, string>;
  retryAttempts?: number;
  timeout?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook Payload
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

// Webhook Delivery
export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  payloadId: string;
  url: string;
  event: WebhookEventType;
  payload: WebhookPayload;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  statusCode?: number;
  response?: any;
  error?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

// Webhook Configuration
export interface WebhookConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  signatureHeader?: string;
  timestampHeader?: string;
}

/**
 * Webhook Manager
 */
export class WebhookManager {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private config: Required<WebhookConfig>;

  constructor(config: WebhookConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 10000,
      signatureHeader: config.signatureHeader || 'X-Webhook-Signature',
      timestampHeader: config.timestampHeader || 'X-Webhook-Timestamp',
    };
  }

  /**
   * Register a webhook subscription
   */
  subscribe(subscription: Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>): WebhookSubscription {
    const id = crypto.randomUUID();
    const now = new Date();

    const newSubscription: WebhookSubscription = {
      id,
      ...subscription,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(id, newSubscription);

    logger.info('Webhook subscription created', {
      id,
      url: subscription.url,
      events: subscription.events,
    });

    return newSubscription;
  }

  /**
   * Unsubscribe a webhook
   */
  unsubscribe(subscriptionId: string): boolean {
    const deleted = this.subscriptions.delete(subscriptionId);

    if (deleted) {
      logger.info('Webhook subscription deleted', { subscriptionId });
    }

    return deleted;
  }

  /**
   * Get a subscription by ID
   */
  getSubscription(subscriptionId: string): WebhookSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions for a specific event
   */
  getSubscriptionsForEvent(event: WebhookEventType): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.active && sub.events.includes(event)
    );
  }

  /**
   * Update a subscription
   */
  updateSubscription(
    subscriptionId: string,
    updates: Partial<Omit<WebhookSubscription, 'id' | 'createdAt' | 'updatedAt'>>
  ): WebhookSubscription | undefined {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return undefined;
    }

    const updated: WebhookSubscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, updated);

    logger.info('Webhook subscription updated', { subscriptionId });

    return updated;
  }

  /**
   * Trigger webhook event
   */
  async trigger(event: WebhookEventType, data: any, metadata?: Record<string, any>): Promise<void> {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    const subscriptions = this.getSubscriptionsForEvent(event);

    logger.info('Triggering webhook event', {
      event,
      payloadId: payload.id,
      subscriptionCount: subscriptions.length,
    });

    // Send to all subscriptions
    await Promise.allSettled(
      subscriptions.map((subscription) => this.deliver(subscription, payload))
    );
  }

  /**
   * Deliver webhook to a subscription
   */
  private async deliver(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<WebhookDelivery> {
    const deliveryId = crypto.randomUUID();

    const delivery: WebhookDelivery = {
      id: deliveryId,
      subscriptionId: subscription.id,
      payloadId: payload.id,
      url: subscription.url,
      event: payload.event,
      payload,
      attempt,
      status: 'pending',
      createdAt: new Date(),
    };

    this.deliveries.set(deliveryId, delivery);

    try {
      // Generate signature
      const signature = this.generateSignature(payload, subscription.secret);
      const timestamp = Date.now().toString();

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        [this.config.signatureHeader]: signature,
        [this.config.timestampHeader]: timestamp,
        'X-Webhook-Event': payload.event,
        'X-Webhook-ID': payload.id,
        'X-Webhook-Delivery-ID': deliveryId,
        ...subscription.headers,
      };

      // Send webhook
      const response = await axios.post(subscription.url, payload, {
        headers,
        timeout: subscription.timeout || this.config.timeout,
      });

      // Update delivery status
      delivery.status = 'success';
      delivery.statusCode = response.status;
      delivery.response = response.data;
      delivery.deliveredAt = new Date();

      this.deliveries.set(deliveryId, delivery);

      logger.info('Webhook delivered successfully', {
        deliveryId,
        subscriptionId: subscription.id,
        event: payload.event,
        statusCode: response.status,
        attempt,
      });

      return delivery;
    } catch (error: any) {
      const axiosError = error as AxiosError;

      delivery.status = 'failed';
      delivery.statusCode = axiosError.response?.status;
      delivery.error = axiosError.message;

      this.deliveries.set(deliveryId, delivery);

      logger.error('Webhook delivery failed', {
        deliveryId,
        subscriptionId: subscription.id,
        event: payload.event,
        error: axiosError.message,
        statusCode: axiosError.response?.status,
        attempt,
      });

      // Retry if attempts remaining
      const maxRetries = subscription.retryAttempts || this.config.maxRetries;
      if (attempt < maxRetries) {
        delivery.status = 'retrying';
        this.deliveries.set(deliveryId, delivery);

        logger.info('Retrying webhook delivery', {
          deliveryId,
          attempt: attempt + 1,
          maxRetries,
        });

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);

        return this.deliver(subscription, payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: WebhookPayload, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get delivery by ID
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * Get all deliveries for a subscription
   */
  getDeliveriesForSubscription(subscriptionId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.subscriptionId === subscriptionId
    );
  }

  /**
   * Get all deliveries for a payload
   */
  getDeliveriesForPayload(payloadId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.payloadId === payloadId
    );
  }

  /**
   * Get delivery statistics for a subscription
   */
  getDeliveryStats(subscriptionId: string): {
    total: number;
    success: number;
    failed: number;
    pending: number;
    retrying: number;
    successRate: number;
  } {
    const deliveries = this.getDeliveriesForSubscription(subscriptionId);

    const stats = {
      total: deliveries.length,
      success: deliveries.filter((d) => d.status === 'success').length,
      failed: deliveries.filter((d) => d.status === 'failed').length,
      pending: deliveries.filter((d) => d.status === 'pending').length,
      retrying: deliveries.filter((d) => d.status === 'retrying').length,
      successRate: 0,
    };

    stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

    return stats;
  }

  /**
   * Clear old deliveries
   */
  clearOldDeliveries(olderThan: Date): number {
    let cleared = 0;

    for (const [id, delivery] of this.deliveries.entries()) {
      if (delivery.createdAt < olderThan) {
        this.deliveries.delete(id);
        cleared++;
      }
    }

    logger.info('Cleared old webhook deliveries', { count: cleared });

    return cleared;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default webhook manager instance
 */
export const webhookManager = new WebhookManager();

/**
 * Helper function to trigger webhook
 */
export async function triggerWebhook(
  event: WebhookEventType,
  data: any,
  metadata?: Record<string, any>
): Promise<void> {
  return webhookManager.trigger(event, data, metadata);
}

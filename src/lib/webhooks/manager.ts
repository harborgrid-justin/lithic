/**
 * Webhook Manager
 * Manages webhook subscriptions and event delivery with retry logic
 */

import { z } from "zod";
import crypto from "crypto";

const WebhookConfigSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string(),
  active: z.boolean().default(true),
  retryPolicy: z
    .object({
      maxRetries: z.number().default(3),
      backoffMultiplier: z.number().default(2),
      initialDelay: z.number().default(1000),
    })
    .optional(),
  headers: z.record(z.string()).optional(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryQueue: WebhookDelivery[] = [];
  private processing: boolean = false;

  /**
   * Register a webhook
   */
  register(config: Omit<WebhookConfig, "id">): WebhookConfig {
    const id = crypto.randomUUID();
    const webhook: WebhookConfig = {
      ...config,
      id,
    };

    WebhookConfigSchema.parse(webhook);
    this.webhooks.set(id, webhook);

    return webhook;
  }

  /**
   * Unregister a webhook
   */
  unregister(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  /**
   * Get webhook by ID
   */
  get(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List all webhooks
   */
  list(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Update webhook configuration
   */
  update(
    webhookId: string,
    updates: Partial<WebhookConfig>,
  ): WebhookConfig | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const updated = { ...webhook, ...updates, id: webhookId };
    WebhookConfigSchema.parse(updated);
    this.webhooks.set(webhookId, updated);

    return updated;
  }

  /**
   * Emit an event to all subscribed webhooks
   */
  async emit(event: Omit<WebhookEvent, "id" | "timestamp">): Promise<string> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Find webhooks subscribed to this event type
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) =>
        webhook.active &&
        (webhook.events.includes(event.type) || webhook.events.includes("*")),
    );

    // Create delivery records
    for (const webhook of subscribedWebhooks) {
      const delivery: WebhookDelivery = {
        id: crypto.randomUUID(),
        webhookId: webhook.id,
        eventId: webhookEvent.id,
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date().toISOString(),
      };

      this.deliveryQueue.push(delivery);
    }

    // Start processing queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }

    return webhookEvent.id;
  }

  /**
   * Process delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue[0];
      if (!delivery) break;

      const now = new Date();
      const nextAttempt = delivery.nextAttemptAt
        ? new Date(delivery.nextAttemptAt)
        : now;

      if (nextAttempt > now) {
        // Wait until next attempt time
        await new Promise((resolve) =>
          setTimeout(resolve, nextAttempt.getTime() - now.getTime()),
        );
      }

      await this.deliverWebhook(delivery);

      // Remove from queue if delivered or failed permanently
      if (delivery.status !== "pending") {
        this.deliveryQueue.shift();
      }
    }

    this.processing = false;
  }

  /**
   * Deliver a single webhook
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) {
      delivery.status = "failed";
      delivery.error = "Webhook configuration not found";
      return;
    }

    delivery.attempts++;
    delivery.lastAttemptAt = new Date().toISOString();

    try {
      // Get event data (in real implementation, fetch from database)
      const eventData = {
        id: delivery.eventId,
        type: "event.type",
        timestamp: new Date().toISOString(),
        data: {},
      };

      // Generate signature
      const signature = this.generateSignature(
        webhook.secret,
        JSON.stringify(eventData),
      );

      // Send webhook
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-ID": webhook.id,
          "X-Webhook-Timestamp": new Date().toISOString(),
          "X-Webhook-Delivery-ID": delivery.id,
          ...webhook.headers,
        },
        body: JSON.stringify(eventData),
      });

      const responseBody = await response.text();

      delivery.response = {
        status: response.status,
        body: responseBody,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        delivery.status = "delivered";
      } else {
        await this.handleDeliveryFailure(
          delivery,
          webhook,
          `HTTP ${response.status}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.handleDeliveryFailure(delivery, webhook, errorMessage);
    }
  }

  /**
   * Handle delivery failure and schedule retry
   */
  private async handleDeliveryFailure(
    delivery: WebhookDelivery,
    webhook: WebhookConfig,
    error: string,
  ): Promise<void> {
    delivery.error = error;

    const maxRetries = webhook.retryPolicy?.maxRetries ?? 3;

    if (delivery.attempts >= maxRetries) {
      delivery.status = "failed";
      return;
    }

    // Calculate next retry time with exponential backoff
    const initialDelay = webhook.retryPolicy?.initialDelay ?? 1000;
    const multiplier = webhook.retryPolicy?.backoffMultiplier ?? 2;
    const delay = initialDelay * Math.pow(multiplier, delivery.attempts - 1);

    delivery.nextAttemptAt = new Date(Date.now() + delay).toISOString();
    delivery.status = "pending";
  }

  /**
   * Generate HMAC signature for webhook
   */
  generateSignature(secret: string, payload: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifySignature(secret: string, payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Get delivery status
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveryQueue.find((d) => d.id === deliveryId);
  }

  /**
   * Get all deliveries for a webhook
   */
  getDeliveries(webhookId: string): WebhookDelivery[] {
    return this.deliveryQueue.filter((d) => d.webhookId === webhookId);
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = this.deliveryQueue.find((d) => d.id === deliveryId);
    if (!delivery) return false;

    delivery.status = "pending";
    delivery.nextAttemptAt = new Date().toISOString();

    if (!this.processing) {
      this.processQueue();
    }

    return true;
  }

  /**
   * Clear completed deliveries
   */
  clearCompleted(): number {
    const initialLength = this.deliveryQueue.length;
    this.deliveryQueue = this.deliveryQueue.filter(
      (d) => d.status === "pending",
    );
    return initialLength - this.deliveryQueue.length;
  }
}

/**
 * Default webhook manager instance
 */
export const webhookManager = new WebhookManager();

/**
 * Common webhook event types
 */
export const WebhookEventTypes = {
  // Patient events
  PATIENT_CREATED: "patient.created",
  PATIENT_UPDATED: "patient.updated",
  PATIENT_DELETED: "patient.deleted",

  // Appointment events
  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_UPDATED: "appointment.updated",
  APPOINTMENT_CANCELLED: "appointment.cancelled",
  APPOINTMENT_CONFIRMED: "appointment.confirmed",
  APPOINTMENT_COMPLETED: "appointment.completed",

  // Order events
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_COMPLETED: "order.completed",
  ORDER_CANCELLED: "order.cancelled",

  // Result events
  RESULT_AVAILABLE: "result.available",
  RESULT_AMENDED: "result.amended",

  // Document events
  DOCUMENT_CREATED: "document.created",
  DOCUMENT_SIGNED: "document.signed",

  // Prescription events
  PRESCRIPTION_CREATED: "prescription.created",
  PRESCRIPTION_FILLED: "prescription.filled",
  PRESCRIPTION_CANCELLED: "prescription.cancelled",

  // Billing events
  CLAIM_SUBMITTED: "claim.submitted",
  CLAIM_PAID: "claim.paid",
  CLAIM_DENIED: "claim.denied",
} as const;

/**
 * Helper to emit common events
 */
export async function emitPatientEvent(
  action: "created" | "updated" | "deleted",
  patientData: any,
): Promise<string> {
  const eventType = `patient.${action}` as const;
  return webhookManager.emit({
    type: eventType,
    data: patientData,
    metadata: {
      source: "lithic",
      version: "1.0",
    },
  });
}

export async function emitAppointmentEvent(
  action: "created" | "updated" | "cancelled" | "confirmed" | "completed",
  appointmentData: any,
): Promise<string> {
  const eventType = `appointment.${action}` as const;
  return webhookManager.emit({
    type: eventType,
    data: appointmentData,
    metadata: {
      source: "lithic",
      version: "1.0",
    },
  });
}

export async function emitOrderEvent(
  action: "created" | "updated" | "completed" | "cancelled",
  orderData: any,
): Promise<string> {
  const eventType = `order.${action}` as const;
  return webhookManager.emit({
    type: eventType,
    data: orderData,
    metadata: {
      source: "lithic",
      version: "1.0",
    },
  });
}

/**
 * FHIR R4 Subscriptions
 * Real-time notifications for FHIR resource changes
 */

import type { Subscription, Resource, Bundle } from "@/types/fhir-resources";
import { db } from "@/lib/db";
import { EventEmitter } from "events";

// Subscription Manager
class SubscriptionManager extends EventEmitter {
  private subscriptions: Map<string, Subscription> = new Map();
  private websocketConnections: Map<string, WebSocket[]> = new Map();

  /**
   * Create a new subscription
   */
  async createSubscription(subscription: Subscription): Promise<Subscription> {
    if (!subscription.id) {
      subscription.id = generateId();
    }

    // Validate subscription
    this.validateSubscription(subscription);

    // Store subscription
    this.subscriptions.set(subscription.id, subscription);

    // Initialize channel based on type
    await this.initializeChannel(subscription);

    // Start monitoring
    this.startMonitoring(subscription);

    return subscription;
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  /**
   * Update subscription
   */
  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);

    if (!subscription) {
      throw new Error(`Subscription ${id} not found`);
    }

    const updated = { ...subscription, ...updates };
    this.subscriptions.set(id, updated);

    // Re-initialize channel if changed
    if (updates.channel) {
      await this.initializeChannel(updated);
    }

    return updated;
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id);

    if (!subscription) {
      throw new Error(`Subscription ${id} not found`);
    }

    // Clean up channel resources
    await this.cleanupChannel(subscription);

    this.subscriptions.delete(id);
  }

  /**
   * List all subscriptions
   */
  listSubscriptions(criteria?: string): Subscription[] {
    const subs = Array.from(this.subscriptions.values());

    if (criteria) {
      return subs.filter((sub) => sub.criteria === criteria);
    }

    return subs;
  }

  /**
   * Notify subscribers of resource change
   */
  async notifyChange(resource: Resource, event: "create" | "update" | "delete"): Promise<void> {
    const matchingSubscriptions = this.findMatchingSubscriptions(resource, event);

    for (const subscription of matchingSubscriptions) {
      try {
        await this.deliverNotification(subscription, resource, event);
      } catch (error) {
        console.error(`Failed to deliver notification for subscription ${subscription.id}:`, error);
        await this.handleDeliveryError(subscription, error);
      }
    }
  }

  /**
   * Validate subscription
   */
  private validateSubscription(subscription: Subscription): void {
    if (!subscription.criteria) {
      throw new Error("Subscription must have criteria");
    }

    if (!subscription.channel) {
      throw new Error("Subscription must have a channel");
    }

    if (!subscription.reason) {
      throw new Error("Subscription must have a reason");
    }

    // Validate channel type
    const validChannelTypes = ["rest-hook", "websocket", "email", "sms", "message"];
    if (!validChannelTypes.includes(subscription.channel.type)) {
      throw new Error(`Invalid channel type: ${subscription.channel.type}`);
    }

    // Validate endpoint for rest-hook
    if (subscription.channel.type === "rest-hook" && !subscription.channel.endpoint) {
      throw new Error("rest-hook channel must have an endpoint");
    }

    // Parse criteria to validate
    this.parseCriteria(subscription.criteria);
  }

  /**
   * Parse subscription criteria
   */
  private parseCriteria(criteria: string): {
    resourceType: string;
    searchParams: Record<string, string>;
  } {
    // Format: ResourceType?param1=value1&param2=value2
    const [resourceType, paramsString] = criteria.split("?");

    if (!resourceType) {
      throw new Error("Invalid criteria: missing resource type");
    }

    const searchParams: Record<string, string> = {};

    if (paramsString) {
      const params = new URLSearchParams(paramsString);
      params.forEach((value, key) => {
        searchParams[key] = value;
      });
    }

    return { resourceType, searchParams };
  }

  /**
   * Find subscriptions matching a resource change
   */
  private findMatchingSubscriptions(resource: Resource, event: string): Subscription[] {
    const matching: Subscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (subscription.status !== "active") {
        continue;
      }

      const { resourceType, searchParams } = this.parseCriteria(subscription.criteria);

      // Check resource type
      if (resourceType !== resource.resourceType) {
        continue;
      }

      // Check search parameters
      if (this.matchesSearchParams(resource, searchParams)) {
        matching.push(subscription);
      }
    }

    return matching;
  }

  /**
   * Check if resource matches search parameters
   */
  private matchesSearchParams(resource: any, searchParams: Record<string, string>): boolean {
    for (const [param, value] of Object.entries(searchParams)) {
      // Simple matching - in production would use full FHIR search logic
      switch (param) {
        case "_id":
          if (resource.id !== value) return false;
          break;
        case "status":
          if (resource.status !== value) return false;
          break;
        case "patient":
          const patientRef = value.replace("Patient/", "");
          if (resource.subject?.reference !== `Patient/${patientRef}`) return false;
          break;
        // Add more parameter matching as needed
      }
    }

    return true;
  }

  /**
   * Initialize subscription channel
   */
  private async initializeChannel(subscription: Subscription): Promise<void> {
    switch (subscription.channel.type) {
      case "rest-hook":
        // Verify endpoint is reachable
        await this.verifyRestHookEndpoint(subscription);
        break;

      case "websocket":
        // WebSocket connections are managed separately
        break;

      case "email":
        // Verify email configuration
        await this.verifyEmailChannel(subscription);
        break;

      case "sms":
        // Verify SMS configuration
        await this.verifySMSChannel(subscription);
        break;
    }
  }

  /**
   * Verify REST hook endpoint
   */
  private async verifyRestHookEndpoint(subscription: Subscription): Promise<void> {
    if (!subscription.channel.endpoint) {
      throw new Error("REST hook endpoint is required");
    }

    try {
      // Send handshake request
      const response = await fetch(subscription.channel.endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/fhir+json",
          ...(subscription.channel.header?.reduce((acc, header) => {
            const [key, value] = header.split(": ");
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>)),
        },
      });

      if (!response.ok) {
        throw new Error(`Endpoint verification failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to verify REST hook endpoint: ${error}`);
    }
  }

  /**
   * Verify email channel
   */
  private async verifyEmailChannel(subscription: Subscription): Promise<void> {
    // Would verify email configuration
    // For now, just check endpoint format
    if (!subscription.channel.endpoint?.includes("@")) {
      throw new Error("Invalid email address");
    }
  }

  /**
   * Verify SMS channel
   */
  private async verifySMSChannel(subscription: Subscription): Promise<void> {
    // Would verify SMS configuration
    // For now, just check endpoint format
    if (!subscription.channel.endpoint?.match(/^\+?[1-9]\d{1,14}$/)) {
      throw new Error("Invalid phone number");
    }
  }

  /**
   * Deliver notification to subscriber
   */
  private async deliverNotification(
    subscription: Subscription,
    resource: Resource,
    event: string
  ): Promise<void> {
    const notification = this.buildNotification(subscription, resource, event);

    switch (subscription.channel.type) {
      case "rest-hook":
        await this.deliverRestHook(subscription, notification);
        break;

      case "websocket":
        await this.deliverWebSocket(subscription, notification);
        break;

      case "email":
        await this.deliverEmail(subscription, notification);
        break;

      case "sms":
        await this.deliverSMS(subscription, notification);
        break;

      case "message":
        await this.deliverMessage(subscription, notification);
        break;
    }

    // Update last ping
    subscription.lastPing = new Date();
  }

  /**
   * Build notification bundle
   */
  private buildNotification(
    subscription: Subscription,
    resource: Resource,
    event: string
  ): Bundle {
    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "history",
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `${resource.resourceType}/${resource.id}`,
          resource:
            subscription.channel.payload === "application/fhir+json" ? resource : undefined,
          request: {
            method: event === "create" ? "POST" : event === "update" ? "PUT" : "DELETE",
            url: `${resource.resourceType}/${resource.id}`,
          },
        },
      ],
    };

    return bundle;
  }

  /**
   * Deliver via REST hook
   */
  private async deliverRestHook(subscription: Subscription, notification: Bundle): Promise<void> {
    if (!subscription.channel.endpoint) {
      throw new Error("REST hook endpoint is required");
    }

    const headers: Record<string, string> = {
      "Content-Type": subscription.channel.payload || "application/fhir+json",
    };

    // Add custom headers
    subscription.channel.header?.forEach((header) => {
      const [key, value] = header.split(": ");
      headers[key] = value;
    });

    const response = await fetch(subscription.channel.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`REST hook delivery failed: ${response.statusText}`);
    }
  }

  /**
   * Deliver via WebSocket
   */
  private async deliverWebSocket(subscription: Subscription, notification: Bundle): Promise<void> {
    const connections = this.websocketConnections.get(subscription.id) || [];

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(notification));
      }
    }
  }

  /**
   * Deliver via email
   */
  private async deliverEmail(subscription: Subscription, notification: Bundle): Promise<void> {
    // Would integrate with email service
    console.log(`Sending email to ${subscription.channel.endpoint}`);
    // Implementation would use nodemailer or similar
  }

  /**
   * Deliver via SMS
   */
  private async deliverSMS(subscription: Subscription, notification: Bundle): Promise<void> {
    // Would integrate with SMS service
    console.log(`Sending SMS to ${subscription.channel.endpoint}`);
    // Implementation would use Twilio or similar
  }

  /**
   * Deliver via messaging system
   */
  private async deliverMessage(subscription: Subscription, notification: Bundle): Promise<void> {
    // Would integrate with messaging system (e.g., Kafka, RabbitMQ)
    console.log(`Publishing message for subscription ${subscription.id}`);
    // Implementation would use message queue
  }

  /**
   * Handle delivery error
   */
  private async handleDeliveryError(subscription: Subscription, error: any): Promise<void> {
    subscription.error = error.message;

    // Could implement retry logic here
    // For now, just mark as error
    subscription.status = "error";
  }

  /**
   * Start monitoring for subscription
   */
  private startMonitoring(subscription: Subscription): void {
    // Monitoring would be handled by database triggers or change streams
    // This is a placeholder for the monitoring logic
    console.log(`Started monitoring for subscription ${subscription.id}`);
  }

  /**
   * Cleanup channel resources
   */
  private async cleanupChannel(subscription: Subscription): Promise<void> {
    switch (subscription.channel.type) {
      case "websocket":
        const connections = this.websocketConnections.get(subscription.id) || [];
        connections.forEach((ws) => ws.close());
        this.websocketConnections.delete(subscription.id);
        break;

      // Other cleanup as needed
    }
  }

  /**
   * Add WebSocket connection to subscription
   */
  addWebSocketConnection(subscriptionId: string, ws: WebSocket): void {
    const connections = this.websocketConnections.get(subscriptionId) || [];
    connections.push(ws);
    this.websocketConnections.set(subscriptionId, connections);

    // Remove connection on close
    ws.addEventListener("close", () => {
      const conns = this.websocketConnections.get(subscriptionId) || [];
      const index = conns.indexOf(ws);
      if (index > -1) {
        conns.splice(index, 1);
      }
    });
  }

  /**
   * Ping subscription to keep alive
   */
  async pingSubscription(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.channel.type === "rest-hook" && subscription.channel.endpoint) {
      try {
        const response = await fetch(subscription.channel.endpoint, {
          method: "HEAD",
        });

        if (response.ok) {
          subscription.lastPing = new Date();
          subscription.status = "active";
          subscription.error = undefined;
        } else {
          subscription.status = "error";
          subscription.error = `Ping failed: ${response.statusText}`;
        }
      } catch (error: any) {
        subscription.status = "error";
        subscription.error = `Ping failed: ${error.message}`;
      }
    }
  }
}

// Singleton instance
export const subscriptionManager = new SubscriptionManager();

/**
 * Create a new subscription
 */
export async function createSubscription(subscription: Subscription): Promise<Subscription> {
  return subscriptionManager.createSubscription(subscription);
}

/**
 * Get subscription
 */
export function getSubscription(id: string): Subscription | undefined {
  return subscriptionManager.getSubscription(id);
}

/**
 * Update subscription
 */
export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  return subscriptionManager.updateSubscription(id, updates);
}

/**
 * Delete subscription
 */
export async function deleteSubscription(id: string): Promise<void> {
  return subscriptionManager.deleteSubscription(id);
}

/**
 * List subscriptions
 */
export function listSubscriptions(criteria?: string): Subscription[] {
  return subscriptionManager.listSubscriptions(criteria);
}

/**
 * Notify resource change
 */
export async function notifyResourceChange(
  resource: Resource,
  event: "create" | "update" | "delete"
): Promise<void> {
  return subscriptionManager.notifyChange(resource, event);
}

/**
 * Add WebSocket connection
 */
export function addWebSocketConnection(subscriptionId: string, ws: WebSocket): void {
  subscriptionManager.addWebSocketConnection(subscriptionId, ws);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Subscription Topic Handler (R5 feature, backported for R4)
 */
export class SubscriptionTopic {
  constructor(
    public resourceType: string,
    public triggers: string[],
    public canFilterBy: string[]
  ) {}

  matches(resource: Resource, event: string): boolean {
    if (resource.resourceType !== this.resourceType) {
      return false;
    }

    return this.triggers.includes(event);
  }
}

// Predefined subscription topics
export const subscriptionTopics = {
  patientAdmission: new SubscriptionTopic("Encounter", ["create"], ["patient", "class", "status"]),
  labResultAvailable: new SubscriptionTopic("Observation", ["create", "update"], [
    "patient",
    "code",
    "category",
  ]),
  medicationPrescribed: new SubscriptionTopic("MedicationRequest", ["create"], [
    "patient",
    "medication",
    "status",
  ]),
  conditionDiagnosed: new SubscriptionTopic("Condition", ["create"], [
    "patient",
    "code",
    "clinical-status",
  ]),
};

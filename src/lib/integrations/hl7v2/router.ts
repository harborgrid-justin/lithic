/**
 * HL7 v2 Message Router
 * Routes HL7 messages based on message type, trigger event, and custom rules
 */

import type { HL7Message, HL7Route, HL7Filter, HL7Acknowledgment } from "@/types/integrations";
import { parseHL7Message } from "@/lib/hl7/parser";
import { buildHL7Message } from "@/lib/hl7/builder";
import { applyTransformations } from "./transforms";
import { generateAcknowledgment } from "./ack-handler";
import { db } from "@/lib/db";

export interface RouteContext {
  message: HL7Message;
  source: string;
  metadata?: Record<string, any>;
}

export interface RouteResult {
  success: boolean;
  routesMatched: number;
  deliveries: Array<{
    route: string;
    destination: string;
    success: boolean;
    error?: string;
    acknowledgment?: HL7Acknowledgment;
  }>;
  error?: string;
}

/**
 * Route Manager
 */
export class MessageRouter {
  private routes: Map<string, HL7Route> = new Map();
  private processors: Map<string, MessageProcessor> = new Map();

  /**
   * Add route
   */
  addRoute(route: HL7Route): void {
    this.routes.set(route.id, route);

    // Sort routes by priority
    const sortedRoutes = Array.from(this.routes.values()).sort(
      (a, b) => b.priority - a.priority
    );

    this.routes.clear();
    sortedRoutes.forEach((r) => this.routes.set(r.id, r));
  }

  /**
   * Remove route
   */
  removeRoute(routeId: string): void {
    this.routes.delete(routeId);
  }

  /**
   * Get route
   */
  getRoute(routeId: string): HL7Route | undefined {
    return this.routes.get(routeId);
  }

  /**
   * List all routes
   */
  listRoutes(): HL7Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Route message
   */
  async routeMessage(context: RouteContext): Promise<RouteResult> {
    const { message, source } = context;
    const result: RouteResult = {
      success: true,
      routesMatched: 0,
      deliveries: [],
    };

    try {
      // Find matching routes
      const matchingRoutes = this.findMatchingRoutes(message, source);

      if (matchingRoutes.length === 0) {
        console.warn(`No routes found for message ${message.messageType}^${message.triggerEvent}`);
        result.success = false;
        result.error = "No matching routes found";
        return result;
      }

      result.routesMatched = matchingRoutes.length;

      // Process each route
      for (const route of matchingRoutes) {
        try {
          const delivery = await this.processRoute(route, message, context);
          result.deliveries.push(delivery);

          if (!delivery.success) {
            result.success = false;
          }
        } catch (error: any) {
          console.error(`Error processing route ${route.id}:`, error);
          result.deliveries.push({
            route: route.id,
            destination: route.destinationSystem,
            success: false,
            error: error.message,
          });
          result.success = false;
        }
      }

      // Log routing
      await this.logRouting(message, result);

      return result;
    } catch (error: any) {
      console.error("Error routing message:", error);
      result.success = false;
      result.error = error.message;
      return result;
    }
  }

  /**
   * Find matching routes
   */
  private findMatchingRoutes(message: HL7Message, source: string): HL7Route[] {
    const matching: HL7Route[] = [];

    for (const route of this.routes.values()) {
      if (!route.active) {
        continue;
      }

      // Check source system
      if (route.sourceSystem !== "*" && route.sourceSystem !== source) {
        continue;
      }

      // Check message type
      if (route.messageType !== "*" && route.messageType !== message.messageType) {
        continue;
      }

      // Check trigger event
      if (route.triggerEvent && route.triggerEvent !== "*" && route.triggerEvent !== message.triggerEvent) {
        continue;
      }

      // Apply filters
      if (route.filters && !this.applyFilters(message, route.filters)) {
        continue;
      }

      matching.push(route);
    }

    return matching;
  }

  /**
   * Apply filters to message
   */
  private applyFilters(message: HL7Message, filters: HL7Filter[]): boolean {
    for (const filter of filters) {
      const value = this.getFieldValue(message, filter.field);

      if (!value) {
        return false;
      }

      switch (filter.operator) {
        case "equals":
          if (value !== filter.value) return false;
          break;
        case "contains":
          if (!value.includes(filter.value)) return false;
          break;
        case "starts_with":
          if (!value.startsWith(filter.value)) return false;
          break;
        case "ends_with":
          if (!value.endsWith(filter.value)) return false;
          break;
        case "regex":
          const regex = new RegExp(filter.value);
          if (!regex.test(value)) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Get field value from message
   */
  private getFieldValue(message: HL7Message, field: string): string | null {
    // Format: SEGMENT-FIELD-COMPONENT-SUBCOMPONENT
    // Example: PID-5-1 (Patient Name - Last Name)
    const parts = field.split("-");
    const segmentName = parts[0];
    const fieldIndex = parseInt(parts[1]) - 1;
    const componentIndex = parts[2] ? parseInt(parts[2]) - 1 : undefined;
    const subComponentIndex = parts[3] ? parseInt(parts[3]) - 1 : undefined;

    const segment = message.segments.find((s) => s.name === segmentName);
    if (!segment) return null;

    const fieldData = segment.fields[fieldIndex];
    if (!fieldData) return null;

    if (typeof fieldData.value === "string") {
      return fieldData.value;
    }

    if (Array.isArray(fieldData.value)) {
      if (componentIndex !== undefined) {
        const component = fieldData.value[componentIndex];
        if (component && subComponentIndex !== undefined) {
          return component.subComponents?.[subComponentIndex] || null;
        }
        return component?.value || null;
      }
      return fieldData.value.map((c) => c.value).join("^");
    }

    return null;
  }

  /**
   * Process route
   */
  private async processRoute(
    route: HL7Route,
    message: HL7Message,
    context: RouteContext
  ): Promise<{
    route: string;
    destination: string;
    success: boolean;
    error?: string;
    acknowledgment?: HL7Acknowledgment;
  }> {
    let transformedMessage = message;

    // Apply transformations
    if (route.transformations && route.transformations.length > 0) {
      transformedMessage = await applyTransformations(message, route.transformations);
    }

    // Get destination processor
    const processor = this.getProcessor(route.destinationSystem);

    if (!processor) {
      throw new Error(`No processor found for destination: ${route.destinationSystem}`);
    }

    // Send message
    try {
      const ack = await processor.process(transformedMessage, {
        route: route.id,
        sourceSystem: route.sourceSystem,
        metadata: context.metadata,
      });

      return {
        route: route.id,
        destination: route.destinationSystem,
        success: ack.acknowledgmentCode === "AA" || ack.acknowledgmentCode === "CA",
        acknowledgment: ack,
      };
    } catch (error: any) {
      return {
        route: route.id,
        destination: route.destinationSystem,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Register message processor
   */
  registerProcessor(systemId: string, processor: MessageProcessor): void {
    this.processors.set(systemId, processor);
  }

  /**
   * Get processor
   */
  private getProcessor(systemId: string): MessageProcessor | undefined {
    return this.processors.get(systemId);
  }

  /**
   * Log routing
   */
  private async logRouting(message: HL7Message, result: RouteResult): Promise<void> {
    try {
      await db.hl7MessageLog.create({
        data: {
          messageControlId: message.messageControlId,
          messageType: message.messageType,
          triggerEvent: message.triggerEvent,
          sendingApplication: message.sendingApplication,
          sendingFacility: message.sendingFacility,
          receivingApplication: message.receivingApplication,
          receivingFacility: message.receivingFacility,
          timestamp: message.timestamp,
          routesMatched: result.routesMatched,
          success: result.success,
          deliveries: JSON.stringify(result.deliveries),
          raw: message.raw,
        },
      });
    } catch (error) {
      console.error("Error logging routing:", error);
    }
  }
}

/**
 * Message Processor Interface
 */
export interface MessageProcessor {
  process(
    message: HL7Message,
    context: {
      route: string;
      sourceSystem: string;
      metadata?: Record<string, any>;
    }
  ): Promise<HL7Acknowledgment>;
}

/**
 * MLLP (Minimal Lower Layer Protocol) Processor
 * Sends messages over TCP using MLLP framing
 */
export class MLLPProcessor implements MessageProcessor {
  constructor(
    private host: string,
    private port: number,
    private timeout: number = 30000
  ) {}

  async process(
    message: HL7Message,
    context: { route: string; sourceSystem: string; metadata?: Record<string, any> }
  ): Promise<HL7Acknowledgment> {
    const net = await import("net");

    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let responseData = "";

      // Set timeout
      client.setTimeout(this.timeout);

      // Connect to destination
      client.connect(this.port, this.host, () => {
        // Build HL7 message
        const messageString = message.raw || buildHL7Message(message);

        // MLLP framing: <VT>message<FS><CR>
        const framedMessage = `\x0B${messageString}\x1C\x0D`;

        // Send message
        client.write(framedMessage);
      });

      // Receive response
      client.on("data", (data) => {
        responseData += data.toString();

        // Check for end of message
        if (responseData.includes("\x1C")) {
          client.end();
        }
      });

      // Connection closed
      client.on("close", () => {
        if (responseData) {
          try {
            // Remove MLLP framing
            const messageText = responseData.replace(/[\x0B\x1C\x0D]/g, "");

            // Parse acknowledgment
            const ackMessage = parseHL7Message(messageText);
            const ack = generateAcknowledgment(ackMessage);

            resolve(ack);
          } catch (error: any) {
            reject(new Error(`Failed to parse acknowledgment: ${error.message}`));
          }
        } else {
          reject(new Error("No response received"));
        }
      });

      // Error handling
      client.on("error", (error) => {
        reject(error);
      });

      client.on("timeout", () => {
        client.destroy();
        reject(new Error("Connection timeout"));
      });
    });
  }
}

/**
 * HTTP Processor
 * Sends messages via HTTP/HTTPS
 */
export class HTTPProcessor implements MessageProcessor {
  constructor(
    private endpoint: string,
    private method: "POST" | "PUT" = "POST",
    private headers?: Record<string, string>
  ) {}

  async process(
    message: HL7Message,
    context: { route: string; sourceSystem: string; metadata?: Record<string, any> }
  ): Promise<HL7Acknowledgment> {
    const messageString = message.raw || buildHL7Message(message);

    const response = await fetch(this.endpoint, {
      method: this.method,
      headers: {
        "Content-Type": "text/plain",
        ...this.headers,
      },
      body: messageString,
    });

    if (!response.ok) {
      return {
        messageControlId: message.messageControlId,
        acknowledgmentCode: "AE",
        textMessage: `HTTP ${response.status}: ${response.statusText}`,
        severity: "E",
      };
    }

    const responseText = await response.text();

    if (responseText) {
      const ackMessage = parseHL7Message(responseText);
      return generateAcknowledgment(ackMessage);
    }

    // Success without ACK
    return {
      messageControlId: message.messageControlId,
      acknowledgmentCode: "AA",
      textMessage: "Message sent successfully",
    };
  }
}

/**
 * Database Processor
 * Stores messages in database
 */
export class DatabaseProcessor implements MessageProcessor {
  async process(
    message: HL7Message,
    context: { route: string; sourceSystem: string; metadata?: Record<string, any> }
  ): Promise<HL7Acknowledgment> {
    try {
      // Store message
      await db.hl7Message.create({
        data: {
          messageControlId: message.messageControlId,
          messageType: message.messageType,
          triggerEvent: message.triggerEvent,
          sendingApplication: message.sendingApplication,
          sendingFacility: message.sendingFacility,
          receivingApplication: message.receivingApplication,
          receivingFacility: message.receivingFacility,
          timestamp: message.timestamp,
          processingId: message.processingId,
          versionId: message.versionId,
          segments: JSON.stringify(message.segments),
          raw: message.raw,
          sourceSystem: context.sourceSystem,
          route: context.route,
        },
      });

      return {
        messageControlId: message.messageControlId,
        acknowledgmentCode: "AA",
        textMessage: "Message stored successfully",
      };
    } catch (error: any) {
      return {
        messageControlId: message.messageControlId,
        acknowledgmentCode: "AE",
        textMessage: `Database error: ${error.message}`,
        errorCondition: "207",
        severity: "E",
      };
    }
  }
}

/**
 * Queue Processor
 * Sends messages to message queue
 */
export class QueueProcessor implements MessageProcessor {
  constructor(private queueName: string) {}

  async process(
    message: HL7Message,
    context: { route: string; sourceSystem: string; metadata?: Record<string, any> }
  ): Promise<HL7Acknowledgment> {
    try {
      // Would integrate with actual queue (RabbitMQ, Kafka, etc.)
      console.log(`Queueing message to ${this.queueName}`);

      // For now, just log
      return {
        messageControlId: message.messageControlId,
        acknowledgmentCode: "AA",
        textMessage: "Message queued successfully",
      };
    } catch (error: any) {
      return {
        messageControlId: message.messageControlId,
        acknowledgmentCode: "AE",
        textMessage: `Queue error: ${error.message}`,
        severity: "E",
      };
    }
  }
}

// Singleton router instance
export const messageRouter = new MessageRouter();

/**
 * Initialize default routes
 */
export function initializeDefaultRoutes(): void {
  // ADT messages to database
  messageRouter.addRoute({
    id: "adt-to-db",
    name: "ADT Messages to Database",
    messageType: "ADT",
    sourceSystem: "*",
    destinationSystem: "database",
    active: true,
    priority: 100,
  });

  // ORU messages to database
  messageRouter.addRoute({
    id: "oru-to-db",
    name: "ORU Messages to Database",
    messageType: "ORU",
    sourceSystem: "*",
    destinationSystem: "database",
    active: true,
    priority: 100,
  });

  // Register processors
  messageRouter.registerProcessor("database", new DatabaseProcessor());
}

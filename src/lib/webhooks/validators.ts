/**
 * Webhook Validators
 * Validate webhook payloads and signatures
 */

import { z } from "zod";
import crypto from "crypto";

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "Webhook URLs must use HTTPS in production",
      };
    }

    // Disallow localhost/private IPs in production
    if (process.env.NODE_ENV === "production") {
      const hostname = parsed.hostname.toLowerCase();

      const privatePatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/,
      ];

      if (privatePatterns.some((pattern) => pattern.test(hostname))) {
        return {
          valid: false,
          error: "Private/localhost URLs are not allowed in production",
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid URL format",
    };
  }
}

/**
 * Validate webhook event type
 */
export function validateEventType(eventType: string): {
  valid: boolean;
  error?: string;
} {
  if (!eventType || eventType.trim().length === 0) {
    return {
      valid: false,
      error: "Event type cannot be empty",
    };
  }

  // Event type should follow pattern: resource.action
  const pattern = /^[a-z_]+\.[a-z_]+$/;
  if (!pattern.test(eventType) && eventType !== "*") {
    return {
      valid: false,
      error:
        'Event type must follow pattern: resource.action (e.g., patient.created) or be "*"',
    };
  }

  return { valid: true };
}

/**
 * Validate webhook secret
 */
export function validateSecret(secret: string): {
  valid: boolean;
  error?: string;
} {
  if (!secret || secret.length < 32) {
    return {
      valid: false,
      error: "Secret must be at least 32 characters long",
    };
  }

  return { valid: true };
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Webhook registration schema
 */
export const WebhookRegistrationSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (url) => validateWebhookUrl(url).valid,
      (url) => ({ message: validateWebhookUrl(url).error || "Invalid URL" }),
    ),
  events: z
    .array(z.string())
    .min(1)
    .refine((events) => events.every((e) => validateEventType(e).valid), {
      message: "Invalid event type format",
    }),
  secret: z.string().min(32).optional(),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().min(0).max(10).default(3),
      backoffMultiplier: z.number().min(1).max(10).default(2),
      initialDelay: z.number().min(100).max(60000).default(1000),
    })
    .optional(),
});

export type WebhookRegistration = z.infer<typeof WebhookRegistrationSchema>;

/**
 * Webhook update schema
 */
export const WebhookUpdateSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (url) => validateWebhookUrl(url).valid,
      (url) => ({ message: validateWebhookUrl(url).error || "Invalid URL" }),
    )
    .optional(),
  events: z
    .array(z.string())
    .min(1)
    .refine((events) => events.every((e) => validateEventType(e).valid), {
      message: "Invalid event type format",
    })
    .optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().min(0).max(10),
      backoffMultiplier: z.number().min(1).max(10),
      initialDelay: z.number().min(100).max(60000),
    })
    .optional(),
});

export type WebhookUpdate = z.infer<typeof WebhookUpdateSchema>;

/**
 * Verify webhook signature from incoming request
 */
export function verifyWebhookSignature(params: {
  payload: string;
  signature: string;
  secret: string;
  timestamp?: string;
  maxAge?: number; // Maximum age in seconds
}): { valid: boolean; error?: string } {
  const { payload, signature, secret, timestamp, maxAge = 300 } = params;

  // Verify timestamp if provided
  if (timestamp) {
    const timestampMs = parseInt(timestamp);
    if (isNaN(timestampMs)) {
      return {
        valid: false,
        error: "Invalid timestamp format",
      };
    }

    const age = (Date.now() - timestampMs) / 1000;
    if (age > maxAge) {
      return {
        valid: false,
        error: "Webhook timestamp too old",
      };
    }

    if (age < -60) {
      return {
        valid: false,
        error: "Webhook timestamp is in the future",
      };
    }
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

    if (!isValid) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Signature verification failed",
    };
  }

  return { valid: true };
}

/**
 * Test webhook endpoint
 */
export async function testWebhookEndpoint(params: {
  url: string;
  secret: string;
  timeout?: number;
}): Promise<{
  success: boolean;
  status?: number;
  error?: string;
  latency?: number;
}> {
  const { url, secret, timeout = 10000 } = params;

  const testPayload = {
    id: crypto.randomUUID(),
    type: "webhook.test",
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: "This is a test webhook delivery",
    },
  };

  const payload = JSON.stringify(testPayload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Test": "true",
        "X-Webhook-Timestamp": testPayload.timestamp,
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      };
    }

    return {
      success: true,
      status: response.status,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Request timeout",
          latency,
        };
      }

      return {
        success: false,
        error: error.message,
        latency,
      };
    }

    return {
      success: false,
      error: "Unknown error",
      latency,
    };
  }
}

/**
 * Rate limit webhook deliveries
 */
export class WebhookRateLimiter {
  private deliveries: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  /**
   * Check if webhook can send (not rate limited)
   */
  canSend(webhookId: string): boolean {
    const now = Date.now();
    const deliveries = this.deliveries.get(webhookId) || [];

    // Remove old deliveries outside the window
    const recent = deliveries.filter((time) => now - time < this.window);
    this.deliveries.set(webhookId, recent);

    return recent.length < this.limit;
  }

  /**
   * Record a delivery
   */
  recordDelivery(webhookId: string): void {
    const deliveries = this.deliveries.get(webhookId) || [];
    deliveries.push(Date.now());
    this.deliveries.set(webhookId, deliveries);
  }

  /**
   * Get remaining quota
   */
  getRemaining(webhookId: string): number {
    const now = Date.now();
    const deliveries = this.deliveries.get(webhookId) || [];
    const recent = deliveries.filter((time) => now - time < this.window);
    return Math.max(0, this.limit - recent.length);
  }

  /**
   * Reset rate limit for webhook
   */
  reset(webhookId: string): void {
    this.deliveries.delete(webhookId);
  }

  /**
   * Clear old data
   */
  cleanup(): void {
    const now = Date.now();
    for (const [webhookId, deliveries] of this.deliveries.entries()) {
      const recent = deliveries.filter((time) => now - time < this.window);
      if (recent.length === 0) {
        this.deliveries.delete(webhookId);
      } else {
        this.deliveries.set(webhookId, recent);
      }
    }
  }
}

/**
 * Sanitize webhook payload for logging
 */
export function sanitizePayload(payload: any): any {
  const sensitive = [
    "password",
    "token",
    "secret",
    "apiKey",
    "ssn",
    "creditCard",
  ];

  if (typeof payload !== "object" || payload === null) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (sensitive.some((s) => lowerKey.includes(s.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate webhook payload size
 */
export function validatePayloadSize(
  payload: string,
  maxSizeBytes: number = 1048576,
): {
  valid: boolean;
  error?: string;
  size: number;
} {
  const size = Buffer.byteLength(payload, "utf8");

  if (size > maxSizeBytes) {
    return {
      valid: false,
      error: `Payload size ${size} bytes exceeds maximum ${maxSizeBytes} bytes`,
      size,
    };
  }

  return {
    valid: true,
    size,
  };
}

/**
 * Default rate limiter instance
 */
export const webhookRateLimiter = new WebhookRateLimiter();

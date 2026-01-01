/**
 * Webhook Validators
 *
 * Validation utilities for webhook subscriptions and payloads
 */

import crypto from 'crypto';
import { WebhookPayload, WebhookEventType } from './manager';

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Validation error
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate webhook URL
 */
export function validateWebhookURL(url: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!url) {
    errors.push('URL is required');
    return { valid: false, errors };
  }

  if (!URL_REGEX.test(url)) {
    errors.push('Invalid URL format');
  }

  // Security checks
  try {
    const parsedUrl = new URL(url);

    // Require HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
      errors.push('HTTPS is required in production');
    }

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();

      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.2') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')
      ) {
        errors.push('Private IP addresses and localhost are not allowed in production');
      }
    }

    // Check for suspicious ports
    const suspiciousPorts = ['22', '23', '25', '3306', '5432', '6379', '27017'];
    if (parsedUrl.port && suspiciousPorts.includes(parsedUrl.port)) {
      errors.push(`Port ${parsedUrl.port} is not allowed`);
    }
  } catch (error) {
    errors.push('Invalid URL');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook events
 */
export function validateWebhookEvents(events: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(events)) {
    errors.push('Events must be an array');
    return { valid: false, errors };
  }

  if (events.length === 0) {
    errors.push('At least one event is required');
    return { valid: false, errors };
  }

  const validEvents: WebhookEventType[] = [
    'patient.created',
    'patient.updated',
    'patient.deleted',
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
    'order.created',
    'order.completed',
    'result.available',
    'prescription.created',
    'prescription.filled',
    'encounter.created',
    'encounter.completed',
    'document.created',
    'billing.claim.created',
    'billing.claim.submitted',
    'billing.payment.received',
  ];

  for (const event of events) {
    if (!validEvents.includes(event)) {
      errors.push(`Invalid event type: ${event}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook secret
 */
export function validateWebhookSecret(secret: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!secret) {
    errors.push('Secret is required');
    return { valid: false, errors };
  }

  if (secret.length < 32) {
    errors.push('Secret must be at least 32 characters long');
  }

  if (!/^[A-Za-z0-9_\-+=\/]+$/.test(secret)) {
    errors.push('Secret contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook headers
 */
export function validateWebhookHeaders(headers?: Record<string, string>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!headers) {
    return { valid: true, errors };
  }

  // Check for reserved headers
  const reservedHeaders = [
    'content-type',
    'content-length',
    'host',
    'connection',
    'transfer-encoding',
  ];

  for (const key of Object.keys(headers)) {
    const lowerKey = key.toLowerCase();

    if (reservedHeaders.includes(lowerKey)) {
      errors.push(`Header '${key}' is reserved and cannot be set`);
    }

    // Validate header name
    if (!/^[A-Za-z0-9\-]+$/.test(key)) {
      errors.push(`Invalid header name: ${key}`);
    }

    // Validate header value
    const value = headers[key];
    if (typeof value !== 'string') {
      errors.push(`Header value for '${key}' must be a string`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook subscription
 */
export function validateWebhookSubscription(subscription: {
  url: string;
  events: WebhookEventType[];
  secret: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
  timeout?: number;
}): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};

  // Validate URL
  const urlValidation = validateWebhookURL(subscription.url);
  if (!urlValidation.valid) {
    errors.url = urlValidation.errors;
  }

  // Validate events
  const eventsValidation = validateWebhookEvents(subscription.events);
  if (!eventsValidation.valid) {
    errors.events = eventsValidation.errors;
  }

  // Validate secret
  const secretValidation = validateWebhookSecret(subscription.secret);
  if (!secretValidation.valid) {
    errors.secret = secretValidation.errors;
  }

  // Validate headers
  const headersValidation = validateWebhookHeaders(subscription.headers);
  if (!headersValidation.valid) {
    errors.headers = headersValidation.errors;
  }

  // Validate retry attempts
  if (subscription.retryAttempts !== undefined) {
    if (!Number.isInteger(subscription.retryAttempts)) {
      errors.retryAttempts = ['Retry attempts must be an integer'];
    } else if (subscription.retryAttempts < 0 || subscription.retryAttempts > 10) {
      errors.retryAttempts = ['Retry attempts must be between 0 and 10'];
    }
  }

  // Validate timeout
  if (subscription.timeout !== undefined) {
    if (!Number.isInteger(subscription.timeout)) {
      errors.timeout = ['Timeout must be an integer'];
    } else if (subscription.timeout < 1000 || subscription.timeout > 60000) {
      errors.timeout = ['Timeout must be between 1000 and 60000 milliseconds'];
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate webhook signature from incoming request
 */
export function validateIncomingWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string,
  timestamp?: string,
  maxAge?: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!signature) {
    errors.push('Signature is required');
    return { valid: false, errors };
  }

  // Validate timestamp if provided
  if (timestamp && maxAge) {
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);

    if (isNaN(requestTime)) {
      errors.push('Invalid timestamp');
    } else if (now - requestTime > maxAge) {
      errors.push('Request timestamp is too old');
    }
  }

  // Verify signature
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      errors.push('Invalid signature');
    }
  } catch (error) {
    errors.push('Signature verification failed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object');
    return { valid: false, errors };
  }

  // Check required fields
  if (!payload.id) {
    errors.push('Payload ID is required');
  }

  if (!payload.event) {
    errors.push('Event type is required');
  }

  if (!payload.timestamp) {
    errors.push('Timestamp is required');
  }

  if (!payload.data) {
    errors.push('Data is required');
  }

  // Validate timestamp format
  if (payload.timestamp) {
    const date = new Date(payload.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('Invalid timestamp format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate secure webhook secret
 */
export function generateWebhookSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Sanitize webhook URL for logging
 */
export function sanitizeWebhookURL(url: string): string {
  try {
    const parsedUrl = new URL(url);

    // Remove sensitive query parameters
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key', 'apikey'];

    for (const param of sensitiveParams) {
      parsedUrl.searchParams.delete(param);
    }

    // Hide username/password
    if (parsedUrl.username || parsedUrl.password) {
      parsedUrl.username = '***';
      parsedUrl.password = '***';
    }

    return parsedUrl.toString();
  } catch (error) {
    return '[invalid-url]';
  }
}

/**
 * Rate limit checker for webhook deliveries
 */
export class WebhookRateLimiter {
  private deliveries: Map<string, number[]> = new Map();

  /**
   * Check if webhook can be delivered (not rate limited)
   */
  canDeliver(subscriptionId: string, maxPerMinute: number = 60): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get recent deliveries
    const timestamps = this.deliveries.get(subscriptionId) || [];

    // Remove old timestamps
    const recent = timestamps.filter((ts) => ts > oneMinuteAgo);

    // Update map
    this.deliveries.set(subscriptionId, recent);

    // Check limit
    return recent.length < maxPerMinute;
  }

  /**
   * Record a delivery
   */
  recordDelivery(subscriptionId: string): void {
    const timestamps = this.deliveries.get(subscriptionId) || [];
    timestamps.push(Date.now());
    this.deliveries.set(subscriptionId, timestamps);
  }

  /**
   * Clear old entries
   */
  cleanup(): void {
    const oneMinuteAgo = Date.now() - 60000;

    for (const [subscriptionId, timestamps] of this.deliveries.entries()) {
      const recent = timestamps.filter((ts) => ts > oneMinuteAgo);

      if (recent.length === 0) {
        this.deliveries.delete(subscriptionId);
      } else {
        this.deliveries.set(subscriptionId, recent);
      }
    }
  }
}

/**
 * Default rate limiter instance
 */
export const webhookRateLimiter = new WebhookRateLimiter();

// Clean up rate limiter every minute
setInterval(() => {
  webhookRateLimiter.cleanup();
}, 60000);

/**
 * CDS Hooks Client
 * External CDS service integration, response handling, and timeout management
 */

import { z } from "zod";
import type {
  CDSService,
  CDSHooksRequest,
  CDSHooksResponse,
  CDSDiscoveryResponse,
  CDSFeedback,
} from "./service";

/**
 * CDS Service Endpoint
 */
export interface CDSServiceEndpoint {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  timeout?: number; // milliseconds
  headers?: Record<string, string>;
  priority?: number;
}

/**
 * CDS Client Configuration
 */
export interface CDSClientConfig {
  defaultTimeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

/**
 * CDS Service Call Result
 */
export interface CDSServiceResult {
  serviceId: string;
  success: boolean;
  response?: CDSHooksResponse;
  error?: string;
  duration: number; // milliseconds
  cached?: boolean;
}

/**
 * Default client configuration
 */
const DEFAULT_CONFIG: CDSClientConfig = {
  defaultTimeout: 5000, // 5 seconds
  retryAttempts: 2,
  retryDelay: 1000, // 1 second
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
};

/**
 * Simple in-memory cache (replace with Redis in production)
 */
class ResponseCache {
  private cache = new Map<string, { data: CDSHooksResponse; expiresAt: number }>();

  set(key: string, data: CDSHooksResponse, ttl: number): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): CDSHooksResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * CDS Hooks Client
 */
export class CDSHooksClient {
  private config: CDSClientConfig;
  private cache: ResponseCache;

  constructor(config: Partial<CDSClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ResponseCache();
  }

  /**
   * Discover available CDS services
   */
  async discoverServices(baseUrl: string): Promise<CDSDiscoveryResponse | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${baseUrl}/cds-services`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
        this.config.defaultTimeout
      );

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data as CDSDiscoveryResponse;
    } catch (error) {
      console.error("Service discovery error:", error);
      return null;
    }
  }

  /**
   * Call a CDS service
   */
  async callService(
    endpoint: CDSServiceEndpoint,
    serviceId: string,
    request: CDSHooksRequest
  ): Promise<CDSServiceResult> {
    const startTime = Date.now();

    try {
      // Check cache
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(endpoint.id, serviceId, request);
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return {
            serviceId,
            success: true,
            response: cached,
            duration: Date.now() - startTime,
            cached: true,
          };
        }
      }

      // Make request
      const url = `${endpoint.baseUrl}/cds-services/${serviceId}`;
      const timeout = endpoint.timeout || this.config.defaultTimeout;

      const response = await this.fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...endpoint.headers,
          },
          body: JSON.stringify(request),
        },
        timeout
      );

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.statusText}`);
      }

      const data = (await response.json()) as CDSHooksResponse;

      // Validate response
      if (!this.validateResponse(data)) {
        throw new Error("Invalid CDS response format");
      }

      // Cache response
      if (this.config.cacheEnabled) {
        const cacheKey = this.getCacheKey(endpoint.id, serviceId, request);
        this.cache.set(cacheKey, data, this.config.cacheTTL);
      }

      return {
        serviceId,
        success: true,
        response: data,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        serviceId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Call multiple CDS services in parallel
   */
  async callMultipleServices(
    endpoints: CDSServiceEndpoint[],
    serviceId: string,
    request: CDSHooksRequest
  ): Promise<CDSServiceResult[]> {
    const promises = endpoints
      .filter((e) => e.enabled)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map((endpoint) => this.callService(endpoint, serviceId, request));

    return Promise.all(promises);
  }

  /**
   * Call service with retry
   */
  async callServiceWithRetry(
    endpoint: CDSServiceEndpoint,
    serviceId: string,
    request: CDSHooksRequest,
    attempts: number = this.config.retryAttempts
  ): Promise<CDSServiceResult> {
    let lastError: string = "";

    for (let i = 0; i <= attempts; i++) {
      const result = await this.callService(endpoint, serviceId, request);

      if (result.success) {
        return result;
      }

      lastError = result.error || "Unknown error";

      // Wait before retry (except on last attempt)
      if (i < attempts) {
        await this.delay(this.config.retryDelay);
      }
    }

    return {
      serviceId,
      success: false,
      error: `Failed after ${attempts + 1} attempts: ${lastError}`,
      duration: 0,
    };
  }

  /**
   * Send feedback to CDS service
   */
  async sendFeedback(
    endpoint: CDSServiceEndpoint,
    serviceId: string,
    feedback: CDSFeedback
  ): Promise<boolean> {
    try {
      const url = `${endpoint.baseUrl}/cds-services/${serviceId}/feedback`;
      const timeout = endpoint.timeout || this.config.defaultTimeout;

      const response = await this.fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...endpoint.headers,
          },
          body: JSON.stringify(feedback),
        },
        timeout
      );

      return response.ok;
    } catch (error) {
      console.error("Feedback error:", error);
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific service
   */
  clearServiceCache(endpointId: string, serviceId: string): void {
    // Clear all entries matching the endpoint and service
    // In production, use a more sophisticated cache with key patterns
    this.cache.clear();
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    endpointId: string,
    serviceId: string,
    request: CDSHooksRequest
  ): string {
    const key = JSON.stringify({
      endpointId,
      serviceId,
      hook: request.hook,
      context: request.context,
    });
    // Simple hash (in production, use a proper hash function)
    return Buffer.from(key).toString("base64");
  }

  /**
   * Validate CDS response
   */
  private validateResponse(response: unknown): boolean {
    try {
      const data = response as CDSHooksResponse;
      return Array.isArray(data.cards) && data.cards.every((card) => card.summary);
    } catch {
      return false;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Merge CDS responses from multiple services
 */
export function mergeCDSResponses(results: CDSServiceResult[]): CDSHooksResponse {
  const cards: CDSHooksResponse["cards"] = [];
  const systemActions: CDSHooksResponse["systemActions"] = [];

  for (const result of results) {
    if (result.success && result.response) {
      cards.push(...result.response.cards);
      if (result.response.systemActions) {
        systemActions.push(...result.response.systemActions);
      }
    }
  }

  return {
    cards,
    systemActions: systemActions.length > 0 ? systemActions : undefined,
  };
}

/**
 * Filter cards by indicator
 */
export function filterCardsByIndicator(
  response: CDSHooksResponse,
  ...indicators: string[]
): CDSHooksResponse {
  return {
    cards: response.cards.filter((card) => indicators.includes(card.indicator)),
    systemActions: response.systemActions,
  };
}

/**
 * Sort cards by priority (critical > warning > info)
 */
export function sortCardsByPriority(response: CDSHooksResponse): CDSHooksResponse {
  const priorityMap: Record<string, number> = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  const sortedCards = [...response.cards].sort((a, b) => {
    const priorityA = priorityMap[a.indicator] || 0;
    const priorityB = priorityMap[b.indicator] || 0;
    return priorityB - priorityA;
  });

  return {
    cards: sortedCards,
    systemActions: response.systemActions,
  };
}

/**
 * Limit number of cards
 */
export function limitCards(response: CDSHooksResponse, maxCards: number): CDSHooksResponse {
  return {
    cards: response.cards.slice(0, maxCards),
    systemActions: response.systemActions,
  };
}

/**
 * Deduplicate cards by summary
 */
export function deduplicateCards(response: CDSHooksResponse): CDSHooksResponse {
  const seen = new Set<string>();
  const uniqueCards = response.cards.filter((card) => {
    if (seen.has(card.summary)) {
      return false;
    }
    seen.add(card.summary);
    return true;
  });

  return {
    cards: uniqueCards,
    systemActions: response.systemActions,
  };
}

/**
 * Create default CDS client instance
 */
export const defaultCDSClient = new CDSHooksClient();

/**
 * Validation schemas
 */
export const CDSServiceEndpointSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string().url(),
  enabled: z.boolean(),
  timeout: z.number().optional(),
  headers: z.record(z.string()).optional(),
  priority: z.number().optional(),
});

export const CDSClientConfigSchema = z.object({
  defaultTimeout: z.number(),
  retryAttempts: z.number(),
  retryDelay: z.number(),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number(),
});

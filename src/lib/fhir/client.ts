/**
 * FHIR R4 Client
 * Enterprise-grade FHIR client with retry logic, rate limiting, and error handling
 */

import { z } from "zod";

const FHIRConfigSchema = z.object({
  baseUrl: z.string().url(),
  version: z.literal("R4").default("R4"),
  timeout: z.number().default(30000),
  maxRetries: z.number().default(3),
  rateLimit: z.number().default(100), // requests per minute
  credentials: z
    .object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      accessToken: z.string().optional(),
    })
    .optional(),
});

type FHIRConfig = z.infer<typeof FHIRConfigSchema>;

interface FHIRResponse<T = any> {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  entry?: Array<{
    resource: T;
    fullUrl?: string;
  }>;
  total?: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
}

interface FHIROperationOutcome {
  resourceType: "OperationOutcome";
  issue: Array<{
    severity: "fatal" | "error" | "warning" | "information";
    code: string;
    diagnostics?: string;
    expression?: string[];
  }>;
}

class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number = 60000; // 1 minute

  constructor(limit: number) {
    this.limit = limit;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.window);

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0]!;
      const waitTime = this.window - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

export class FHIRClient {
  private config: FHIRConfig;
  private rateLimiter: RateLimiter;
  private accessToken?: string;

  constructor(config: Partial<FHIRConfig>) {
    this.config = FHIRConfigSchema.parse(config);
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
    this.accessToken = this.config.credentials?.accessToken;
  }

  /**
   * Authenticate with FHIR server (OAuth2)
   */
  async authenticate(): Promise<void> {
    if (
      !this.config.credentials?.clientId ||
      !this.config.credentials?.clientSecret
    ) {
      throw new Error("Client credentials required for authentication");
    }

    const response = await fetch(`${this.config.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  /**
   * Make a FHIR request with retry logic
   */
  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      retries?: number;
    } = {},
  ): Promise<T> {
    await this.rateLimiter.acquire();

    const retries = options.retries ?? this.config.maxRetries;
    const url = new URL(path, this.config.baseUrl);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/fhir+json",
      "Content-Type": "application/fhir+json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (this.isOperationOutcome(errorData)) {
          const issues = errorData.issue
            .map((i) => i.diagnostics || i.code)
            .join(", ");
          throw new Error(`FHIR Error: ${issues}`);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(Math.pow(2, this.config.maxRetries - retries) * 1000);
        return this.request<T>(method, path, body, {
          ...options,
          retries: retries - 1,
        });
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error.name === "AbortError") return false;
    if (error.message?.includes("FHIR Error")) return false;
    return true;
  }

  private isOperationOutcome(data: any): data is FHIROperationOutcome {
    return data?.resourceType === "OperationOutcome";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Read a resource by ID
   */
  async read<T = any>(resourceType: string, id: string): Promise<T> {
    return this.request<T>("GET", `/${resourceType}/${id}`);
  }

  /**
   * Create a new resource
   */
  async create<T = any>(resourceType: string, resource: any): Promise<T> {
    return this.request<T>("POST", `/${resourceType}`, resource);
  }

  /**
   * Update a resource
   */
  async update<T = any>(
    resourceType: string,
    id: string,
    resource: any,
  ): Promise<T> {
    return this.request<T>("PUT", `/${resourceType}/${id}`, resource);
  }

  /**
   * Delete a resource
   */
  async delete(resourceType: string, id: string): Promise<void> {
    await this.request("DELETE", `/${resourceType}/${id}`);
  }

  /**
   * Search resources
   */
  async search<T = any>(
    resourceType: string,
    params: Record<string, string | string[]>,
  ): Promise<FHIRResponse<T>> {
    const searchParams: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      searchParams[key] = Array.isArray(value) ? value.join(",") : value;
    });

    return this.request<FHIRResponse<T>>("GET", `/${resourceType}`, undefined, {
      params: searchParams,
    });
  }

  /**
   * Execute a FHIR operation
   */
  async operation<T = any>(
    operation: string,
    resourceType?: string,
    id?: string,
    parameters?: any,
  ): Promise<T> {
    let path = "";
    if (resourceType && id) {
      path = `/${resourceType}/${id}/$${operation}`;
    } else if (resourceType) {
      path = `/${resourceType}/$${operation}`;
    } else {
      path = `/$${operation}`;
    }

    return this.request<T>("POST", path, parameters);
  }

  /**
   * Get capability statement
   */
  async capabilities(): Promise<any> {
    return this.request("GET", "/metadata");
  }

  /**
   * Execute a batch/transaction bundle
   */
  async batch(bundle: any): Promise<FHIRResponse> {
    return this.request<FHIRResponse>("POST", "/", bundle);
  }

  /**
   * Paginated search
   */
  async *searchPaginated<T = any>(
    resourceType: string,
    params: Record<string, string | string[]>,
    pageSize: number = 50,
  ): AsyncGenerator<T[], void, unknown> {
    const searchParams = { ...params, _count: String(pageSize) };
    let response = await this.search<T>(resourceType, searchParams);

    if (response.entry) {
      yield response.entry.map((e) => e.resource);
    }

    while (response.link) {
      const nextLink = response.link.find((l) => l.relation === "next");
      if (!nextLink) break;

      response = await this.request<FHIRResponse<T>>("GET", nextLink.url);
      if (response.entry) {
        yield response.entry.map((e) => e.resource);
      }
    }
  }

  /**
   * Validate a resource
   */
  async validate(
    resourceType: string,
    resource: any,
  ): Promise<FHIROperationOutcome> {
    return this.operation<FHIROperationOutcome>(
      "validate",
      resourceType,
      undefined,
      {
        resourceType: "Parameters",
        parameter: [
          {
            name: "resource",
            resource,
          },
        ],
      },
    );
  }

  /**
   * Search with POST (for complex queries)
   */
  async searchPost<T = any>(
    resourceType: string,
    params: Record<string, string | string[]>,
  ): Promise<FHIRResponse<T>> {
    return this.request<FHIRResponse<T>>(
      "POST",
      `/${resourceType}/_search`,
      undefined,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        params: params as Record<string, string>,
      },
    );
  }
}

/**
 * Create a FHIR client instance
 */
export function createFHIRClient(config: Partial<FHIRConfig>): FHIRClient {
  return new FHIRClient(config);
}

/**
 * Default client instance
 */
export const fhirClient = createFHIRClient({
  baseUrl: process.env.FHIR_SERVER_URL || "https://hapi.fhir.org/baseR4",
  credentials: {
    clientId: process.env.FHIR_CLIENT_ID,
    clientSecret: process.env.FHIR_CLIENT_SECRET,
  },
});

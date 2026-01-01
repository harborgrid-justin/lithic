/**
 * FHIR R4 Client
 *
 * Complete FHIR R4 client implementation with authentication,
 * retry logic, rate limiting, and comprehensive error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from '../../utils/logger';

// FHIR Resource Types
export type FHIRResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Observation'
  | 'Condition'
  | 'MedicationRequest'
  | 'MedicationStatement'
  | 'AllergyIntolerance'
  | 'Immunization'
  | 'DiagnosticReport'
  | 'Procedure'
  | 'Encounter'
  | 'CarePlan'
  | 'DocumentReference'
  | 'Organization'
  | 'Location';

// FHIR Bundle Types
export type BundleType = 'searchset' | 'transaction' | 'batch' | 'collection' | 'document';

// FHIR Search Parameters
export interface FHIRSearchParams {
  [key: string]: string | number | boolean | string[];
}

// FHIR Operation Outcome
export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    diagnostics?: string;
    details?: {
      text?: string;
    };
  }>;
}

// FHIR Bundle
export interface Bundle<T = any> {
  resourceType: 'Bundle';
  type: BundleType;
  total?: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry?: Array<{
    fullUrl?: string;
    resource?: T;
    search?: {
      mode: 'match' | 'include';
      score?: number;
    };
    request?: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      url: string;
    };
    response?: {
      status: string;
      location?: string;
      etag?: string;
    };
  }>;
}

// Client Configuration
export interface FHIRClientConfig {
  baseUrl: string;
  credentials?: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  };
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// Retry Configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

/**
 * FHIR R4 HTTP Client
 */
export class FHIRClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private rateLimitRemaining: number = 1000;
  private rateLimitReset: number = Date.now();

  constructor(private config: FHIRClientConfig) {
    this.retryConfig = {
      maxRetries: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
    };

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for auth, logging, and rate limiting
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication
        if (this.config.credentials?.accessToken) {
          config.headers.Authorization = `Bearer ${this.config.credentials.accessToken}`;
        }

        // Rate limiting check
        await this.checkRateLimit();

        logger.debug('FHIR Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info
        this.updateRateLimit(response.headers);

        logger.debug('FHIR Response', {
          status: response.status,
          resourceType: response.data?.resourceType,
        });

        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Check rate limit before making request
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 0 && Date.now() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      logger.warn(`Rate limit exceeded. Waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
  }

  /**
   * Update rate limit from response headers
   */
  private updateRateLimit(headers: any): void {
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitReset = parseInt(headers['x-ratelimit-reset'], 10) * 1000;
    }
  }

  /**
   * Handle errors with retry logic
   */
  private async handleError(error: AxiosError, retryCount: number = 0): Promise<any> {
    const status = error.response?.status;
    const data = error.response?.data as OperationOutcome | undefined;

    // Log error
    logger.error('FHIR Error', {
      status,
      message: error.message,
      operationOutcome: data,
      retryCount,
    });

    // Check if retryable
    if (
      status &&
      this.retryConfig.retryableStatuses.includes(status) &&
      retryCount < this.retryConfig.maxRetries
    ) {
      const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount);
      logger.info(`Retrying FHIR request in ${delay}ms (attempt ${retryCount + 1})`);

      await this.sleep(delay);

      try {
        return await this.client.request(error.config as AxiosRequestConfig);
      } catch (retryError) {
        return this.handleError(retryError as AxiosError, retryCount + 1);
      }
    }

    throw new FHIRError(error.message, status, data);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Read a resource by ID
   */
  async read<T = any>(resourceType: FHIRResourceType, id: string): Promise<T> {
    const response = await this.client.get(`/${resourceType}/${id}`);
    return response.data;
  }

  /**
   * Search resources
   */
  async search<T = any>(
    resourceType: FHIRResourceType,
    params?: FHIRSearchParams
  ): Promise<Bundle<T>> {
    const response = await this.client.get(`/${resourceType}`, { params });
    return response.data;
  }

  /**
   * Create a resource
   */
  async create<T = any>(resourceType: FHIRResourceType, resource: T): Promise<T> {
    const response = await this.client.post(`/${resourceType}`, resource);
    return response.data;
  }

  /**
   * Update a resource
   */
  async update<T = any>(resourceType: FHIRResourceType, id: string, resource: T): Promise<T> {
    const response = await this.client.put(`/${resourceType}/${id}`, resource);
    return response.data;
  }

  /**
   * Patch a resource
   */
  async patch<T = any>(
    resourceType: FHIRResourceType,
    id: string,
    patch: any
  ): Promise<T> {
    const response = await this.client.patch(`/${resourceType}/${id}`, patch, {
      headers: { 'Content-Type': 'application/json-patch+json' },
    });
    return response.data;
  }

  /**
   * Delete a resource
   */
  async delete(resourceType: FHIRResourceType, id: string): Promise<void> {
    await this.client.delete(`/${resourceType}/${id}`);
  }

  /**
   * Execute a transaction or batch bundle
   */
  async transaction<T = any>(bundle: Bundle<T>): Promise<Bundle<T>> {
    const response = await this.client.post('/', bundle);
    return response.data;
  }

  /**
   * Get resource history
   */
  async history<T = any>(
    resourceType: FHIRResourceType,
    id?: string
  ): Promise<Bundle<T>> {
    const url = id ? `/${resourceType}/${id}/_history` : `/${resourceType}/_history`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Execute a FHIR operation
   */
  async operation<T = any>(
    operation: string,
    resourceType?: FHIRResourceType,
    id?: string,
    parameters?: any
  ): Promise<T> {
    let url = '';
    if (resourceType && id) {
      url = `/${resourceType}/${id}/$${operation}`;
    } else if (resourceType) {
      url = `/${resourceType}/$${operation}`;
    } else {
      url = `/$${operation}`;
    }

    const response = await this.client.post(url, parameters);
    return response.data;
  }

  /**
   * Get capability statement
   */
  async capabilities(): Promise<any> {
    const response = await this.client.get('/metadata');
    return response.data;
  }

  /**
   * Validate a resource
   */
  async validate<T = any>(
    resourceType: FHIRResourceType,
    resource: T,
    profile?: string
  ): Promise<OperationOutcome> {
    const params = profile ? { profile } : undefined;
    const response = await this.client.post(
      `/${resourceType}/$validate`,
      resource,
      { params }
    );
    return response.data;
  }

  /**
   * Execute GraphQL query
   */
  async graphql<T = any>(query: string, variables?: any): Promise<T> {
    const response = await this.client.post('/$graphql', {
      query,
      variables,
    });
    return response.data;
  }

  /**
   * Update access token
   */
  setAccessToken(token: string): void {
    this.config.credentials = {
      ...this.config.credentials,
      accessToken: token,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): FHIRClientConfig {
    return { ...this.config };
  }
}

/**
 * FHIR Error class
 */
export class FHIRError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public operationOutcome?: OperationOutcome
  ) {
    super(message);
    this.name = 'FHIRError';
  }
}

/**
 * Create FHIR client instance
 */
export function createFHIRClient(config: FHIRClientConfig): FHIRClient {
  return new FHIRClient(config);
}

/**
 * Default FHIR client from environment
 */
export const defaultFHIRClient = createFHIRClient({
  baseUrl: process.env.FHIR_BASE_URL || 'http://localhost:8080/fhir',
  credentials: {
    clientId: process.env.FHIR_CLIENT_ID,
    clientSecret: process.env.FHIR_CLIENT_SECRET,
    accessToken: process.env.FHIR_ACCESS_TOKEN,
  },
  timeout: parseInt(process.env.FHIR_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.FHIR_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.FHIR_RETRY_DELAY || '1000', 10),
});

/**
 * API Service - Fetch wrapper for backend communication
 */

import { storage } from "./storage";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: any[];
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

class ApiService {
  private baseUrl: string;
  private timeout: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = process.env.API_URL || "http://localhost:3000/api/v1";
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, options);
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options?.params);
      const headers = this.buildHeaders(options?.skipAuth);

      const config: RequestInit = {
        method,
        headers,
        credentials: "include",
        ...options,
      };

      if (data && ["POST", "PUT", "PATCH"].includes(method)) {
        config.body = JSON.stringify(data);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString();

      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Build request headers
   */
  private buildHeaders(skipAuth?: boolean): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    if (!skipAuth) {
      const token = storage.getLocal<string>("auth_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      const error: any = isJson
        ? await response.json()
        : { message: response.statusText };

      throw {
        message: error.message || "Request failed",
        statusCode: response.status,
        errors: error.errors,
      } as ApiError;
    }

    if (response.status === 204) {
      return {
        success: true,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (isJson) {
      return await response.json();
    }

    return {
      success: true,
      data: (await response.text()) as any,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: any): ApiError {
    if (error.name === "AbortError") {
      return {
        message: "Request timeout",
        statusCode: 408,
      };
    }

    if (error.statusCode) {
      return error;
    }

    return {
      message: error.message || "Network error",
      statusCode: 0,
    };
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set timeout
   */
  setTimeout(ms: number): void {
    this.timeout = ms;
  }
}

export const api = new ApiService();
export default api;

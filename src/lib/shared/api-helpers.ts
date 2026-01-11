/**
 * Lithic Healthcare Platform v0.5 - Shared API Helpers
 * Coordination Hub - Agent 13
 *
 * This file contains API utilities and helpers used across all v0.5 modules
 */

import {
  API_BASE_URL,
  API_TIMEOUT,
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY,
  HTTP_STATUS,
} from "./constants";
import { AppError, handleApiError } from "./error-handling";
import type { ApiResponse, PaginationParams } from "@/types/shared";

// ============================================================================
// Request Configuration
// ============================================================================

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
  params?: Record<string, any>;
}

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

// ============================================================================
// Base API Client
// ============================================================================

export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor(
    baseURL: string = API_BASE_URL,
    timeout: number = API_TIMEOUT,
    retries: number = API_RETRY_ATTEMPTS,
    retryDelay: number = API_RETRY_DELAY,
  ) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    this.defaultRetries = retries;
    this.defaultRetryDelay = retryDelay;
  }

  private async getAuthToken(): Promise<string | null> {
    // This should be implemented to get the actual auth token
    // For now, return null or implement based on your auth system
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async buildHeaders(
    customHeaders?: Record<string, string>,
    skipAuth = false,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError(
          "Request timeout",
          "REQUEST_TIMEOUT",
          HTTP_STATUS.REQUEST_TIMEOUT || 408,
        );
      }
      throw error;
    }
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number,
    retryDelay: number,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof AppError && error.statusCode < 500) {
          throw error;
        }

        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1)),
          );
        }
      }
    }

    throw lastError!;
  }

  async request<T = any>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers: customHeaders,
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      skipAuth = false,
    } = options;

    const url = this.buildURL(endpoint);
    const headers = await this.buildHeaders(customHeaders, skipAuth);

    const fetchFn = async (): Promise<ApiResponse<T>> => {
      const response = await this.fetchWithTimeout(
        url,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        },
        timeout,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
          errorData.message || "API request failed",
          errorData.code || "API_ERROR",
          response.status,
          errorData.details,
        );
      }

      const data = await response.json();
      return data as ApiResponse<T>;
    };

    try {
      return await this.retryRequest(fetchFn, retries, retryDelay);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<FetchOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    const url = params ? this.buildURL(endpoint, params) : endpoint;
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  async delete<T = any>(
    endpoint: string,
    options?: Omit<FetchOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// ============================================================================
// Global API Client Instance
// ============================================================================

export const apiClient = new ApiClient();

// ============================================================================
// Convenience Functions
// ============================================================================

export async function get<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<FetchOptions, "method" | "body">,
): Promise<T> {
  const response = await apiClient.get<T>(endpoint, params, options);
  return response.data as T;
}

export async function post<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<FetchOptions, "method">,
): Promise<T> {
  const response = await apiClient.post<T>(endpoint, body, options);
  return response.data as T;
}

export async function put<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<FetchOptions, "method">,
): Promise<T> {
  const response = await apiClient.put<T>(endpoint, body, options);
  return response.data as T;
}

export async function patch<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<FetchOptions, "method">,
): Promise<T> {
  const response = await apiClient.patch<T>(endpoint, body, options);
  return response.data as T;
}

export async function del<T = any>(
  endpoint: string,
  options?: Omit<FetchOptions, "method" | "body">,
): Promise<T> {
  const response = await apiClient.delete<T>(endpoint, options);
  return response.data as T;
}

// ============================================================================
// Pagination Helpers
// ============================================================================

export function buildPaginationParams(params: PaginationParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.append("page", String(params.page));
  searchParams.append("limit", String(params.limit));
  if (params.sortBy) {
    searchParams.append("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.append("sortOrder", params.sortOrder);
  }
  return searchParams;
}

export async function getPaginated<T = any>(
  endpoint: string,
  params: PaginationParams,
  options?: Omit<FetchOptions, "method" | "body">,
): Promise<ApiResponse<T[]>> {
  const searchParams = buildPaginationParams(params);
  return apiClient.get<T[]>(
    `${endpoint}?${searchParams.toString()}`,
    undefined,
    options,
  );
}

// ============================================================================
// File Upload Helpers
// ============================================================================

export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void,
): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, JSON.stringify(value));
    });
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(
          new AppError(
            "File upload failed",
            "UPLOAD_FAILED",
            xhr.status,
          ),
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(new AppError("Network error", "NETWORK_ERROR", 0));
    });

    xhr.open("POST", `${API_BASE_URL}${endpoint}`);

    // Add auth token if available
    apiClient["getAuthToken"]().then((token) => {
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  });
}

export async function uploadMultipleFiles(
  endpoint: string,
  files: File[],
  additionalData?: Record<string, any>,
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<ApiResponse<any>[]> {
  const uploadPromises = files.map((file, index) =>
    uploadFile(
      endpoint,
      file,
      additionalData,
      onProgress ? (progress) => onProgress(index, progress) : undefined,
    ),
  );

  return Promise.all(uploadPromises);
}

// ============================================================================
// Download Helpers
// ============================================================================

export async function downloadFile(
  endpoint: string,
  filename?: string,
): Promise<void> {
  const token = await apiClient["getAuthToken"]();
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new AppError(
      "Download failed",
      "DOWNLOAD_FAILED",
      response.status,
    );
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download =
    filename ||
    response.headers.get("Content-Disposition")?.split("filename=")[1] ||
    "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

// ============================================================================
// Batch Operations
// ============================================================================

export async function batchRequest<T = any>(
  requests: Array<{
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: any;
  }>,
): Promise<ApiResponse<T>[]> {
  const promises = requests.map((req) =>
    apiClient.request<T>(req.endpoint, {
      method: req.method || "GET",
      body: req.body,
    }),
  );

  return Promise.all(promises);
}

export async function batchDelete(
  endpoint: string,
  ids: string[],
): Promise<ApiResponse<any>> {
  return apiClient.post(`${endpoint}/batch-delete`, { ids });
}

export async function batchUpdate<T = any>(
  endpoint: string,
  updates: Array<{ id: string; data: Partial<T> }>,
): Promise<ApiResponse<T[]>> {
  return apiClient.post(`${endpoint}/batch-update`, { updates });
}

// ============================================================================
// Query Building
// ============================================================================

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else if (typeof value === "object") {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  return searchParams.toString();
}

export function parseQueryString(queryString: string): Record<string, any> {
  const params: Record<string, any> = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach((value, key) => {
    try {
      params[key] = JSON.parse(value);
    } catch {
      params[key] = value;
    }
  });

  return params;
}

// ============================================================================
// Response Transformation
// ============================================================================

export function transformResponse<T, R>(
  response: ApiResponse<T>,
  transformer: (data: T) => R,
): ApiResponse<R> {
  return {
    ...response,
    data: response.data ? transformer(response.data) : undefined,
  };
}

export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new AppError(
      response.error?.message || "No data in response",
      response.error?.code || "NO_DATA",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
  return response.data;
}

// ============================================================================
// Cache Helpers
// ============================================================================

const cache = new Map<string, { data: any; timestamp: number }>();

export function getCached<T = any>(
  key: string,
  maxAge: number = 60000,
): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > maxAge) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCached<T = any>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export async function cachedRequest<T = any>(
  endpoint: string,
  options?: FetchOptions,
  cacheKey?: string,
  maxAge: number = 60000,
): Promise<T> {
  const key = cacheKey || `${endpoint}:${JSON.stringify(options)}`;
  const cached = getCached<T>(key, maxAge);

  if (cached !== null) {
    return cached;
  }

  const data = await get<T>(endpoint, undefined, options);
  setCached(key, data);
  return data;
}

// ============================================================================
// WebSocket Helpers
// ============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners = new Map<string, Set<(data: any) => void>>();

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const listeners = this.listeners.get(message.type);
        if (listeners) {
          listeners.forEach((listener) => listener(message.data));
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, data }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ============================================================================
// Export All
// ============================================================================

export default {
  apiClient,
  get,
  post,
  put,
  patch,
  del,
  getPaginated,
  uploadFile,
  uploadMultipleFiles,
  downloadFile,
  batchRequest,
  batchDelete,
  batchUpdate,
  buildQueryString,
  parseQueryString,
  getCached,
  setCached,
  clearCache,
  cachedRequest,
  WebSocketClient,
};

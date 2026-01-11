/**
 * Lithic Healthcare Platform v0.5 - Error Handling Utilities
 * Coordination Hub - Agent 13
 *
 * This file contains error handling utilities used across all v0.5 modules
 */

import { ERROR_CODES, HTTP_STATUS } from "./constants";
import type { ApiError } from "@/types/index";

// ============================================================================
// Custom Error Classes
// ============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: any,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ERROR_CODES.VALIDATION_FAILED,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      details,
    );
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: any) {
    super(
      message,
      ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED,
      details,
    );
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = "Insufficient permissions",
    details?: any,
  ) {
    super(
      message,
      ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN,
      details,
    );
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", details?: any) {
    super(
      `${resource} not found`,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      details,
    );
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      ERROR_CODES.RESOURCE_CONFLICT,
      HTTP_STATUS.CONFLICT,
      details,
    );
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Rate limit exceeded",
    details?: any,
  ) {
    super(
      message,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      details,
    );
    this.name = "RateLimitError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = "Service temporarily unavailable",
    details?: any,
  ) {
    super(
      message,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      details,
    );
    this.name = "ServiceUnavailableError";
  }
}

// ============================================================================
// Module-Specific Error Classes
// ============================================================================

export class MobileError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "MobileError";
  }
}

export class NotificationError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "NotificationError";
  }
}

export class AIError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "AIError";
  }
}

export class VoiceError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "VoiceError";
  }
}

export class RPMError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "RPMError";
  }
}

export class SDOHError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "SDOHError";
  }
}

export class ResearchError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "ResearchError";
  }
}

export class EngagementError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "EngagementError";
  }
}

export class DocumentError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "DocumentError";
  }
}

export class ESignatureError extends AppError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, details);
    this.name = "ESignatureError";
  }
}

// ============================================================================
// Error Handlers
// ============================================================================

export function handleError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as any;
    return new ValidationError("Validation failed", {
      issues: zodError.issues,
    });
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      { stack: error.stack },
    );
  }

  // Handle string errors
  if (typeof error === "string") {
    return new AppError(error);
  }

  // Handle unknown errors
  return new AppError(
    "An unknown error occurred",
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    { error },
  );
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new ServiceUnavailableError("Network error - unable to reach server");
  }

  return handleError(error);
}

export function handleValidationError(error: unknown): ValidationError {
  if (error instanceof ValidationError) {
    return error;
  }

  // Handle Zod errors
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as any;
    const issues = zodError.issues.map((issue: any) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    return new ValidationError("Validation failed", { issues });
  }

  return new ValidationError(
    error instanceof Error ? error.message : "Validation failed",
  );
}

// ============================================================================
// Error Response Builders
// ============================================================================

export function buildErrorResponse(error: AppError): {
  success: false;
  error: ApiError;
} {
  return {
    success: false,
    error: error.toJSON(),
  };
}

export function buildValidationErrorResponse(
  errors: Array<{ field: string; message: string; code: string }>,
): {
  success: false;
  error: ApiError;
} {
  return {
    success: false,
    error: {
      code: ERROR_CODES.VALIDATION_FAILED,
      message: "Validation failed",
      details: { errors },
    },
  };
}

// ============================================================================
// Error Logging
// ============================================================================

export interface ErrorLog {
  error: AppError;
  context?: Record<string, any>;
  userId?: string;
  organizationId?: string;
  timestamp: Date;
}

export class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000;

  log(
    error: AppError,
    context?: Record<string, any>,
    userId?: string,
    organizationId?: string,
  ): void {
    const log: ErrorLog = {
      error,
      context,
      userId,
      organizationId,
      timestamp: new Date(),
    };

    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error logged:", {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        context,
        userId,
        organizationId,
        timestamp: log.timestamp,
      });
    }

    // In production, you would send this to a logging service
    // e.g., Sentry, LogRocket, Datadog, etc.
  }

  getLogs(limit?: number): ErrorLog[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByUser(userId: string): ErrorLog[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  getLogsByOrganization(organizationId: string): ErrorLog[] {
    return this.logs.filter((log) => log.organizationId === organizationId);
  }

  getLogsByCode(code: string): ErrorLog[] {
    return this.logs.filter((log) => log.error.code === code);
  }

  getLogsByTimeRange(startDate: Date, endDate: Date): ErrorLog[] {
    return this.logs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate,
    );
  }
}

export const errorLogger = new ErrorLogger();

// ============================================================================
// Error Utilities
// ============================================================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(
  error: unknown,
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(
  error: unknown,
): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }
  return ERROR_CODES.INTERNAL_SERVER_ERROR;
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

// ============================================================================
// Try-Catch Wrapper
// ============================================================================

export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void,
): Promise<[T | null, AppError | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const appError = handleError(error);
    if (errorHandler) {
      errorHandler(appError);
    }
    return [null, appError];
  }
}

export function tryCatchSync<T>(
  fn: () => T,
  errorHandler?: (error: AppError) => void,
): [T | null, AppError | null] {
  try {
    const result = fn();
    return [result, null];
  } catch (error) {
    const appError = handleError(error);
    if (errorHandler) {
      errorHandler(appError);
    }
    return [null, appError];
  }
}

// ============================================================================
// Error Recovery
// ============================================================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: AppError) => void;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: AppError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = handleError(error);

      // Don't retry on client errors (4xx)
      if (lastError.statusCode >= 400 && lastError.statusCode < 500) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        const retryDelay = backoff ? delay * attempt : delay;
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError!;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeout
      ) {
        this.state = "HALF_OPEN";
        this.failureCount = 0;
      } else {
        throw new ServiceUnavailableError(
          "Circuit breaker is open - service unavailable",
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.threshold) {
        this.state = "OPEN";
      }

      throw handleError(error);
    }
  }

  getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED";
  }
}

// ============================================================================
// Export All
// ============================================================================

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  MobileError,
  NotificationError,
  AIError,
  VoiceError,
  RPMError,
  SDOHError,
  ResearchError,
  EngagementError,
  DocumentError,
  ESignatureError,
  handleError,
  handleApiError,
  handleValidationError,
  buildErrorResponse,
  buildValidationErrorResponse,
  errorLogger,
  tryCatch,
  tryCatchSync,
  withRetry,
  CircuitBreaker,
};

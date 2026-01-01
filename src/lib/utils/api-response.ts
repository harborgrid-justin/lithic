/**
 * API Response Utilities
 * Shared utilities for standardized API responses across all modules
 */

import type { ApiResponse, ApiError, ResponseMeta } from "@/types";

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: ResponseMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  field?: string,
): ApiResponse {
  const error: ApiError = {
    code,
    message,
    details,
    field,
  };

  return {
    success: false,
    error,
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  };
}

/**
 * Common error codes and messages
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  MFA_REQUIRED: "MFA_REQUIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  DUPLICATE: "DUPLICATE",

  // Operations
  OPERATION_FAILED: "OPERATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Healthcare-specific
  PATIENT_NOT_FOUND: "PATIENT_NOT_FOUND",
  ENCOUNTER_NOT_FOUND: "ENCOUNTER_NOT_FOUND",
  APPOINTMENT_CONFLICT: "APPOINTMENT_CONFLICT",
  MEDICATION_INTERACTION: "MEDICATION_INTERACTION",
  ALLERGY_ALERT: "ALLERGY_ALERT",
  CDS_ALERT: "CDS_ALERT",
  HIPAA_VIOLATION: "HIPAA_VIOLATION",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  PHI_ACCESS_DENIED: "PHI_ACCESS_DENIED",
} as const;

/**
 * Standard error messages
 */
export const ErrorMessages = {
  [ErrorCodes.UNAUTHORIZED]: "Authentication required",
  [ErrorCodes.FORBIDDEN]: "Access denied",
  [ErrorCodes.INVALID_TOKEN]: "Invalid authentication token",
  [ErrorCodes.TOKEN_EXPIRED]: "Authentication token has expired",
  [ErrorCodes.SESSION_EXPIRED]: "Session has expired",
  [ErrorCodes.MFA_REQUIRED]: "Multi-factor authentication required",

  [ErrorCodes.VALIDATION_ERROR]: "Validation error",
  [ErrorCodes.INVALID_INPUT]: "Invalid input provided",
  [ErrorCodes.MISSING_REQUIRED_FIELD]: "Required field is missing",
  [ErrorCodes.INVALID_FORMAT]: "Invalid format",

  [ErrorCodes.NOT_FOUND]: "Resource not found",
  [ErrorCodes.ALREADY_EXISTS]: "Resource already exists",
  [ErrorCodes.CONFLICT]: "Conflicting resource",
  [ErrorCodes.DUPLICATE]: "Duplicate entry",

  [ErrorCodes.OPERATION_FAILED]: "Operation failed",
  [ErrorCodes.INTERNAL_ERROR]: "Internal server error",
  [ErrorCodes.DATABASE_ERROR]: "Database error",
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: "External service error",

  [ErrorCodes.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
  [ErrorCodes.TOO_MANY_REQUESTS]: "Too many requests",

  [ErrorCodes.PATIENT_NOT_FOUND]: "Patient not found",
  [ErrorCodes.ENCOUNTER_NOT_FOUND]: "Encounter not found",
  [ErrorCodes.APPOINTMENT_CONFLICT]: "Appointment time conflict",
  [ErrorCodes.MEDICATION_INTERACTION]: "Medication interaction detected",
  [ErrorCodes.ALLERGY_ALERT]: "Allergy alert",
  [ErrorCodes.CDS_ALERT]: "Clinical decision support alert",
  [ErrorCodes.HIPAA_VIOLATION]: "HIPAA compliance violation",
  [ErrorCodes.CONSENT_REQUIRED]: "Patient consent required",
  [ErrorCodes.PHI_ACCESS_DENIED]: "PHI access denied",
} as const;

/**
 * Create a standard error response with predefined code
 */
export function standardError(
  code: keyof typeof ErrorCodes,
  customMessage?: string,
  details?: Record<string, any>,
): ApiResponse {
  return errorResponse(
    ErrorCodes[code],
    customMessage || ErrorMessages[code],
    details,
  );
}

/**
 * Handle error and return formatted response
 */
export function handleApiError(error: unknown): ApiResponse {
  console.error("API Error:", error);

  if (error instanceof Error) {
    // Check for specific error types
    if (error.name === "ValidationError") {
      return standardError("VALIDATION_ERROR", error.message);
    }

    if (error.name === "UnauthorizedError") {
      return standardError("UNAUTHORIZED", error.message);
    }

    if (error.name === "NotFoundError") {
      return standardError("NOT_FOUND", error.message);
    }

    // Generic error
    return errorResponse("INTERNAL_ERROR", error.message);
  }

  return standardError("INTERNAL_ERROR");
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 20));

  return { page: validatedPage, limit: validatedLimit };
}

/**
 * Extract error message from unknown error
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unknown error occurred";
}

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true;
}

/**
 * Check if response is error
 */
export function isErrorResponse(
  response: ApiResponse,
): response is ApiResponse & { success: false; error: ApiError } {
  return response.success === false;
}

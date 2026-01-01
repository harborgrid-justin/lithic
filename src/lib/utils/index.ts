/**
 * Shared Utilities Index
 * Central export point for all shared utilities
 */

// API Response utilities
export * from "./api-response";

// Validation utilities
export * from "./validation";

// Date utilities
export * from "./date-utils";

// Re-export commonly used utilities from parent utils.ts
export {
  cn,
  formatCurrency,
  formatPhoneNumber,
  formatPhone,
  truncate,
  sleep,
  isEmpty,
  capitalize,
  maskSSN,
  calculateBMI,
  handleError,
} from "../utils";

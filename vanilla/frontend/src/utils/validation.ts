/**
 * Validation Utility Functions
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === "1");
};

/**
 * Validate SSN
 */
export const isValidSSN = (ssn: string): boolean => {
  const cleaned = ssn.replace(/\D/g, "");
  return cleaned.length === 9;
};

/**
 * Validate ZIP code
 */
export const isValidZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date
 */
export const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
};

/**
 * Validate min length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate max length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate number range
 */
export const isInRange = (num: number, min: number, max: number): boolean => {
  return num >= min && num <= max;
};

/**
 * Validate credit card (Luhn algorithm)
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate form with multiple rules
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule[]>,
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const fieldValue = data[field];
    const fieldErrors: string[] = [];

    fieldRules.forEach((rule) => {
      if (!rule.validate(fieldValue)) {
        fieldErrors.push(rule.message);
      }
    });

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return errors;
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message: string = "This field is required"): ValidationRule => ({
    validate: isRequired,
    message,
  }),

  email: (message: string = "Invalid email address"): ValidationRule => ({
    validate: isValidEmail,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => hasMinLength(value, min),
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => hasMaxLength(value, max),
    message: message || `Must be no more than ${max} characters`,
  }),

  phoneNumber: (message: string = "Invalid phone number"): ValidationRule => ({
    validate: isValidPhoneNumber,
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  custom: (
    validator: (value: any) => boolean,
    message: string,
  ): ValidationRule => ({
    validate: validator,
    message,
  }),
};

/**
 * Sanitize input (remove HTML tags)
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/<[^>]*>/g, "");
};

/**
 * Escape HTML
 */
export const escapeHtml = (html: string): string => {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};

const validationUtils = {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidSSN,
  isValidZipCode,
  isValidUrl,
  isValidDate,
  isValidDateRange,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isInRange,
  isValidCreditCard,
  validateForm,
  validationRules,
  sanitizeInput,
  escapeHtml,
};

export default validationUtils;

/**
 * Shared Validation Utilities
 * Common validation functions used across all modules
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === "1");
}

/**
 * Validate SSN format
 */
export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, "");
  return cleaned.length === 9;
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d <= new Date();
}

/**
 * Validate date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date();
}

/**
 * Validate date range
 */
export function isValidDateRange(
  startDate: Date | string,
  endDate: Date | string,
): boolean {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  return start <= end;
}

/**
 * Validate age is within range
 */
export function isValidAge(age: number, min = 0, max = 150): boolean {
  return age >= min && age <= max;
}

/**
 * Validate NPI (National Provider Identifier) - 10 digits
 */
export function isValidNPI(npi: string): boolean {
  const cleaned = npi.replace(/\D/g, "");
  return cleaned.length === 10;
}

/**
 * Validate DEA number format
 */
export function isValidDEANumber(dea: string): boolean {
  // DEA format: 2 letters + 7 digits
  const deaRegex = /^[A-Z]{2}\d{7}$/;
  return deaRegex.test(dea);
}

/**
 * Validate ZIP code (US)
 */
export function isValidZipCode(zip: string): boolean {
  const fiveDigit = /^\d{5}$/;
  const nineDigit = /^\d{5}-\d{4}$/;
  return fiveDigit.test(zip) || nineDigit.test(zip);
}

/**
 * Validate ICD-10 code format
 */
export function isValidICD10Code(code: string): boolean {
  // ICD-10: 3-7 characters, starts with letter
  const icdRegex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
  return icdRegex.test(code);
}

/**
 * Validate CPT code format
 */
export function isValidCPTCode(code: string): boolean {
  // CPT: 5 digits
  const cptRegex = /^\d{5}$/;
  return cptRegex.test(code);
}

/**
 * Validate NDC (National Drug Code) format
 */
export function isValidNDC(ndc: string): boolean {
  const cleaned = ndc.replace(/[-\s]/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validate LOINC code format
 */
export function isValidLOINCCode(code: string): boolean {
  // LOINC: 5 digits, dash, 1 digit
  const loincRegex = /^\d{5}-\d$/;
  return loincRegex.test(code);
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate string length
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  const length = str.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate number range
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Validate positive number
 */
export function isPositive(num: number): boolean {
  return num > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegative(num: number): boolean {
  return num >= 0;
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(num: number): boolean {
  return num >= 0 && num <= 100;
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate MRN (Medical Record Number) format
 * Customize based on your organization's format
 */
export function isValidMRN(mrn: string): boolean {
  // Example: 8-10 alphanumeric characters
  const mrnRegex = /^[A-Z0-9]{8,10}$/;
  return mrnRegex.test(mrn);
}

/**
 * Validate blood pressure format
 */
export function isValidBloodPressure(bp: string): boolean {
  const bpRegex = /^\d{2,3}\/\d{2,3}$/;
  if (!bpRegex.test(bp)) return false;

  const [systolic, diastolic] = bp.split("/").map(Number);
  return (
    systolic >= 70 &&
    systolic <= 250 &&
    diastolic >= 40 &&
    diastolic <= 150 &&
    systolic > diastolic
  );
}

/**
 * Validate temperature
 */
export function isValidTemperature(temp: number, unit: "F" | "C"): boolean {
  if (unit === "F") {
    return temp >= 95 && temp <= 107; // Fahrenheit range
  } else {
    return temp >= 35 && temp <= 42; // Celsius range
  }
}

/**
 * Validate heart rate
 */
export function isValidHeartRate(hr: number): boolean {
  return hr >= 30 && hr <= 250;
}

/**
 * Validate oxygen saturation
 */
export function isValidOxygenSaturation(spo2: number): boolean {
  return spo2 >= 70 && spo2 <= 100;
}

/**
 * Validate respiratory rate
 */
export function isValidRespiratoryRate(rr: number): boolean {
  return rr >= 8 && rr <= 60;
}

/**
 * Validate weight
 */
export function isValidWeight(weight: number, unit: "kg" | "lb"): boolean {
  if (unit === "kg") {
    return weight >= 0.5 && weight <= 500;
  } else {
    return weight >= 1 && weight <= 1100;
  }
}

/**
 * Validate height
 */
export function isValidHeight(height: number, unit: "cm" | "in"): boolean {
  if (unit === "cm") {
    return height >= 30 && height <= 250;
  } else {
    return height >= 12 && height <= 100;
  }
}

/**
 * Validate IP address (IPv4)
 */
export function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split(".").map(Number);
  return parts.every((part) => part >= 0 && part <= 255);
}

/**
 * Validate time string (HH:MM format)
 */
export function isValidTimeString(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Sanitize string input
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

/**
 * Validate array has items
 */
export function hasItems<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate object has keys
 */
export function hasKeys(obj: Record<string, any>): boolean {
  return Object.keys(obj).length > 0;
}

/**
 * Create validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation helper class
 */
export class Validator {
  private errors: string[] = [];

  required(value: any, fieldName: string): this {
    if (!isRequired(value)) {
      this.errors.push(`${fieldName} is required`);
    }
    return this;
  }

  email(value: string, fieldName: string): this {
    if (value && !isValidEmail(value)) {
      this.errors.push(`${fieldName} must be a valid email`);
    }
    return this;
  }

  phone(value: string, fieldName: string): this {
    if (value && !isValidPhoneNumber(value)) {
      this.errors.push(`${fieldName} must be a valid phone number`);
    }
    return this;
  }

  length(value: string, min: number, max: number, fieldName: string): this {
    if (value && !isValidLength(value, min, max)) {
      this.errors.push(
        `${fieldName} must be between ${min} and ${max} characters`,
      );
    }
    return this;
  }

  range(value: number, min: number, max: number, fieldName: string): this {
    if (value !== undefined && value !== null && !isInRange(value, min, max)) {
      this.errors.push(`${fieldName} must be between ${min} and ${max}`);
    }
    return this;
  }

  custom(condition: boolean, message: string): this {
    if (!condition) {
      this.errors.push(message);
    }
    return this;
  }

  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
    };
  }

  reset(): void {
    this.errors = [];
  }
}

/**
 * Create a new validator instance
 */
export function createValidator(): Validator {
  return new Validator();
}

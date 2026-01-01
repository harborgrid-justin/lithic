/**
 * HL7 v2 Message Transformations
 * Transform and map HL7 messages between different formats and systems
 */

import type { HL7Message, HL7Segment, HL7Transform, HL7Component } from "@/types/integrations";
import { parseHL7Message } from "@/lib/hl7/parser";
import { buildHL7Message } from "@/lib/hl7/builder";

export interface TransformRule {
  id: string;
  name: string;
  description?: string;
  sourceField: string;
  targetField: string;
  transformType: "copy" | "map" | "function" | "lookup" | "concat" | "split" | "default";
  transformValue?: string | Record<string, string> | ((value: string) => string);
  required?: boolean;
  defaultValue?: string;
}

export interface TransformContext {
  message: HL7Message;
  lookupTables?: Map<string, Map<string, string>>;
  variables?: Record<string, string>;
}

/**
 * Apply transformations to message
 */
export async function applyTransformations(
  message: HL7Message,
  transformIds: string[]
): Promise<HL7Message> {
  let transformedMessage = { ...message };

  for (const transformId of transformIds) {
    const transform = await getTransform(transformId);
    if (transform) {
      transformedMessage = await applyTransform(transformedMessage, transform);
    }
  }

  return transformedMessage;
}

/**
 * Apply single transform
 */
export async function applyTransform(
  message: HL7Message,
  transform: HL7Transform
): Promise<HL7Message> {
  const context: TransformContext = {
    message,
    lookupTables: await loadLookupTables(),
  };

  const transformed = { ...message };

  // Get source value
  const sourceValue = getFieldValue(context, transform.sourceField);

  if (!sourceValue && transform.required) {
    throw new Error(`Required field ${transform.sourceField} not found`);
  }

  // Transform value
  const transformedValue = transformValue(sourceValue || "", transform, context);

  // Set target value
  setFieldValue(transformed, transform.targetField, transformedValue);

  return transformed;
}

/**
 * Apply transform rules
 */
export async function applyTransformRules(
  message: HL7Message,
  rules: TransformRule[]
): Promise<HL7Message> {
  const context: TransformContext = {
    message,
    lookupTables: await loadLookupTables(),
    variables: {},
  };

  const transformed = { ...message };

  for (const rule of rules) {
    try {
      const sourceValue = getFieldValue(context, rule.sourceField);

      if (!sourceValue && rule.required) {
        if (rule.defaultValue) {
          setFieldValue(transformed, rule.targetField, rule.defaultValue);
          continue;
        }
        throw new Error(`Required field ${rule.sourceField} not found`);
      }

      const transformedValue = applyTransformRule(sourceValue || "", rule, context);
      setFieldValue(transformed, rule.targetField, transformedValue);

      // Store in variables for later use
      if (context.variables) {
        context.variables[rule.targetField] = transformedValue;
      }
    } catch (error: any) {
      console.error(`Error applying transform rule ${rule.id}:`, error);
      throw error;
    }
  }

  // Update message
  context.message = transformed;

  return transformed;
}

/**
 * Transform value based on type
 */
function transformValue(value: string, transform: HL7Transform, context: TransformContext): string {
  switch (transform.transformType) {
    case "copy":
      return value;

    case "map":
      if (typeof transform.transformValue === "object") {
        return transform.transformValue[value] || value;
      }
      return value;

    case "lookup":
      if (typeof transform.transformValue === "string") {
        const lookupTable = context.lookupTables?.get(transform.transformValue);
        return lookupTable?.get(value) || value;
      }
      return value;

    case "function":
      if (typeof transform.transformValue === "function") {
        return transform.transformValue(value);
      }
      return value;

    default:
      return value;
  }
}

/**
 * Apply transform rule
 */
function applyTransformRule(value: string, rule: TransformRule, context: TransformContext): string {
  switch (rule.transformType) {
    case "copy":
      return value;

    case "map":
      if (typeof rule.transformValue === "object") {
        return rule.transformValue[value] || rule.defaultValue || value;
      }
      return value;

    case "lookup":
      if (typeof rule.transformValue === "string") {
        const lookupTable = context.lookupTables?.get(rule.transformValue);
        return lookupTable?.get(value) || rule.defaultValue || value;
      }
      return value;

    case "function":
      if (typeof rule.transformValue === "function") {
        return rule.transformValue(value);
      }
      return value;

    case "concat":
      // Concatenate multiple fields
      // transformValue should be an array of field names
      if (typeof rule.transformValue === "string") {
        const fields = rule.transformValue.split(",");
        const values = fields.map((field) => getFieldValue(context, field.trim()));
        return values.filter(Boolean).join(" ");
      }
      return value;

    case "split":
      // Split field and take specific part
      // transformValue should be "delimiter:index"
      if (typeof rule.transformValue === "string") {
        const [delimiter, indexStr] = rule.transformValue.split(":");
        const index = parseInt(indexStr);
        const parts = value.split(delimiter);
        return parts[index] || rule.defaultValue || "";
      }
      return value;

    case "default":
      return value || rule.defaultValue || "";

    default:
      return value;
  }
}

/**
 * Get field value from message
 */
function getFieldValue(context: TransformContext, fieldPath: string): string | null {
  const { message, variables } = context;

  // Check if it's a variable reference
  if (fieldPath.startsWith("$")) {
    return variables?.[fieldPath.substring(1)] || null;
  }

  // Parse field path: SEGMENT-FIELD-COMPONENT-SUBCOMPONENT
  const parts = fieldPath.split("-");
  const segmentName = parts[0];
  const fieldIndex = parseInt(parts[1]) - 1;
  const componentIndex = parts[2] ? parseInt(parts[2]) - 1 : undefined;
  const subComponentIndex = parts[3] ? parseInt(parts[3]) - 1 : undefined;

  const segment = message.segments.find((s) => s.name === segmentName);
  if (!segment) return null;

  const field = segment.fields[fieldIndex];
  if (!field) return null;

  if (typeof field.value === "string") {
    return field.value;
  }

  if (Array.isArray(field.value)) {
    if (componentIndex !== undefined) {
      const component = field.value[componentIndex];
      if (component && subComponentIndex !== undefined) {
        return component.subComponents?.[subComponentIndex] || null;
      }
      return component?.value || null;
    }
    return field.value.map((c) => c.value).join("^");
  }

  return null;
}

/**
 * Set field value in message
 */
function setFieldValue(message: HL7Message, fieldPath: string, value: string): void {
  // Parse field path
  const parts = fieldPath.split("-");
  const segmentName = parts[0];
  const fieldIndex = parseInt(parts[1]) - 1;
  const componentIndex = parts[2] ? parseInt(parts[2]) - 1 : undefined;
  const subComponentIndex = parts[3] ? parseInt(parts[3]) - 1 : undefined;

  // Find or create segment
  let segment = message.segments.find((s) => s.name === segmentName);
  if (!segment) {
    segment = {
      name: segmentName,
      fields: [],
      raw: "",
    };
    message.segments.push(segment);
  }

  // Ensure field exists
  while (segment.fields.length <= fieldIndex) {
    segment.fields.push({ value: "" });
  }

  // Set value
  if (componentIndex === undefined) {
    segment.fields[fieldIndex].value = value;
  } else {
    // Handle component
    if (typeof segment.fields[fieldIndex].value === "string") {
      // Convert to component array
      segment.fields[fieldIndex].value = [{ value: segment.fields[fieldIndex].value as string }];
    }

    const components = segment.fields[fieldIndex].value as HL7Component[];

    // Ensure component exists
    while (components.length <= componentIndex) {
      components.push({ value: "" });
    }

    if (subComponentIndex === undefined) {
      components[componentIndex].value = value;
    } else {
      // Handle subcomponent
      if (!components[componentIndex].subComponents) {
        components[componentIndex].subComponents = [];
      }

      while (components[componentIndex].subComponents!.length <= subComponentIndex) {
        components[componentIndex].subComponents!.push("");
      }

      components[componentIndex].subComponents![subComponentIndex] = value;
    }
  }

  // Update raw segment
  segment.raw = buildSegmentString(segment);
}

/**
 * Build segment string from segment object
 */
function buildSegmentString(segment: HL7Segment): string {
  const fieldStrings = segment.fields.map((field) => {
    if (typeof field.value === "string") {
      return field.value;
    }

    if (Array.isArray(field.value)) {
      return field.value
        .map((component) => {
          if (component.subComponents && component.subComponents.length > 0) {
            return component.subComponents.join("&");
          }
          return component.value;
        })
        .join("^");
    }

    return "";
  });

  return `${segment.name}|${fieldStrings.join("|")}`;
}

/**
 * Common transformation functions
 */
export const transformFunctions = {
  // Convert to uppercase
  uppercase: (value: string) => value.toUpperCase(),

  // Convert to lowercase
  lowercase: (value: string) => value.toLowerCase(),

  // Trim whitespace
  trim: (value: string) => value.trim(),

  // Format date
  formatDate: (value: string, format: string = "YYYYMMDD") => {
    // Simple date formatting - would use a library like date-fns in production
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day);
  },

  // Parse HL7 date to ISO
  hl7DateToISO: (value: string) => {
    // HL7 format: YYYYMMDD or YYYYMMDDHHMMSS
    if (value.length === 8) {
      return `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`;
    } else if (value.length >= 14) {
      return `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}T${value.substring(8, 10)}:${value.substring(10, 12)}:${value.substring(12, 14)}`;
    }
    return value;
  },

  // ISO date to HL7
  isoDateToHL7: (value: string) => {
    return value.replace(/[-:T]/g, "").substring(0, 14);
  },

  // Format phone number
  formatPhone: (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    return value;
  },

  // Clean phone number
  cleanPhone: (value: string) => {
    return value.replace(/\D/g, "");
  },

  // Format SSN
  formatSSN: (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5)}`;
    }
    return value;
  },

  // Clean SSN
  cleanSSN: (value: string) => {
    return value.replace(/\D/g, "");
  },

  // Pad left
  padLeft: (value: string, length: number, char: string = "0") => {
    return value.padStart(length, char);
  },

  // Pad right
  padRight: (value: string, length: number, char: string = " ") => {
    return value.padEnd(length, char);
  },

  // Replace
  replace: (value: string, search: string, replacement: string) => {
    return value.replace(new RegExp(search, "g"), replacement);
  },

  // Substring
  substring: (value: string, start: number, end?: number) => {
    return value.substring(start, end);
  },

  // Default if empty
  defaultIfEmpty: (value: string, defaultValue: string) => {
    return value || defaultValue;
  },
};

/**
 * Load lookup tables
 */
async function loadLookupTables(): Promise<Map<string, Map<string, string>>> {
  const tables = new Map<string, Map<string, string>>();

  // Gender mapping
  const genderMap = new Map<string, string>([
    ["M", "male"],
    ["F", "female"],
    ["O", "other"],
    ["U", "unknown"],
  ]);
  tables.set("gender", genderMap);

  // Race mapping
  const raceMap = new Map<string, string>([
    ["1002-5", "American Indian or Alaska Native"],
    ["2028-9", "Asian"],
    ["2054-5", "Black or African American"],
    ["2076-8", "Native Hawaiian or Other Pacific Islander"],
    ["2106-3", "White"],
    ["2131-1", "Other Race"],
  ]);
  tables.set("race", raceMap);

  // Marital status mapping
  const maritalStatusMap = new Map<string, string>([
    ["A", "Separated"],
    ["D", "Divorced"],
    ["M", "Married"],
    ["S", "Single"],
    ["W", "Widowed"],
  ]);
  tables.set("maritalStatus", maritalStatusMap);

  // Add more lookup tables as needed

  return tables;
}

/**
 * Get transform by ID
 */
async function getTransform(transformId: string): Promise<HL7Transform | null> {
  // Would load from database or configuration
  // For now, return null
  return null;
}

/**
 * Create message transformation template
 */
export function createTransformTemplate(
  sourceMessageType: string,
  targetMessageType: string
): TransformRule[] {
  const rules: TransformRule[] = [];

  // Common MSH mappings
  rules.push({
    id: "msh-sending-app",
    name: "Sending Application",
    sourceField: "MSH-3",
    targetField: "MSH-3",
    transformType: "copy",
    required: true,
  });

  rules.push({
    id: "msh-sending-facility",
    name: "Sending Facility",
    sourceField: "MSH-4",
    targetField: "MSH-4",
    transformType: "copy",
    required: true,
  });

  // Add more mappings based on message types
  if (sourceMessageType === "ADT" && targetMessageType === "ADT") {
    // PID mappings
    rules.push({
      id: "pid-patient-id",
      name: "Patient ID",
      sourceField: "PID-3-1",
      targetField: "PID-3-1",
      transformType: "copy",
      required: true,
    });

    rules.push({
      id: "pid-patient-name",
      name: "Patient Name",
      sourceField: "PID-5",
      targetField: "PID-5",
      transformType: "copy",
      required: true,
    });

    rules.push({
      id: "pid-dob",
      name: "Date of Birth",
      sourceField: "PID-7",
      targetField: "PID-7",
      transformType: "copy",
    });

    rules.push({
      id: "pid-gender",
      name: "Gender",
      sourceField: "PID-8",
      targetField: "PID-8",
      transformType: "lookup",
      transformValue: "gender",
    });
  }

  return rules;
}

/**
 * Validate transformation
 */
export async function validateTransformation(
  sourceMessage: HL7Message,
  rules: TransformRule[]
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of rules) {
    const context: TransformContext = {
      message: sourceMessage,
    };

    const sourceValue = getFieldValue(context, rule.sourceField);

    if (rule.required && !sourceValue) {
      errors.push(`Required field ${rule.sourceField} is missing`);
    }

    if (!sourceValue && !rule.defaultValue) {
      warnings.push(`Field ${rule.sourceField} is empty and has no default value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

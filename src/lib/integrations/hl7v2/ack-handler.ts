/**
 * HL7 v2 Acknowledgment Handler
 * Generate and parse HL7 ACK/NACK messages
 */

import type { HL7Message, HL7Acknowledgment } from "@/types/integrations";
import { buildHL7Message } from "@/lib/hl7/builder";

/**
 * Generate acknowledgment message
 */
export function generateAcknowledgment(
  originalMessage: HL7Message | string,
  ackCode: "AA" | "AE" | "AR" | "CA" | "CE" | "CR" = "AA",
  textMessage?: string,
  errorCondition?: string
): HL7Acknowledgment {
  let message: HL7Message;

  if (typeof originalMessage === "string") {
    // Parse minimal info from string
    const lines = originalMessage.split("\r");
    const mshSegment = lines[0];
    const fields = mshSegment.split("|");

    message = {
      id: "",
      messageType: fields[8]?.split("^")[0] || "",
      triggerEvent: fields[8]?.split("^")[1] || "",
      sendingApplication: fields[2] || "",
      sendingFacility: fields[3] || "",
      receivingApplication: fields[4] || "",
      receivingFacility: fields[5] || "",
      timestamp: new Date(),
      messageControlId: fields[9] || "",
      processingId: (fields[10] as any) || "P",
      versionId: fields[11] || "2.5",
      segments: [],
    };
  } else {
    message = originalMessage;
  }

  return {
    messageControlId: message.messageControlId,
    acknowledgmentCode: ackCode,
    textMessage,
    errorCondition,
    severity: ackCode.startsWith("A") ? undefined : "E",
  };
}

/**
 * Build ACK message string
 */
export function buildAcknowledgmentMessage(
  originalMessage: HL7Message,
  ack: HL7Acknowledgment
): string {
  const timestamp = formatHL7DateTime(new Date());
  const messageControlId = generateMessageControlId();

  // Swap sending and receiving applications/facilities
  const sendingApp = originalMessage.receivingApplication;
  const sendingFacility = originalMessage.receivingFacility;
  const receivingApp = originalMessage.sendingApplication;
  const receivingFacility = originalMessage.sendingFacility;

  // Build MSH segment
  const msh = [
    "MSH",
    "|",
    "^~\\&",
    sendingApp,
    sendingFacility,
    receivingApp,
    receivingFacility,
    timestamp,
    "",
    `ACK^${originalMessage.triggerEvent}`,
    messageControlId,
    originalMessage.processingId,
    originalMessage.versionId,
  ].join("|");

  // Build MSA segment
  const msa = [
    "MSA",
    ack.acknowledgmentCode,
    originalMessage.messageControlId,
    ack.textMessage || getAckText(ack.acknowledgmentCode),
  ].join("|");

  const segments = [msh, msa];

  // Add ERR segment if error
  if (ack.errorCondition) {
    const err = ["ERR", "", "", ack.errorCondition, ack.severity || "E", "", "", "", ack.textMessage || ""].join(
      "|"
    );
    segments.push(err);
  }

  return segments.join("\r");
}

/**
 * Parse acknowledgment from ACK message
 */
export function parseAcknowledgment(ackMessage: string | HL7Message): HL7Acknowledgment {
  let message: HL7Message;

  if (typeof ackMessage === "string") {
    const lines = ackMessage.split("\r");
    const mshFields = lines[0].split("|");
    const msaFields = lines.find((l) => l.startsWith("MSA"))?.split("|") || [];
    const errFields = lines.find((l) => l.startsWith("ERR"))?.split("|");

    return {
      messageControlId: msaFields[2] || "",
      acknowledgmentCode: (msaFields[1] as any) || "AA",
      textMessage: msaFields[3],
      errorCondition: errFields?.[3],
      severity: (errFields?.[4] as any) || undefined,
    };
  } else {
    message = ackMessage;
  }

  const msaSegment = message.segments.find((s) => s.name === "MSA");
  const errSegment = message.segments.find((s) => s.name === "ERR");

  if (!msaSegment) {
    throw new Error("Invalid ACK message: MSA segment not found");
  }

  return {
    messageControlId: getFieldValue(msaSegment.fields, 1),
    acknowledgmentCode: getFieldValue(msaSegment.fields, 0) as any,
    textMessage: getFieldValue(msaSegment.fields, 2),
    errorCondition: errSegment ? getFieldValue(errSegment.fields, 2) : undefined,
    severity: errSegment ? (getFieldValue(errSegment.fields, 3) as any) : undefined,
  };
}

/**
 * Validate acknowledgment
 */
export function validateAcknowledgment(ack: HL7Acknowledgment): {
  valid: boolean;
  error?: string;
} {
  if (!ack.messageControlId) {
    return { valid: false, error: "Message Control ID is required" };
  }

  const validAckCodes = ["AA", "AE", "AR", "CA", "CE", "CR"];
  if (!validAckCodes.includes(ack.acknowledgmentCode)) {
    return { valid: false, error: `Invalid acknowledgment code: ${ack.acknowledgmentCode}` };
  }

  return { valid: true };
}

/**
 * Check if acknowledgment indicates success
 */
export function isSuccessAck(ack: HL7Acknowledgment): boolean {
  return ack.acknowledgmentCode === "AA" || ack.acknowledgmentCode === "CA";
}

/**
 * Check if acknowledgment indicates error
 */
export function isErrorAck(ack: HL7Acknowledgment): boolean {
  return ack.acknowledgmentCode === "AE" || ack.acknowledgmentCode === "CE";
}

/**
 * Check if acknowledgment indicates rejection
 */
export function isRejectionAck(ack: HL7Acknowledgment): boolean {
  return ack.acknowledgmentCode === "AR" || ack.acknowledgmentCode === "CR";
}

/**
 * Get acknowledgment text by code
 */
function getAckText(code: string): string {
  const texts: Record<string, string> = {
    AA: "Message accepted",
    AE: "Application error",
    AR: "Application reject",
    CA: "Commit accept",
    CE: "Commit error",
    CR: "Commit reject",
  };

  return texts[code] || "Unknown acknowledgment";
}

/**
 * Generate message control ID
 */
function generateMessageControlId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format date/time for HL7
 */
function formatHL7DateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * Get field value from fields array
 */
function getFieldValue(fields: any[], index: number): string {
  const field = fields[index];
  if (!field) return "";

  if (typeof field.value === "string") {
    return field.value;
  }

  if (Array.isArray(field.value)) {
    return field.value.map((c: any) => c.value).join("^");
  }

  return "";
}

/**
 * Enhanced ACK with additional information
 */
export interface EnhancedAcknowledgment extends HL7Acknowledgment {
  processingTime?: number;
  validationErrors?: string[];
  validationWarnings?: string[];
  dataStored?: boolean;
  resourcesCreated?: string[];
  resourcesUpdated?: string[];
}

/**
 * Generate enhanced acknowledgment
 */
export function generateEnhancedAcknowledgment(
  originalMessage: HL7Message,
  options: {
    success: boolean;
    errors?: string[];
    warnings?: string[];
    processingTime?: number;
    dataStored?: boolean;
    resourcesCreated?: string[];
    resourcesUpdated?: string[];
  }
): EnhancedAcknowledgment {
  let ackCode: "AA" | "AE" | "AR" = "AA";
  let textMessage = "Message processed successfully";

  if (!options.success) {
    if (options.errors && options.errors.length > 0) {
      ackCode = "AE";
      textMessage = options.errors[0];
    } else {
      ackCode = "AR";
      textMessage = "Message rejected";
    }
  }

  return {
    messageControlId: originalMessage.messageControlId,
    acknowledgmentCode: ackCode,
    textMessage,
    processingTime: options.processingTime,
    validationErrors: options.errors,
    validationWarnings: options.warnings,
    dataStored: options.dataStored,
    resourcesCreated: options.resourcesCreated,
    resourcesUpdated: options.resourcesUpdated,
  };
}

/**
 * ACK/NACK Generator with retry logic
 */
export class AcknowledgmentHandler {
  private pendingAcks: Map<string, HL7Acknowledgment> = new Map();
  private ackHistory: Map<string, HL7Acknowledgment[]> = new Map();

  /**
   * Generate and track acknowledgment
   */
  async generateAck(
    messageControlId: string,
    originalMessage: HL7Message,
    result: {
      success: boolean;
      error?: string;
      errorCode?: string;
    }
  ): Promise<HL7Acknowledgment> {
    const ackCode = result.success ? "AA" : "AE";

    const ack: HL7Acknowledgment = {
      messageControlId,
      acknowledgmentCode: ackCode,
      textMessage: result.success ? "Message accepted" : result.error,
      errorCondition: result.errorCode,
      severity: result.success ? undefined : "E",
    };

    // Track acknowledgment
    this.trackAck(messageControlId, ack);

    return ack;
  }

  /**
   * Track acknowledgment
   */
  private trackAck(messageControlId: string, ack: HL7Acknowledgment): void {
    this.pendingAcks.set(messageControlId, ack);

    const history = this.ackHistory.get(messageControlId) || [];
    history.push(ack);
    this.ackHistory.set(messageControlId, history);
  }

  /**
   * Get acknowledgment
   */
  getAck(messageControlId: string): HL7Acknowledgment | undefined {
    return this.pendingAcks.get(messageControlId);
  }

  /**
   * Get acknowledgment history
   */
  getAckHistory(messageControlId: string): HL7Acknowledgment[] {
    return this.ackHistory.get(messageControlId) || [];
  }

  /**
   * Clear acknowledgment
   */
  clearAck(messageControlId: string): void {
    this.pendingAcks.delete(messageControlId);
  }

  /**
   * Check if message was acknowledged
   */
  wasAcknowledged(messageControlId: string): boolean {
    return this.pendingAcks.has(messageControlId);
  }

  /**
   * Wait for acknowledgment (with timeout)
   */
  async waitForAck(messageControlId: string, timeout: number = 30000): Promise<HL7Acknowledgment> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const ack = this.getAck(messageControlId);

        if (ack) {
          clearInterval(checkInterval);
          resolve(ack);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error("Acknowledgment timeout"));
        }
      }, 100);
    });
  }
}

// Singleton instance
export const ackHandler = new AcknowledgmentHandler();

/**
 * Error codes mapping
 */
export const HL7_ERROR_CODES = {
  // Table 0357 - Message error condition codes
  "0": "Message accepted",
  "100": "Segment sequence error",
  "101": "Required field missing",
  "102": "Data type error",
  "103": "Table value not found",
  "200": "Unsupported message type",
  "201": "Unsupported event code",
  "202": "Unsupported processing id",
  "203": "Unsupported version id",
  "204": "Unknown key identifier",
  "205": "Duplicate key identifier",
  "206": "Application record locked",
  "207": "Application internal error",
};

/**
 * Get error description
 */
export function getErrorDescription(errorCode: string): string {
  return HL7_ERROR_CODES[errorCode as keyof typeof HL7_ERROR_CODES] || "Unknown error";
}

/**
 * Create error acknowledgment
 */
export function createErrorAck(
  messageControlId: string,
  errorCode: string,
  errorMessage?: string
): HL7Acknowledgment {
  return {
    messageControlId,
    acknowledgmentCode: "AE",
    textMessage: errorMessage || getErrorDescription(errorCode),
    errorCondition: errorCode,
    severity: "E",
  };
}

/**
 * Create rejection acknowledgment
 */
export function createRejectionAck(
  messageControlId: string,
  reason: string
): HL7Acknowledgment {
  return {
    messageControlId,
    acknowledgmentCode: "AR",
    textMessage: reason,
    severity: "E",
  };
}

/**
 * Create commit accept acknowledgment
 */
export function createCommitAcceptAck(messageControlId: string): HL7Acknowledgment {
  return {
    messageControlId,
    acknowledgmentCode: "CA",
    textMessage: "Commit accepted",
  };
}

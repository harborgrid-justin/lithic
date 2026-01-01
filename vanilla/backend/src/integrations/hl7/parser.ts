/**
 * HL7v2 Message Parser
 *
 * Comprehensive HL7v2 message parsing with support for multiple message types
 */

import { logger } from "../../utils/logger";

// HL7v2 Delimiters
export interface HL7Delimiters {
  field: string;
  component: string;
  repetition: string;
  escape: string;
  subcomponent: string;
}

// HL7v2 Segment
export interface HL7Segment {
  name: string;
  fields: string[][];
  raw: string;
}

// HL7v2 Message
export interface HL7Message {
  messageType: string;
  triggerEvent: string;
  messageControlId: string;
  version: string;
  delimiters: HL7Delimiters;
  segments: HL7Segment[];
  raw: string;
}

// Common HL7 Message Types
export type HL7MessageType =
  | "ADT" // Admission, Discharge, Transfer
  | "ORM" // Order Message
  | "ORU" // Observation Result
  | "SIU" // Scheduling Information Unsolicited
  | "MDM" // Medical Document Management
  | "DFT" // Detailed Financial Transaction
  | "BAR" // Add/Change Billing Account
  | "RDE" // Pharmacy/Treatment Encoded Order
  | "ACK"; // General Acknowledgment

/**
 * HL7v2 Parser
 */
export class HL7Parser {
  /**
   * Parse HL7v2 message
   */
  static parse(message: string): HL7Message {
    try {
      // Clean message
      const cleaned = message
        .trim()
        .replace(/\r\n/g, "\r")
        .replace(/\n/g, "\r");

      // Extract delimiters from MSH segment
      const delimiters = this.extractDelimiters(cleaned);

      // Split into segments
      const segmentLines = cleaned
        .split("\r")
        .filter((line) => line.length > 0);

      // Parse segments
      const segments: HL7Segment[] = segmentLines.map((line) =>
        this.parseSegment(line, delimiters),
      );

      // Extract message header info
      const msh = segments.find((s) => s.name === "MSH");
      if (!msh) {
        throw new Error("Missing MSH segment");
      }

      const messageType = this.getField(msh, 9, 1) || "";
      const triggerEvent = this.getField(msh, 9, 2) || "";
      const messageControlId = this.getField(msh, 10, 1) || "";
      const version = this.getField(msh, 12, 1) || "2.5";

      return {
        messageType,
        triggerEvent,
        messageControlId,
        version,
        delimiters,
        segments,
        raw: message,
      };
    } catch (error: any) {
      logger.error("HL7 Parse Error", { error: error.message });
      throw new HL7ParseError(`Failed to parse HL7 message: ${error.message}`);
    }
  }

  /**
   * Extract delimiters from MSH segment
   */
  private static extractDelimiters(message: string): HL7Delimiters {
    if (!message.startsWith("MSH")) {
      throw new Error("Message must start with MSH segment");
    }

    // MSH|^~\&|...
    const field = message[3];
    const encodingChars = message.substring(4, 8);

    return {
      field,
      component: encodingChars[0] || "^",
      repetition: encodingChars[1] || "~",
      escape: encodingChars[2] || "\\",
      subcomponent: encodingChars[3] || "&",
    };
  }

  /**
   * Parse a single segment
   */
  private static parseSegment(
    line: string,
    delimiters: HL7Delimiters,
  ): HL7Segment {
    const segmentName = line.substring(0, 3);
    let fieldData = line.substring(3);

    // Special handling for MSH segment
    if (segmentName === "MSH") {
      // MSH has encoding characters as field 1
      fieldData = delimiters.field + fieldData.substring(5);
    }

    // Split by field delimiter
    const fields = fieldData
      .split(delimiters.field)
      .map((field) => this.parseField(field, delimiters));

    return {
      name: segmentName,
      fields,
      raw: line,
    };
  }

  /**
   * Parse a field into components
   */
  private static parseField(
    field: string,
    delimiters: HL7Delimiters,
  ): string[] {
    if (!field) return [""];

    // Handle repetitions
    const repetitions = field.split(delimiters.repetition);

    // For now, just take the first repetition
    // TODO: Handle multiple repetitions properly
    const firstRep = repetitions[0];

    // Split into components
    const components = firstRep.split(delimiters.component);

    // Unescape special characters
    return components.map((comp) => this.unescape(comp, delimiters));
  }

  /**
   * Unescape HL7 escape sequences
   */
  private static unescape(value: string, delimiters: HL7Delimiters): string {
    if (!value || !value.includes(delimiters.escape)) {
      return value;
    }

    const escapeChar = delimiters.escape;
    return value
      .replace(new RegExp(`${escapeChar}F${escapeChar}`, "g"), delimiters.field)
      .replace(
        new RegExp(`${escapeChar}S${escapeChar}`, "g"),
        delimiters.component,
      )
      .replace(
        new RegExp(`${escapeChar}T${escapeChar}`, "g"),
        delimiters.subcomponent,
      )
      .replace(
        new RegExp(`${escapeChar}R${escapeChar}`, "g"),
        delimiters.repetition,
      )
      .replace(
        new RegExp(`${escapeChar}E${escapeChar}`, "g"),
        delimiters.escape,
      );
  }

  /**
   * Get a specific field value from a segment
   */
  static getField(
    segment: HL7Segment,
    fieldIndex: number,
    componentIndex: number = 1,
  ): string | undefined {
    if (fieldIndex >= segment.fields.length) {
      return undefined;
    }

    const field = segment.fields[fieldIndex];
    if (!field || componentIndex - 1 >= field.length) {
      return undefined;
    }

    return field[componentIndex - 1];
  }

  /**
   * Get all fields from a segment
   */
  static getFields(
    segment: HL7Segment,
    fieldIndex: number,
  ): string[] | undefined {
    if (fieldIndex >= segment.fields.length) {
      return undefined;
    }

    return segment.fields[fieldIndex];
  }

  /**
   * Find segment by name
   */
  static findSegment(
    message: HL7Message,
    segmentName: string,
  ): HL7Segment | undefined {
    return message.segments.find((s) => s.name === segmentName);
  }

  /**
   * Find all segments by name
   */
  static findSegments(message: HL7Message, segmentName: string): HL7Segment[] {
    return message.segments.filter((s) => s.name === segmentName);
  }

  /**
   * Validate HL7 message structure
   */
  static validate(message: HL7Message): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required MSH segment
    if (!this.findSegment(message, "MSH")) {
      errors.push("Missing required MSH segment");
    }

    // Check message type
    if (!message.messageType) {
      errors.push("Missing message type");
    }

    // Check message control ID
    if (!message.messageControlId) {
      errors.push("Missing message control ID");
    }

    // Validate segment structure
    for (const segment of message.segments) {
      if (segment.name.length !== 3) {
        errors.push(`Invalid segment name: ${segment.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract patient information from ADT message
   */
  static extractPatient(message: HL7Message): any {
    const pid = this.findSegment(message, "PID");
    if (!pid) {
      return null;
    }

    return {
      id: this.getField(pid, 3, 1),
      lastName: this.getField(pid, 5, 1),
      firstName: this.getField(pid, 5, 2),
      middleName: this.getField(pid, 5, 3),
      dateOfBirth: this.getField(pid, 7, 1),
      gender: this.getField(pid, 8, 1),
      ssn: this.getField(pid, 19, 1),
      address: {
        street: this.getField(pid, 11, 1),
        city: this.getField(pid, 11, 3),
        state: this.getField(pid, 11, 4),
        zipCode: this.getField(pid, 11, 5),
      },
      phone: this.getField(pid, 13, 1),
    };
  }

  /**
   * Extract order information from ORM message
   */
  static extractOrder(message: HL7Message): any {
    const orc = this.findSegment(message, "ORC");
    const obr = this.findSegment(message, "OBR");

    if (!orc || !obr) {
      return null;
    }

    return {
      orderControl: this.getField(orc, 1, 1),
      placerOrderNumber: this.getField(orc, 2, 1),
      fillerOrderNumber: this.getField(orc, 3, 1),
      orderStatus: this.getField(orc, 5, 1),
      orderDateTime: this.getField(orc, 9, 1),
      orderingProvider: {
        id: this.getField(orc, 12, 1),
        lastName: this.getField(orc, 12, 2),
        firstName: this.getField(orc, 12, 3),
      },
      universalServiceId: this.getField(obr, 4, 1),
      universalServiceName: this.getField(obr, 4, 2),
      observationDateTime: this.getField(obr, 7, 1),
      priority: this.getField(obr, 27, 1),
    };
  }

  /**
   * Extract observation results from ORU message
   */
  static extractObservations(message: HL7Message): any[] {
    const obxSegments = this.findSegments(message, "OBX");

    return obxSegments.map((obx) => ({
      setId: this.getField(obx, 1, 1),
      valueType: this.getField(obx, 2, 1),
      observationId: this.getField(obx, 3, 1),
      observationName: this.getField(obx, 3, 2),
      observationValue: this.getField(obx, 5, 1),
      units: this.getField(obx, 6, 1),
      referenceRange: this.getField(obx, 7, 1),
      abnormalFlags: this.getField(obx, 8, 1),
      resultStatus: this.getField(obx, 11, 1),
      observationDateTime: this.getField(obx, 14, 1),
    }));
  }

  /**
   * Convert parsed message to JSON
   */
  static toJSON(message: HL7Message): any {
    return {
      messageType: message.messageType,
      triggerEvent: message.triggerEvent,
      messageControlId: message.messageControlId,
      version: message.version,
      segments: message.segments.map((segment) => ({
        name: segment.name,
        fields: segment.fields,
      })),
    };
  }
}

/**
 * HL7 Parse Error
 */
export class HL7ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HL7ParseError";
  }
}

/**
 * Parse HL7 message helper
 */
export function parseHL7(message: string): HL7Message {
  return HL7Parser.parse(message);
}

/**
 * Validate HL7 message helper
 */
export function validateHL7(message: HL7Message): {
  valid: boolean;
  errors: string[];
} {
  return HL7Parser.validate(message);
}

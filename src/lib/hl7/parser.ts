/**
 * HL7 v2 Message Parser
 * Parse HL7 v2.x messages into structured objects
 */

import { z } from 'zod';

// HL7 v2 Delimiters
export const DEFAULT_DELIMITERS = {
  field: '|',
  component: '^',
  repetition: '~',
  escape: '\\',
  subComponent: '&',
};

export interface HL7Delimiters {
  field: string;
  component: string;
  repetition: string;
  escape: string;
  subComponent: string;
}

export interface HL7Segment {
  name: string;
  fields: string[][];
  raw: string;
}

export interface HL7Message {
  messageType: string;
  messageControlId: string;
  version: string;
  segments: HL7Segment[];
  delimiters: HL7Delimiters;
  raw: string;
}

/**
 * Parse HL7 v2 message
 */
export class HL7Parser {
  private delimiters: HL7Delimiters;

  constructor(delimiters: HL7Delimiters = DEFAULT_DELIMITERS) {
    this.delimiters = delimiters;
  }

  /**
   * Parse complete HL7 message
   */
  parse(message: string): HL7Message {
    if (!message || message.trim().length === 0) {
      throw new Error('Empty HL7 message');
    }

    const lines = message.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error('No segments found in message');
    }

    // Parse MSH segment first to get delimiters
    const mshLine = lines[0];
    if (!mshLine?.startsWith('MSH')) {
      throw new Error('Message must start with MSH segment');
    }

    // Extract delimiters from MSH segment
    const delimiters = this.extractDelimiters(mshLine);
    this.delimiters = delimiters;

    // Parse all segments
    const segments = lines.map(line => this.parseSegment(line));

    // Extract message metadata from MSH
    const msh = segments[0]!;
    const messageType = this.getField(msh, 9, 0, 0) || 'UNKNOWN';
    const messageControlId = this.getField(msh, 10, 0, 0) || '';
    const version = this.getField(msh, 12, 0, 0) || '2.5';

    return {
      messageType,
      messageControlId,
      version,
      segments,
      delimiters,
      raw: message,
    };
  }

  /**
   * Extract delimiters from MSH segment
   */
  private extractDelimiters(mshLine: string): HL7Delimiters {
    // MSH|^~\&|...
    // Position 3: Field delimiter (|)
    // Position 4-7: Encoding characters (^~\&)
    if (mshLine.length < 8) {
      return DEFAULT_DELIMITERS;
    }

    const field = mshLine[3] || '|';
    const component = mshLine[4] || '^';
    const repetition = mshLine[5] || '~';
    const escape = mshLine[6] || '\\';
    const subComponent = mshLine[7] || '&';

    return {
      field,
      component,
      repetition,
      escape,
      subComponent,
    };
  }

  /**
   * Parse a single segment
   */
  parseSegment(line: string): HL7Segment {
    const segmentName = line.substring(0, 3);

    // Special handling for MSH segment
    if (segmentName === 'MSH') {
      return this.parseMSHSegment(line);
    }

    const fieldStrings = line.split(this.delimiters.field);
    const fields = fieldStrings.slice(1).map(fieldStr => this.parseField(fieldStr));

    return {
      name: segmentName,
      fields,
      raw: line,
    };
  }

  /**
   * Parse MSH segment (special case)
   */
  private parseMSHSegment(line: string): HL7Segment {
    // MSH has special structure: MSH|^~\&|field3|field4|...
    const parts = line.split(this.delimiters.field);

    // Field 1 is the field delimiter itself
    const fields = [
      [[this.delimiters.field]],
      [[parts[1] || '']], // Encoding characters
      ...parts.slice(2).map(fieldStr => this.parseField(fieldStr)),
    ];

    return {
      name: 'MSH',
      fields,
      raw: line,
    };
  }

  /**
   * Parse a field (can contain repetitions)
   */
  private parseField(fieldStr: string): string[][] {
    if (!fieldStr) {
      return [['']];
    }

    const repetitions = fieldStr.split(this.delimiters.repetition);
    return repetitions.map(rep => this.parseComponents(rep));
  }

  /**
   * Parse components (and sub-components)
   */
  private parseComponents(componentStr: string): string[] {
    if (!componentStr) {
      return [''];
    }

    const components = componentStr.split(this.delimiters.component);
    return components.map(comp => this.unescapeHL7(comp));
  }

  /**
   * Unescape HL7 escape sequences
   */
  private unescapeHL7(text: string): string {
    if (!text || !text.includes(this.delimiters.escape)) {
      return text;
    }

    const escape = this.delimiters.escape;

    return text
      .replace(new RegExp(`${escape}F${escape}`, 'g'), this.delimiters.field)
      .replace(new RegExp(`${escape}S${escape}`, 'g'), this.delimiters.component)
      .replace(new RegExp(`${escape}T${escape}`, 'g'), this.delimiters.subComponent)
      .replace(new RegExp(`${escape}R${escape}`, 'g'), this.delimiters.repetition)
      .replace(new RegExp(`${escape}E${escape}`, 'g'), this.delimiters.escape)
      .replace(new RegExp(`${escape}.br${escape}`, 'g'), '\n');
  }

  /**
   * Get field value by index
   */
  getField(
    segment: HL7Segment,
    fieldIndex: number,
    repetition: number = 0,
    component: number = 0
  ): string | undefined {
    const field = segment.fields[fieldIndex - 1];
    if (!field) return undefined;

    const rep = field[repetition];
    if (!rep) return undefined;

    return rep[component];
  }

  /**
   * Get all repetitions of a field
   */
  getFieldRepetitions(segment: HL7Segment, fieldIndex: number): string[][] {
    return segment.fields[fieldIndex - 1] || [];
  }

  /**
   * Find segment by name
   */
  getSegment(message: HL7Message, segmentName: string, occurrence: number = 0): HL7Segment | undefined {
    const segments = message.segments.filter(s => s.name === segmentName);
    return segments[occurrence];
  }

  /**
   * Get all segments by name
   */
  getSegments(message: HL7Message, segmentName: string): HL7Segment[] {
    return message.segments.filter(s => s.name === segmentName);
  }

  /**
   * Validate message structure
   */
  validate(message: HL7Message): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for MSH segment
    if (!message.segments[0] || message.segments[0].name !== 'MSH') {
      errors.push('Message must start with MSH segment');
    }

    // Validate message control ID
    if (!message.messageControlId) {
      errors.push('Message control ID is required');
    }

    // Validate message type
    if (!message.messageType) {
      errors.push('Message type is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create default parser
 */
export const hl7Parser = new HL7Parser();

/**
 * Parse HL7 message (convenience function)
 */
export function parseHL7(message: string): HL7Message {
  return hl7Parser.parse(message);
}

/**
 * Extract patient information from ADT message
 */
export function extractPatientFromADT(message: HL7Message): {
  mrn?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
} {
  const pid = hl7Parser.getSegment(message, 'PID');
  if (!pid) {
    throw new Error('PID segment not found in ADT message');
  }

  // PID-2: Patient ID (External)
  const mrn = hl7Parser.getField(pid, 2, 0, 0);

  // PID-5: Patient Name (Last^First^Middle)
  const lastName = hl7Parser.getField(pid, 5, 0, 0);
  const firstName = hl7Parser.getField(pid, 5, 0, 1);

  // PID-7: Date of Birth (YYYYMMDD)
  const dobRaw = hl7Parser.getField(pid, 7, 0, 0);
  const dateOfBirth = dobRaw ? formatHL7Date(dobRaw) : undefined;

  // PID-8: Gender
  const gender = hl7Parser.getField(pid, 8, 0, 0);

  // PID-19: SSN
  const ssn = hl7Parser.getField(pid, 19, 0, 0);

  // PID-11: Address
  const address = hl7Parser.getField(pid, 11, 0, 0);
  const city = hl7Parser.getField(pid, 11, 0, 2);
  const state = hl7Parser.getField(pid, 11, 0, 3);
  const zipCode = hl7Parser.getField(pid, 11, 0, 4);

  // PID-13: Phone
  const phone = hl7Parser.getField(pid, 13, 0, 0);

  return {
    mrn,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    ssn,
    address,
    city,
    state,
    zipCode,
    phone,
  };
}

/**
 * Extract order information from ORM message
 */
export function extractOrderFromORM(message: HL7Message): {
  orderId?: string;
  patientMrn?: string;
  orderingProvider?: string;
  orderDateTime?: string;
  priority?: string;
  tests: Array<{
    code?: string;
    description?: string;
  }>;
} {
  const orc = hl7Parser.getSegment(message, 'ORC');
  const obr = hl7Parser.getSegment(message, 'OBR');
  const pid = hl7Parser.getSegment(message, 'PID');

  if (!orc || !obr) {
    throw new Error('ORC and OBR segments required in ORM message');
  }

  // ORC-2: Placer Order Number
  const orderId = hl7Parser.getField(orc, 2, 0, 0);

  // ORC-9: Date/Time of Transaction
  const orderDateTimeRaw = hl7Parser.getField(orc, 9, 0, 0);
  const orderDateTime = orderDateTimeRaw ? formatHL7DateTime(orderDateTimeRaw) : undefined;

  // ORC-5: Order Status (Priority can be derived)
  const priority = hl7Parser.getField(orc, 5, 0, 0);

  // PID-2: Patient MRN
  const patientMrn = pid ? hl7Parser.getField(pid, 2, 0, 0) : undefined;

  // OBR-16: Ordering Provider
  const orderingProvider = hl7Parser.getField(obr, 16, 0, 0);

  // OBR-4: Universal Service ID
  const testCode = hl7Parser.getField(obr, 4, 0, 0);
  const testDescription = hl7Parser.getField(obr, 4, 0, 1);

  return {
    orderId,
    patientMrn,
    orderingProvider,
    orderDateTime,
    priority,
    tests: [
      {
        code: testCode,
        description: testDescription,
      },
    ],
  };
}

/**
 * Format HL7 date (YYYYMMDD) to ISO date
 */
function formatHL7Date(hl7Date: string): string {
  if (hl7Date.length < 8) return hl7Date;

  const year = hl7Date.substring(0, 4);
  const month = hl7Date.substring(4, 6);
  const day = hl7Date.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Format HL7 datetime (YYYYMMDDHHmmss) to ISO datetime
 */
function formatHL7DateTime(hl7DateTime: string): string {
  if (hl7DateTime.length < 8) return hl7DateTime;

  const year = hl7DateTime.substring(0, 4);
  const month = hl7DateTime.substring(4, 6);
  const day = hl7DateTime.substring(6, 8);
  const hour = hl7DateTime.substring(8, 10) || '00';
  const minute = hl7DateTime.substring(10, 12) || '00';
  const second = hl7DateTime.substring(12, 14) || '00';

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

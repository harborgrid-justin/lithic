/**
 * HL7v2 Message Builder
 *
 * Build HL7v2 messages programmatically with proper encoding
 */

import { HL7Delimiters } from './parser';

// Builder Configuration
export interface HL7BuilderConfig {
  delimiters?: HL7Delimiters;
  sendingApplication?: string;
  sendingFacility?: string;
  receivingApplication?: string;
  receivingFacility?: string;
  version?: string;
}

// Segment Builder
export class SegmentBuilder {
  private fields: string[][] = [];

  constructor(private segmentName: string) {}

  /**
   * Add a field
   */
  addField(value: string | string[] | null | undefined): this {
    if (value === null || value === undefined) {
      this.fields.push(['']);
    } else if (Array.isArray(value)) {
      this.fields.push(value);
    } else {
      this.fields.push([value]);
    }
    return this;
  }

  /**
   * Add multiple fields
   */
  addFields(...values: (string | string[] | null | undefined)[]): this {
    values.forEach((value) => this.addField(value));
    return this;
  }

  /**
   * Get segment name
   */
  getName(): string {
    return this.segmentName;
  }

  /**
   * Get fields
   */
  getFields(): string[][] {
    return this.fields;
  }

  /**
   * Build segment string
   */
  build(delimiters: HL7Delimiters): string {
    const fieldStrings = this.fields.map((field) =>
      field.map((comp) => this.escape(comp, delimiters)).join(delimiters.component)
    );

    if (this.segmentName === 'MSH') {
      // MSH segment has special encoding
      const encodingChars =
        delimiters.component +
        delimiters.repetition +
        delimiters.escape +
        delimiters.subcomponent;

      return `MSH${delimiters.field}${encodingChars}${delimiters.field}${fieldStrings.slice(1).join(delimiters.field)}`;
    }

    return `${this.segmentName}${delimiters.field}${fieldStrings.join(delimiters.field)}`;
  }

  /**
   * Escape special characters
   */
  private escape(value: string, delimiters: HL7Delimiters): string {
    if (!value) return '';

    const escapeChar = delimiters.escape;
    return value
      .replace(new RegExp(`\\${delimiters.escape}`, 'g'), `${escapeChar}E${escapeChar}`)
      .replace(new RegExp(`\\${delimiters.field}`, 'g'), `${escapeChar}F${escapeChar}`)
      .replace(new RegExp(`\\${delimiters.component}`, 'g'), `${escapeChar}S${escapeChar}`)
      .replace(new RegExp(`\\${delimiters.subcomponent}`, 'g'), `${escapeChar}T${escapeChar}`)
      .replace(new RegExp(`\\${delimiters.repetition}`, 'g'), `${escapeChar}R${escapeChar}`);
  }
}

/**
 * HL7v2 Message Builder
 */
export class HL7Builder {
  private segments: SegmentBuilder[] = [];
  private delimiters: HL7Delimiters;
  private config: HL7BuilderConfig;

  constructor(config: HL7BuilderConfig = {}) {
    this.delimiters = config.delimiters || {
      field: '|',
      component: '^',
      repetition: '~',
      escape: '\\',
      subcomponent: '&',
    };

    this.config = {
      sendingApplication: config.sendingApplication || 'LITHIC',
      sendingFacility: config.sendingFacility || 'LITHIC_FACILITY',
      receivingApplication: config.receivingApplication || 'RECEIVER',
      receivingFacility: config.receivingFacility || 'RECEIVER_FACILITY',
      version: config.version || '2.5',
      ...config,
    };
  }

  /**
   * Add MSH segment
   */
  addMSH(messageType: string, triggerEvent: string, messageControlId: string): this {
    const msh = new SegmentBuilder('MSH');
    const timestamp = this.formatTimestamp(new Date());

    msh.addFields(
      '', // Field separator (handled specially)
      this.config.sendingApplication,
      this.config.sendingFacility,
      this.config.receivingApplication,
      this.config.receivingFacility,
      timestamp,
      '',
      [messageType, triggerEvent],
      messageControlId,
      'P', // Processing ID
      this.config.version
    );

    this.segments.push(msh);
    return this;
  }

  /**
   * Add PID segment (Patient Identification)
   */
  addPID(patient: {
    id: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
    ssn?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone?: string;
  }): this {
    const pid = new SegmentBuilder('PID');

    pid.addFields(
      '1', // Set ID
      null, // Patient ID (external)
      patient.id, // Patient ID (internal)
      null, // Alternate Patient ID
      [patient.lastName, patient.firstName, patient.middleName || ''].filter(Boolean),
      null, // Mother's Maiden Name
      this.formatDate(patient.dateOfBirth),
      patient.gender,
      null, // Patient Alias
      null, // Race
      patient.address
        ? [
            patient.address.street,
            '',
            patient.address.city,
            patient.address.state,
            patient.address.zipCode,
          ]
        : null,
      null, // County Code
      patient.phone ? [patient.phone] : null,
      null, // Phone Number - Business
      null, // Primary Language
      null, // Marital Status
      null, // Religion
      null, // Patient Account Number
      patient.ssn
    );

    this.segments.push(pid);
    return this;
  }

  /**
   * Add PV1 segment (Patient Visit)
   */
  addPV1(visit: {
    patientClass: string;
    assignedLocation?: string;
    attendingDoctor?: { id: string; lastName: string; firstName: string };
    admitDateTime?: string;
  }): this {
    const pv1 = new SegmentBuilder('PV1');

    pv1.addFields(
      '1', // Set ID
      visit.patientClass,
      visit.assignedLocation || null,
      null, // Admission Type
      null, // Preadmit Number
      null, // Prior Patient Location
      visit.attendingDoctor
        ? [visit.attendingDoctor.id, visit.attendingDoctor.lastName, visit.attendingDoctor.firstName]
        : null,
      null, // Referring Doctor
      null, // Consulting Doctor
      null, // Hospital Service
      null, // Temporary Location
      null, // Preadmit Test Indicator
      null, // Re-admission Indicator
      null, // Admit Source
      null, // Ambulatory Status
      null, // VIP Indicator
      null, // Admitting Doctor
      null, // Patient Type
      null, // Visit Number
      null, // Financial Class
      null, // Charge Price Indicator
      null, // Courtesy Code
      null, // Credit Rating
      null, // Contract Code
      null, // Contract Effective Date
      null, // Contract Amount
      null, // Contract Period
      null, // Interest Code
      null, // Transfer to Bad Debt Code
      null, // Transfer to Bad Debt Date
      null, // Bad Debt Agency Code
      null, // Bad Debt Transfer Amount
      null, // Bad Debt Recovery Amount
      null, // Delete Account Indicator
      null, // Delete Account Date
      null, // Discharge Disposition
      null, // Discharged to Location
      null, // Diet Type
      null, // Servicing Facility
      null, // Bed Status
      null, // Account Status
      null, // Pending Location
      null, // Prior Temporary Location
      visit.admitDateTime ? this.formatTimestamp(new Date(visit.admitDateTime)) : null
    );

    this.segments.push(pv1);
    return this;
  }

  /**
   * Add ORC segment (Common Order)
   */
  addORC(order: {
    orderControl: string;
    placerOrderNumber: string;
    fillerOrderNumber?: string;
    orderStatus?: string;
    orderDateTime?: string;
    orderingProvider?: { id: string; lastName: string; firstName: string };
  }): this {
    const orc = new SegmentBuilder('ORC');

    orc.addFields(
      order.orderControl,
      order.placerOrderNumber,
      order.fillerOrderNumber || null,
      null, // Placer Group Number
      order.orderStatus || 'NW',
      null, // Response Flag
      null, // Quantity/Timing
      null, // Parent
      order.orderDateTime ? this.formatTimestamp(new Date(order.orderDateTime)) : null,
      null, // Transaction Date/Time
      null, // Entered By
      null, // Verified By
      order.orderingProvider
        ? [order.orderingProvider.id, order.orderingProvider.lastName, order.orderingProvider.firstName]
        : null
    );

    this.segments.push(orc);
    return this;
  }

  /**
   * Add OBR segment (Observation Request)
   */
  addOBR(observation: {
    setId: string;
    placerOrderNumber?: string;
    fillerOrderNumber?: string;
    universalServiceId: string;
    universalServiceName: string;
    observationDateTime?: string;
    priority?: string;
  }): this {
    const obr = new SegmentBuilder('OBR');

    obr.addFields(
      observation.setId,
      observation.placerOrderNumber || null,
      observation.fillerOrderNumber || null,
      [observation.universalServiceId, observation.universalServiceName],
      null, // Priority (old)
      observation.observationDateTime ? this.formatTimestamp(new Date(observation.observationDateTime)) : null,
      null, // Observation Date/Time
      null, // Observation End Date/Time
      null, // Collection Volume
      null, // Collector Identifier
      null, // Specimen Action Code
      null, // Danger Code
      null, // Relevant Clinical Info
      null, // Specimen Received Date/Time
      null, // Specimen Source
      null, // Ordering Provider
      null, // Order Callback Phone Number
      null, // Placer Field 1
      null, // Placer Field 2
      null, // Filler Field 1
      null, // Filler Field 2
      null, // Results Rpt/Status Chng - Date/Time
      null, // Charge to Practice
      null, // Diagnostic Serv Sect ID
      null, // Result Status
      null, // Parent Result
      null, // Quantity/Timing
      observation.priority || 'R'
    );

    this.segments.push(obr);
    return this;
  }

  /**
   * Add OBX segment (Observation/Result)
   */
  addOBX(result: {
    setId: string;
    valueType: string;
    observationId: string;
    observationName: string;
    observationValue: string;
    units?: string;
    referenceRange?: string;
    abnormalFlags?: string;
    resultStatus?: string;
    observationDateTime?: string;
  }): this {
    const obx = new SegmentBuilder('OBX');

    obx.addFields(
      result.setId,
      result.valueType,
      [result.observationId, result.observationName],
      null, // Observation Sub-ID
      result.observationValue,
      result.units || null,
      result.referenceRange || null,
      result.abnormalFlags || null,
      null, // Probability
      null, // Nature of Abnormal Test
      result.resultStatus || 'F',
      null, // Effective Date of Reference Range
      null, // User Defined Access Checks
      result.observationDateTime ? this.formatTimestamp(new Date(result.observationDateTime)) : null
    );

    this.segments.push(obx);
    return this;
  }

  /**
   * Add custom segment
   */
  addSegment(segment: SegmentBuilder): this {
    this.segments.push(segment);
    return this;
  }

  /**
   * Build the complete HL7 message
   */
  build(): string {
    const segmentStrings = this.segments.map((segment) => segment.build(this.delimiters));
    return segmentStrings.join('\r');
  }

  /**
   * Format date for HL7 (YYYYMMDD)
   */
  private formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Format timestamp for HL7 (YYYYMMDDHHmmss)
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

/**
 * Create ACK message
 */
export function createACK(
  originalMessage: { messageControlId: string; messageType: string; triggerEvent: string },
  acknowledgmentCode: 'AA' | 'AE' | 'AR' = 'AA',
  config?: HL7BuilderConfig
): string {
  const builder = new HL7Builder(config);
  const messageControlId = `ACK${Date.now()}`;

  builder.addMSH('ACK', originalMessage.triggerEvent, messageControlId);

  const msa = new SegmentBuilder('MSA');
  msa.addFields(
    acknowledgmentCode,
    originalMessage.messageControlId,
    acknowledgmentCode === 'AA' ? 'Message accepted' : 'Message rejected'
  );

  builder.addSegment(msa);
  return builder.build();
}

/**
 * Create ADT^A01 message (Patient Admit)
 */
export function createADTA01(
  patient: any,
  visit: any,
  config?: HL7BuilderConfig
): string {
  const builder = new HL7Builder(config);
  const messageControlId = `ADT${Date.now()}`;

  builder
    .addMSH('ADT', 'A01', messageControlId)
    .addPID(patient)
    .addPV1(visit);

  return builder.build();
}

/**
 * Create ORU^R01 message (Observation Result)
 */
export function createORUR01(
  patient: any,
  observations: any[],
  config?: HL7BuilderConfig
): string {
  const builder = new HL7Builder(config);
  const messageControlId = `ORU${Date.now()}`;

  builder.addMSH('ORU', 'R01', messageControlId).addPID(patient);

  // Add OBR segment
  builder.addOBR({
    setId: '1',
    universalServiceId: 'PANEL',
    universalServiceName: 'Laboratory Panel',
    observationDateTime: new Date().toISOString(),
  });

  // Add OBX segments
  observations.forEach((obs, index) => {
    builder.addOBX({
      setId: String(index + 1),
      valueType: 'NM',
      ...obs,
    });
  });

  return builder.build();
}

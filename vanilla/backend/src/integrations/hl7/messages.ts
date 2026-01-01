/**
 * HL7v2 Message Templates
 *
 * Common HL7v2 message templates and utilities
 */

import { HL7Builder, SegmentBuilder, createACK, createADTA01, createORUR01 } from './builder';
import { HL7Parser, HL7Message } from './parser';

/**
 * ADT Message Types
 */
export const ADTMessageTypes = {
  A01: 'Patient Admit',
  A02: 'Patient Transfer',
  A03: 'Patient Discharge',
  A04: 'Patient Registration',
  A05: 'Patient Pre-Admit',
  A08: 'Update Patient Information',
  A11: 'Cancel Admit',
  A12: 'Cancel Transfer',
  A13: 'Cancel Discharge',
  A28: 'Add Person Information',
  A31: 'Update Person Information',
  A34: 'Patient Merge',
  A40: 'Merge Patient',
};

/**
 * Create ADT^A04 message (Patient Registration)
 */
export function createPatientRegistration(
  patient: {
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
  },
  visit?: {
    patientClass: string;
    assignedLocation?: string;
    attendingDoctor?: { id: string; lastName: string; firstName: string };
  }
): string {
  const builder = new HL7Builder();
  const messageControlId = `ADT${Date.now()}`;

  builder.addMSH('ADT', 'A04', messageControlId).addPID(patient);

  if (visit) {
    builder.addPV1(visit);
  }

  return builder.build();
}

/**
 * Create ADT^A08 message (Update Patient Information)
 */
export function createPatientUpdate(
  patient: any,
  visit?: any
): string {
  const builder = new HL7Builder();
  const messageControlId = `ADT${Date.now()}`;

  builder.addMSH('ADT', 'A08', messageControlId).addPID(patient);

  if (visit) {
    builder.addPV1(visit);
  }

  return builder.build();
}

/**
 * Create ADT^A03 message (Patient Discharge)
 */
export function createPatientDischarge(
  patient: any,
  dischargeInfo: {
    dischargeDateTime: string;
    dischargeDisposition?: string;
  }
): string {
  const builder = new HL7Builder();
  const messageControlId = `ADT${Date.now()}`;

  builder.addMSH('ADT', 'A03', messageControlId).addPID(patient);

  // Add PV1 with discharge info
  const pv1 = new SegmentBuilder('PV1');
  pv1.addFields(
    '1', // Set ID
    'I', // Patient Class (Inpatient)
    null, // Assigned Patient Location
    null, // Admission Type
    null, // Preadmit Number
    null, // Prior Patient Location
    null, // Attending Doctor
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
    dischargeInfo.dischargeDisposition || null, // Discharge Disposition
    null, // Discharged to Location
    null, // Diet Type
    null, // Servicing Facility
    null, // Bed Status
    null, // Account Status
    null, // Pending Location
    null, // Prior Temporary Location
    new Date(dischargeInfo.dischargeDateTime).toISOString().replace(/[-:]/g, '').split('.')[0]
  );

  builder.addSegment(pv1);
  return builder.build();
}

/**
 * Create ORM^O01 message (General Order)
 */
export function createGeneralOrder(
  patient: any,
  order: {
    orderControl: string;
    placerOrderNumber: string;
    orderingProvider: { id: string; lastName: string; firstName: string };
    universalServiceId: string;
    universalServiceName: string;
    priority?: string;
    orderDateTime?: string;
  }
): string {
  const builder = new HL7Builder();
  const messageControlId = `ORM${Date.now()}`;

  builder
    .addMSH('ORM', 'O01', messageControlId)
    .addPID(patient)
    .addORC({
      orderControl: order.orderControl,
      placerOrderNumber: order.placerOrderNumber,
      orderingProvider: order.orderingProvider,
      orderDateTime: order.orderDateTime || new Date().toISOString(),
    })
    .addOBR({
      setId: '1',
      placerOrderNumber: order.placerOrderNumber,
      universalServiceId: order.universalServiceId,
      universalServiceName: order.universalServiceName,
      priority: order.priority,
      observationDateTime: new Date().toISOString(),
    });

  return builder.build();
}

/**
 * Create laboratory order
 */
export function createLabOrder(
  patient: any,
  labTests: Array<{
    testId: string;
    testName: string;
  }>,
  orderingProvider: { id: string; lastName: string; firstName: string }
): string {
  const builder = new HL7Builder();
  const messageControlId = `ORM${Date.now()}`;
  const placerOrderNumber = `LAB${Date.now()}`;

  builder
    .addMSH('ORM', 'O01', messageControlId)
    .addPID(patient)
    .addORC({
      orderControl: 'NW',
      placerOrderNumber,
      orderingProvider,
      orderDateTime: new Date().toISOString(),
    });

  // Add OBR for each test
  labTests.forEach((test, index) => {
    builder.addOBR({
      setId: String(index + 1),
      placerOrderNumber,
      universalServiceId: test.testId,
      universalServiceName: test.testName,
      priority: 'R',
      observationDateTime: new Date().toISOString(),
    });
  });

  return builder.build();
}

/**
 * Create SIU^S12 message (Appointment Notification)
 */
export function createAppointmentNotification(
  patient: any,
  appointment: {
    appointmentId: string;
    startDateTime: string;
    duration: number; // in minutes
    provider: { id: string; lastName: string; firstName: string };
    location?: string;
    appointmentType?: string;
  }
): string {
  const builder = new HL7Builder();
  const messageControlId = `SIU${Date.now()}`;

  builder.addMSH('SIU', 'S12', messageControlId);

  // SCH segment (Schedule Activity Information)
  const sch = new SegmentBuilder('SCH');
  const startDate = new Date(appointment.startDateTime);
  const endDate = new Date(startDate.getTime() + appointment.duration * 60000);

  sch.addFields(
    appointment.appointmentId, // Placer Appointment ID
    null, // Filler Appointment ID
    null, // Occurrence Number
    null, // Placer Group Number
    null, // Schedule ID
    null, // Event Reason
    null, // Appointment Reason
    null, // Appointment Type
    String(appointment.duration), // Appointment Duration
    'min', // Appointment Duration Units
    null, // Appointment Timing Quantity
    null, // Placer Contact Person
    null, // Placer Contact Phone Number
    null, // Placer Contact Address
    null, // Placer Contact Location
    null, // Filler Contact Person
    null, // Filler Contact Phone Number
    null, // Filler Contact Address
    null, // Filler Contact Location
    null, // Entered By Person
    null, // Entered By Phone Number
    null, // Entered By Location
    null, // Parent Placer Appointment ID
    null, // Parent Filler Appointment ID
    'Booked' // Filler Status Code
  );

  builder.addSegment(sch);

  // PID segment
  builder.addPID(patient);

  // AIP segment (Appointment Information - Personnel Resource)
  const aip = new SegmentBuilder('AIP');
  aip.addFields(
    '1', // Set ID
    null, // Segment Action Code
    [appointment.provider.id, appointment.provider.lastName, appointment.provider.firstName],
    appointment.appointmentType || 'OFFICE',
    startDate.toISOString().replace(/[-:]/g, '').split('.')[0],
    String(appointment.duration),
    'min'
  );

  builder.addSegment(aip);

  return builder.build();
}

/**
 * Create MDM^T02 message (Document Notification)
 */
export function createDocumentNotification(
  patient: any,
  document: {
    documentId: string;
    documentType: string;
    documentTitle: string;
    completionStatus: string;
    documentContent?: string;
  }
): string {
  const builder = new HL7Builder();
  const messageControlId = `MDM${Date.now()}`;

  builder.addMSH('MDM', 'T02', messageControlId).addPID(patient);

  // TXA segment (Transcription Document Header)
  const txa = new SegmentBuilder('TXA');
  txa.addFields(
    '1', // Set ID
    document.documentType,
    null, // Document Content Presentation
    null, // Activity Date/Time
    null, // Primary Activity Provider
    new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
    null, // Edit Date/Time
    null, // Originator
    null, // Assigned Document Authenticator
    null, // Transcriptionist
    document.documentId,
    null, // Parent Document Number
    null, // Placer Order Number
    null, // Filler Order Number
    document.documentId, // Unique Document Number
    null, // Parent Document Version Number
    document.completionStatus,
    null, // Document Confidentiality Status
    null, // Document Availability Status
    null, // Document Storage Status
    document.documentTitle
  );

  builder.addSegment(txa);

  // OBX segment for document content (if provided)
  if (document.documentContent) {
    const obx = new SegmentBuilder('OBX');
    obx.addFields(
      '1', // Set ID
      'TX', // Value Type (Text)
      'DOCUMENT', // Observation Identifier
      null, // Observation Sub-ID
      document.documentContent,
      null, // Units
      null, // Reference Range
      null, // Abnormal Flags
      null, // Probability
      null, // Nature of Abnormal Test
      'F' // Observation Result Status
    );

    builder.addSegment(obx);
  }

  return builder.build();
}

/**
 * Parse and extract message type information
 */
export function getMessageInfo(message: string): {
  messageType: string;
  triggerEvent: string;
  description: string;
} {
  const parsed = HL7Parser.parse(message);
  const messageKey = `${parsed.messageType}^${parsed.triggerEvent}`;

  const descriptions: Record<string, string> = {
    'ADT^A01': 'Patient Admit',
    'ADT^A02': 'Patient Transfer',
    'ADT^A03': 'Patient Discharge',
    'ADT^A04': 'Patient Registration',
    'ADT^A08': 'Update Patient Information',
    'ORM^O01': 'General Order',
    'ORU^R01': 'Observation Result',
    'SIU^S12': 'Appointment Notification',
    'MDM^T02': 'Document Notification',
    'ACK^*': 'General Acknowledgment',
  };

  return {
    messageType: parsed.messageType,
    triggerEvent: parsed.triggerEvent,
    description: descriptions[messageKey] || 'Unknown Message Type',
  };
}

/**
 * Validate message structure and content
 */
export function validateMessage(message: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  try {
    const parsed = HL7Parser.parse(message);
    const validation = HL7Parser.validate(parsed);

    const warnings: string[] = [];

    // Check for common optional segments
    if (!HL7Parser.findSegment(parsed, 'EVN')) {
      warnings.push('Missing EVN segment (Event Type)');
    }

    // Check patient identifier
    const pid = HL7Parser.findSegment(parsed, 'PID');
    if (pid && !HL7Parser.getField(pid, 3, 1)) {
      validation.errors.push('Missing patient identifier in PID-3');
    }

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [error.message],
      warnings: [],
    };
  }
}

// Export message creators
export {
  createACK,
  createADTA01,
  createORUR01,
};

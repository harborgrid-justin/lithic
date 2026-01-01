/**
 * HL7 v2 Message Templates
 * Pre-built message constructors for common HL7 message types
 */

import { HL7Builder, createHL7Builder } from "./builder";

interface FacilityInfo {
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
}

/**
 * Create ADT^A01 (Patient Admission) message
 */
export function createADT_A01(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    ssn?: string;
  };
  visit: {
    patientClass: "E" | "I" | "O" | "P" | "R" | "B";
    location?: string;
    admissionType?: string;
    attendingDoctor?: string;
    admitDateTime: Date;
  };
}): string {
  const builder = createHL7Builder();

  return builder
    .addMSH({
      ...params.facility,
      messageType: "ADT",
      triggerEvent: "A01",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      middleName: params.patient.middleName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
      address: params.patient.address,
      city: params.patient.city,
      state: params.patient.state,
      zipCode: params.patient.zipCode,
      phone: params.patient.phone,
      ssn: params.patient.ssn,
    })
    .addPV1({
      patientClass: params.visit.patientClass,
      assignedPatientLocation: params.visit.location,
      admissionType: params.visit.admissionType,
      attendingDoctor: params.visit.attendingDoctor,
      admitDateTime: params.visit.admitDateTime,
    })
    .build();
}

/**
 * Create ADT^A03 (Patient Discharge) message
 */
export function createADT_A03(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  visit: {
    patientClass: "E" | "I" | "O" | "P" | "R" | "B";
    location?: string;
    attendingDoctor?: string;
    admitDateTime: Date;
    dischargeDateTime: Date;
  };
}): string {
  const builder = createHL7Builder();

  return builder
    .addMSH({
      ...params.facility,
      messageType: "ADT",
      triggerEvent: "A03",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    })
    .addPV1({
      patientClass: params.visit.patientClass,
      assignedPatientLocation: params.visit.location,
      attendingDoctor: params.visit.attendingDoctor,
      admitDateTime: params.visit.admitDateTime,
      dischargeDateTime: params.visit.dischargeDateTime,
    })
    .build();
}

/**
 * Create ADT^A08 (Patient Information Update) message
 */
export function createADT_A08(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  };
}): string {
  const builder = createHL7Builder();

  return builder
    .addMSH({
      ...params.facility,
      messageType: "ADT",
      triggerEvent: "A08",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      middleName: params.patient.middleName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
      address: params.patient.address,
      city: params.patient.city,
      state: params.patient.state,
      zipCode: params.patient.zipCode,
      phone: params.patient.phone,
    })
    .build();
}

/**
 * Create ORM^O01 (Order Message) for lab/radiology orders
 */
export function createORM_O01(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  order: {
    orderControl: "NW" | "CA" | "OC";
    placerOrderNumber: string;
    orderDateTime: Date;
    orderingProvider: string;
    tests: Array<{
      code: string;
      description: string;
      priority?: string;
    }>;
  };
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "ORM",
      triggerEvent: "O01",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    })
    .addORC({
      orderControl: params.order.orderControl,
      placerOrderNumber: params.order.placerOrderNumber,
      orderDateTime: params.order.orderDateTime,
      orderingProvider: params.order.orderingProvider,
    });

  params.order.tests.forEach((test, index) => {
    builder.addOBR({
      setId: index + 1,
      placerOrderNumber: params.order.placerOrderNumber,
      universalServiceId: test.code,
      universalServiceText: test.description,
      observationDateTime: params.order.orderDateTime,
      orderingProvider: params.order.orderingProvider,
    });
  });

  return builder.build();
}

/**
 * Create ORU^R01 (Observation Result) message
 */
export function createORU_R01(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  order: {
    placerOrderNumber: string;
    fillerOrderNumber: string;
    orderingProvider: string;
  };
  results: Array<{
    code: string;
    description: string;
    value: string | number;
    valueType: "CE" | "NM" | "ST" | "TX";
    units?: string;
    referenceRange?: string;
    abnormalFlag?: string;
    status: "F" | "P" | "R" | "C";
    observationDateTime: Date;
  }>;
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "ORU",
      triggerEvent: "R01",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    })
    .addOBR({
      setId: 1,
      placerOrderNumber: params.order.placerOrderNumber,
      fillerOrderNumber: params.order.fillerOrderNumber,
      universalServiceId: "PANEL",
      universalServiceText: "Test Panel",
      orderingProvider: params.order.orderingProvider,
      resultStatus: "F",
    });

  params.results.forEach((result, index) => {
    builder.addOBX({
      setId: index + 1,
      valueType: result.valueType,
      observationId: result.code,
      observationText: result.description,
      observationValue: result.value,
      units: result.units,
      referenceRange: result.referenceRange,
      abnormalFlags: result.abnormalFlag,
      observationResultStatus: result.status,
      observationDateTime: result.observationDateTime,
    });
  });

  return builder.build();
}

/**
 * Create ACK (Acknowledgment) message
 */
export function createACK(params: {
  facility: FacilityInfo;
  originalMessageControlId: string;
  acknowledgmentCode: "AA" | "AE" | "AR" | "CA" | "CE" | "CR";
  textMessage?: string;
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "ACK",
      triggerEvent: "ACK",
    })
    .addSegment("MSA", [
      params.acknowledgmentCode,
      params.originalMessageControlId,
      params.textMessage || "",
    ]);

  return builder.build();
}

/**
 * Create DFT^P03 (Charge/Billing) message
 */
export function createDFT_P03(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  charges: Array<{
    code: string;
    description: string;
    quantity: number;
    amount: number;
    serviceDate: Date;
  }>;
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "DFT",
      triggerEvent: "P03",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    });

  params.charges.forEach((charge, index) => {
    builder.addSegment("FT1", [
      String(index + 1), // Set ID
      "", // Transaction ID
      "", // Transaction Batch ID
      builder["formatDate"](charge.serviceDate), // Transaction Date (private method access)
      "", // Transaction Posting Date
      "CG", // Transaction Type (CG = Charge)
      charge.code,
      charge.description,
      "", // Transaction Description - Alt
      String(charge.quantity),
      "", // Transaction Amount - Extended
      String(charge.amount),
      "", // Transaction Amount - Unit
      "", // Department Code
      "", // Insurance Plan ID
      "", // Insurance Amount
      "", // Assigned Patient Location
      "", // Fee Schedule
      "", // Patient Type
      "", // Diagnosis Code
      "", // Performed By Code
      "", // Ordered By Code
      "", // Unit Cost
    ]);
  });

  return builder.build();
}

/**
 * Create SIU^S12 (Appointment Notification - New) message
 */
export function createSIU_S12(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  appointment: {
    appointmentId: string;
    startDateTime: Date;
    endDateTime: Date;
    duration: number;
    provider: string;
    location?: string;
    appointmentType?: string;
    appointmentReason?: string;
  };
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "SIU",
      triggerEvent: "S12",
    })
    .addSegment("SCH", [
      "", // Placer Appointment ID
      params.appointment.appointmentId, // Filler Appointment ID
      "", // Occurrence Number
      "", // Placer Group Number
      "", // Schedule ID
      "", // Event Reason
      "", // Appointment Reason
      params.appointment.appointmentType || "", // Appointment Type
      String(params.appointment.duration), // Appointment Duration
      "MIN", // Appointment Duration Units
      "", // Appointment Timing Quantity
      "", // Placer Contact Person
      "", // Placer Contact Phone Number
      "", // Placer Contact Address
      "", // Placer Contact Location
      "", // Filler Contact Person
      "", // Filler Contact Phone Number
      "", // Filler Contact Address
      "", // Filler Contact Location
      "", // Entered By Person
      "", // Entered By Phone Number
      "", // Entered By Location
      "", // Parent Placer Appointment ID
      "", // Parent Filler Appointment ID
      "Booked", // Filler Status Code
    ])
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    })
    .addSegment("AIP", [
      "1", // Set ID
      "", // Segment Action Code
      "", // Personnel Resource ID
      "", // Resource Type
      "", // Resource Group
      builder["formatDateTime"](params.appointment.startDateTime),
      "", // Start Date/Time Offset
      "", // Start Date/Time Offset Units
      String(params.appointment.duration),
      "MIN", // Duration Units
      "A", // Allow Substitution Code
      "Confirmed", // Filler Status Code
    ]);

  return builder.build();
}

/**
 * Create MDM^T02 (Document Notification) message
 */
export function createMDM_T02(params: {
  facility: FacilityInfo;
  patient: {
    mrn: string;
    lastName: string;
    firstName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
  };
  document: {
    documentId: string;
    documentType: string;
    documentTitle: string;
    documentDateTime: Date;
    provider: string;
    documentContent: string;
    status: "IP" | "DO" | "LA" | "AU" | "PA" | "UC";
  };
}): string {
  const builder = createHL7Builder();

  builder
    .addMSH({
      ...params.facility,
      messageType: "MDM",
      triggerEvent: "T02",
    })
    .addPID({
      patientIdList: params.patient.mrn,
      lastName: params.patient.lastName,
      firstName: params.patient.firstName,
      dateOfBirth: params.patient.dateOfBirth,
      gender: params.patient.gender,
    })
    .addSegment("TXA", [
      "1", // Set ID
      params.document.documentType, // Document Type
      "", // Document Content Presentation
      builder["formatDateTime"](params.document.documentDateTime),
      "", // Primary Activity Provider
      builder["formatDateTime"](params.document.documentDateTime), // Origination Date/Time
      "", // Transcription Date/Time
      "", // Edit Date/Time
      "", // Originator Code/Name
      "", // Assigned Document Authenticator
      "", // Transcriptionist Code/Name
      params.document.documentId, // Unique Document Number
      "", // Parent Document Number
      "", // Placer Order Number
      "", // Filler Order Number
      "", // Unique Document File Name
      params.document.status, // Document Completion Status
      "", // Document Confidentiality Status
      "", // Document Availability Status
      "", // Document Storage Status
      "", // Document Change Reason
      "", // Authentication Person, Time Stamp
      "", // Distributed Copies
    ])
    .addSegment("OBX", [
      "1",
      "TX", // Value Type
      params.document.documentType,
      params.document.documentTitle,
      "", // Observation Sub-ID
      params.document.documentContent,
    ]);

  return builder.build();
}

/**
 * Parse acknowledgment message and extract result
 */
export function parseACK(ackMessage: string): {
  acknowledgmentCode: string;
  messageControlId: string;
  textMessage?: string;
  success: boolean;
} {
  const lines = ackMessage.split(/\r?\n/).filter((line) => line.trim());
  const msaLine = lines.find((line) => line.startsWith("MSA"));

  if (!msaLine) {
    throw new Error("Invalid ACK message: MSA segment not found");
  }

  const fields = msaLine.split("|");
  const acknowledgmentCode = fields[1] || "";
  const messageControlId = fields[2] || "";
  const textMessage = fields[3];

  return {
    acknowledgmentCode,
    messageControlId,
    textMessage,
    success: acknowledgmentCode === "AA" || acknowledgmentCode === "CA",
  };
}

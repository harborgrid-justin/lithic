/**
 * HL7 v2.x Message Generator
 * Generate HL7 v2.x messages from structured data
 */

import { DEFAULT_DELIMITERS, type HL7Delimiters } from "./parser";

export interface HL7MessageConfig {
  delimiters?: HL7Delimiters;
  sendingApplication?: string;
  sendingFacility?: string;
  receivingApplication?: string;
  receivingFacility?: string;
  messageControlId?: string;
  version?: string;
}

/**
 * HL7 v2.x Message Builder
 */
export class HL7MessageBuilder {
  private segments: string[] = [];
  private delimiters: HL7Delimiters;
  private config: Required<HL7MessageConfig>;

  constructor(config: HL7MessageConfig = {}) {
    this.delimiters = config.delimiters || DEFAULT_DELIMITERS;
    this.config = {
      delimiters: this.delimiters,
      sendingApplication: config.sendingApplication || "LITHIC",
      sendingFacility: config.sendingFacility || "LITHIC_HEALTH",
      receivingApplication: config.receivingApplication || "RECEIVER",
      receivingFacility: config.receivingFacility || "RECEIVER_FAC",
      messageControlId:
        config.messageControlId || this.generateMessageControlId(),
      version: config.version || "2.5.1",
    };
  }

  /**
   * Generate unique message control ID
   */
  private generateMessageControlId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}${random}`;
  }

  /**
   * Escape special characters in HL7 field values
   */
  private escapeHL7(text: string): string {
    if (!text) return "";

    const escape = this.delimiters.escape;
    return text
      .replace(
        new RegExp(`\\${this.delimiters.field}`, "g"),
        `${escape}F${escape}`,
      )
      .replace(
        new RegExp(`\\${this.delimiters.component}`, "g"),
        `${escape}S${escape}`,
      )
      .replace(
        new RegExp(`\\${this.delimiters.subComponent}`, "g"),
        `${escape}T${escape}`,
      )
      .replace(
        new RegExp(`\\${this.delimiters.repetition}`, "g"),
        `${escape}R${escape}`,
      )
      .replace(new RegExp(`\\${escape}`, "g"), `${escape}E${escape}`)
      .replace(/\n/g, `${escape}.br${escape}`);
  }

  /**
   * Build a field with components
   */
  private buildField(components: (string | null | undefined)[]): string {
    return components
      .map((comp) => (comp ? this.escapeHL7(comp) : ""))
      .join(this.delimiters.component);
  }

  /**
   * Build an MSH (Message Header) segment
   */
  buildMSH(messageType: string, triggerEvent: string): this {
    const encodingCharacters =
      this.delimiters.component +
      this.delimiters.repetition +
      this.delimiters.escape +
      this.delimiters.subComponent;

    const timestamp = this.formatHL7DateTime(new Date());

    const msh = [
      "MSH",
      encodingCharacters,
      this.config.sendingApplication,
      this.config.sendingFacility,
      this.config.receivingApplication,
      this.config.receivingFacility,
      timestamp,
      "",
      `${messageType}^${triggerEvent}`,
      this.config.messageControlId,
      "P", // Processing ID (P = Production, T = Test, D = Debug)
      this.config.version,
    ].join(this.delimiters.field);

    this.segments.push(msh);
    return this;
  }

  /**
   * Build a PID (Patient Identification) segment
   */
  buildPID(patient: {
    id?: string;
    mrn: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "O" | "U";
    ssn?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    maritalStatus?: string;
    race?: string;
    language?: string;
  }): this {
    const patientName = this.buildField([
      patient.lastName,
      patient.firstName,
      patient.middleName,
    ]);

    const address = this.buildField([
      patient.address,
      "", // Additional address line
      patient.city,
      patient.state,
      patient.zipCode,
    ]);

    const dob = this.formatHL7Date(patient.dateOfBirth);

    const pid = [
      "PID",
      "1", // Set ID
      patient.id || "", // Patient ID (External)
      patient.mrn, // Patient ID (Internal)
      "", // Alternate Patient ID
      patientName,
      "", // Mother's Maiden Name
      dob,
      patient.gender,
      "", // Patient Alias
      patient.race || "",
      address,
      "", // County Code
      patient.phone || "",
      "", // Business Phone
      patient.language || "",
      patient.maritalStatus || "",
      "", // Religion
      "", // Patient Account Number
      patient.ssn || "",
    ].join(this.delimiters.field);

    this.segments.push(pid);
    return this;
  }

  /**
   * Build a PV1 (Patient Visit) segment
   */
  buildPV1(visit: {
    patientClass: "E" | "I" | "O" | "P" | "R" | "B"; // E=Emergency, I=Inpatient, O=Outpatient, P=Preadmit, R=Recurring, B=Obstetrics
    location?: string;
    attendingDoctor?: string;
    referringDoctor?: string;
    admitDate?: Date;
    dischargeDate?: Date;
    visitNumber?: string;
  }): this {
    const pv1 = [
      "PV1",
      "1", // Set ID
      visit.patientClass,
      visit.location || "",
      "", // Admission Type
      "", // Preadmit Number
      "", // Prior Patient Location
      visit.attendingDoctor || "",
      visit.referringDoctor || "",
      "", // Consulting Doctor
      "", // Hospital Service
      "", // Temporary Location
      "", // Preadmit Test Indicator
      "", // Re-admission Indicator
      "", // Admit Source
      "", // Ambulatory Status
      "", // VIP Indicator
      "", // Admitting Doctor
      "", // Patient Type
      visit.visitNumber || "",
      "", // Financial Class
      "", // Charge Price Indicator
      "", // Courtesy Code
      "", // Credit Rating
      "", // Contract Code
      "", // Contract Effective Date
      "", // Contract Amount
      "", // Contract Period
      "", // Interest Code
      "", // Transfer to Bad Debt Code
      "", // Transfer to Bad Debt Date
      "", // Bad Debt Agency Code
      "", // Bad Debt Transfer Amount
      "", // Bad Debt Recovery Amount
      "", // Delete Account Indicator
      "", // Delete Account Date
      "", // Discharge Disposition
      "", // Discharged to Location
      "", // Diet Type
      "", // Servicing Facility
      "", // Bed Status
      "", // Account Status
      "", // Pending Location
      "", // Prior Temporary Location
      visit.admitDate ? this.formatHL7DateTime(visit.admitDate) : "",
      visit.dischargeDate ? this.formatHL7DateTime(visit.dischargeDate) : "",
    ].join(this.delimiters.field);

    this.segments.push(pv1);
    return this;
  }

  /**
   * Build an ORC (Common Order) segment
   */
  buildORC(order: {
    orderControl: "NW" | "OK" | "CA" | "DC" | "RE" | "RU" | "UA"; // NW=New, OK=Order accepted, CA=Cancel, DC=Discontinue, RE=Replace, RU=Replace unsolicited, UA=Unable to accept
    placerOrderNumber: string;
    fillerOrderNumber?: string;
    orderStatus?: "A" | "CA" | "CM" | "DC" | "ER" | "HD" | "IP" | "RP"; // A=Active, CA=Canceled, CM=Complete, DC=Discontinued, ER=Error, HD=Hold, IP=In Process, RP=Replaced
    orderingProvider?: string;
    dateTime?: Date;
  }): this {
    const orc = [
      "ORC",
      order.orderControl,
      order.placerOrderNumber,
      order.fillerOrderNumber || "",
      "", // Placer Group Number
      order.orderStatus || "",
      "", // Response Flag
      "", // Quantity/Timing
      "", // Parent
      order.dateTime ? this.formatHL7DateTime(order.dateTime) : "",
      "", // Transaction Date/Time
      "", // Entered By
      "", // Verified By
      order.orderingProvider || "",
    ].join(this.delimiters.field);

    this.segments.push(orc);
    return this;
  }

  /**
   * Build an OBR (Observation Request) segment
   */
  buildOBR(observation: {
    setId: number;
    placerOrderNumber: string;
    fillerOrderNumber?: string;
    universalServiceId: string;
    universalServiceName?: string;
    priority?: "S" | "A" | "R" | "P" | "C" | "T"; // S=Stat, A=ASAP, R=Routine, P=Preop, C=Callback, T=Timing critical
    observationDateTime?: Date;
    orderingProvider?: string;
    resultStatus?: "O" | "P" | "F" | "C" | "X"; // O=Order received, P=Preliminary, F=Final, C=Correction, X=Cannot obtain
  }): this {
    const serviceId = this.buildField([
      observation.universalServiceId,
      observation.universalServiceName,
    ]);

    const obr = [
      "OBR",
      observation.setId.toString(),
      observation.placerOrderNumber,
      observation.fillerOrderNumber || "",
      serviceId,
      observation.priority || "R",
      "", // Requested Date/Time
      observation.observationDateTime
        ? this.formatHL7DateTime(observation.observationDateTime)
        : "",
      "", // Observation End Date/Time
      "", // Collection Volume
      "", // Collector Identifier
      "", // Specimen Action Code
      "", // Danger Code
      "", // Relevant Clinical Info
      "", // Specimen Received Date/Time
      "", // Specimen Source
      observation.orderingProvider || "",
      "", // Order Callback Phone Number
      "", // Placer Field 1
      "", // Placer Field 2
      "", // Filler Field 1
      "", // Filler Field 2
      "", // Results Rpt/Status Chng
      "", // Charge to Practice
      "", // Diagnostic Serv Sect ID
      observation.resultStatus || "F",
    ].join(this.delimiters.field);

    this.segments.push(obr);
    return this;
  }

  /**
   * Build an OBX (Observation/Result) segment
   */
  buildOBX(result: {
    setId: number;
    valueType: "NM" | "ST" | "TX" | "FT" | "CE" | "DT" | "TM"; // NM=Numeric, ST=String, TX=Text, FT=Formatted text, CE=Coded element, DT=Date, TM=Time
    observationId: string;
    observationName?: string;
    observationSubId?: string;
    value: string | number;
    units?: string;
    referenceRange?: string;
    abnormalFlags?: "L" | "H" | "LL" | "HH" | "N" | "A"; // L=Low, H=High, LL=Critical low, HH=Critical high, N=Normal, A=Abnormal
    observationResultStatus?:
      | "C"
      | "D"
      | "F"
      | "I"
      | "N"
      | "O"
      | "P"
      | "R"
      | "S"
      | "U"
      | "W"
      | "X";
    observationDateTime?: Date;
  }): this {
    const observationId = this.buildField([
      result.observationId,
      result.observationName,
    ]);

    const obx = [
      "OBX",
      result.setId.toString(),
      result.valueType,
      observationId,
      result.observationSubId || "",
      String(result.value),
      result.units || "",
      result.referenceRange || "",
      result.abnormalFlags || "",
      "", // Probability
      "", // Nature of Abnormal Test
      result.observationResultStatus || "F",
      "", // Effective Date
      "", // User Defined Access Checks
      result.observationDateTime
        ? this.formatHL7DateTime(result.observationDateTime)
        : "",
    ].join(this.delimiters.field);

    this.segments.push(obx);
    return this;
  }

  /**
   * Build a DG1 (Diagnosis) segment
   */
  buildDG1(diagnosis: {
    setId: number;
    diagnosisCode: string;
    diagnosisDescription?: string;
    diagnosisDateTime?: Date;
    diagnosisType?: "1" | "2" | "3" | "4" | "5" | "6" | "7"; // 1=Admitting, 2=Working, 3=Final, 4=Discharge, 5=Nursing, 6=Tissue, 7=Autopsy
    diagnosingClinician?: string;
  }): this {
    const diagnosisCodeField = this.buildField([
      diagnosis.diagnosisCode,
      diagnosis.diagnosisDescription,
      "I10", // Coding system (ICD-10)
    ]);

    const dg1 = [
      "DG1",
      diagnosis.setId.toString(),
      "", // Diagnosis Coding Method
      diagnosisCodeField,
      diagnosis.diagnosisDescription || "",
      diagnosis.diagnosisDateTime
        ? this.formatHL7DateTime(diagnosis.diagnosisDateTime)
        : "",
      diagnosis.diagnosisType || "3",
      "", // Major Diagnostic Category
      "", // Diagnostic Related Group
      "", // DRG Approval Indicator
      "", // DRG Grouper Review Code
      "", // Outlier Type
      "", // Outlier Days
      "", // Outlier Cost
      "", // Grouper Version And Type
      "", // Diagnosis Priority
      diagnosis.diagnosingClinician || "",
    ].join(this.delimiters.field);

    this.segments.push(dg1);
    return this;
  }

  /**
   * Build an EVN (Event Type) segment
   */
  buildEVN(eventTypeCode: string, recordedDateTime?: Date): this {
    const evn = [
      "EVN",
      eventTypeCode,
      recordedDateTime
        ? this.formatHL7DateTime(recordedDateTime)
        : this.formatHL7DateTime(new Date()),
    ].join(this.delimiters.field);

    this.segments.push(evn);
    return this;
  }

  /**
   * Build a custom segment
   */
  buildSegment(
    segmentName: string,
    fields: (string | null | undefined)[],
  ): this {
    const segment = [segmentName, ...fields.map((f) => f || "")].join(
      this.delimiters.field,
    );
    this.segments.push(segment);
    return this;
  }

  /**
   * Format date to HL7 format (YYYYMMDD)
   */
  private formatHL7Date(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  /**
   * Format datetime to HL7 format (YYYYMMDDHHmmss)
   */
  private formatHL7DateTime(date: Date): string {
    const dateStr = this.formatHL7Date(date);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${dateStr}${hours}${minutes}${seconds}`;
  }

  /**
   * Build the complete HL7 message
   */
  build(): string {
    return this.segments.join("\r");
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.segments = [];
    this.config.messageControlId = this.generateMessageControlId();
    return this;
  }
}

/**
 * Create an ADT (Admit/Discharge/Transfer) message
 */
export function createADTMessage(
  eventType: "A01" | "A03" | "A04" | "A08", // A01=Admit, A03=Discharge, A04=Register, A08=Update
  patient: Parameters<HL7MessageBuilder["buildPID"]>[0],
  visit?: Parameters<HL7MessageBuilder["buildPV1"]>[0],
  config?: HL7MessageConfig,
): string {
  const builder = new HL7MessageBuilder(config);

  builder.buildMSH("ADT", eventType).buildEVN(eventType).buildPID(patient);

  if (visit) {
    builder.buildPV1(visit);
  }

  return builder.build();
}

/**
 * Create an ORM (Order Message) message
 */
export function createORMMessage(
  patient: Parameters<HL7MessageBuilder["buildPID"]>[0],
  order: Parameters<HL7MessageBuilder["buildORC"]>[0],
  observation: Parameters<HL7MessageBuilder["buildOBR"]>[0],
  config?: HL7MessageConfig,
): string {
  const builder = new HL7MessageBuilder(config);

  builder
    .buildMSH("ORM", "O01")
    .buildPID(patient)
    .buildORC(order)
    .buildOBR(observation);

  return builder.build();
}

/**
 * Create an ORU (Observation Result) message
 */
export function createORUMessage(
  patient: Parameters<HL7MessageBuilder["buildPID"]>[0],
  observation: Parameters<HL7MessageBuilder["buildOBR"]>[0],
  results: Parameters<HL7MessageBuilder["buildOBX"]>[0][],
  config?: HL7MessageConfig,
): string {
  const builder = new HL7MessageBuilder(config);

  builder.buildMSH("ORU", "R01").buildPID(patient).buildOBR(observation);

  results.forEach((result) => {
    builder.buildOBX(result);
  });

  return builder.build();
}

/**
 * Export builder and helper functions
 */
export { HL7MessageBuilder };

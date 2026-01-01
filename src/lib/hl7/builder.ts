/**
 * HL7 v2 Message Builder
 * Construct HL7 v2.x messages from structured data
 */

import { DEFAULT_DELIMITERS, type HL7Delimiters } from "./parser";

export class HL7Builder {
  private segments: string[] = [];
  private delimiters: HL7Delimiters;
  private messageControlId: string;

  constructor(delimiters: HL7Delimiters = DEFAULT_DELIMITERS) {
    this.delimiters = delimiters;
    this.messageControlId = this.generateMessageControlId();
  }

  /**
   * Generate unique message control ID
   */
  private generateMessageControlId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Escape HL7 special characters
   */
  private escapeHL7(text: string): string {
    if (!text) return "";

    const escape = this.delimiters.escape;

    return text
      .replace(new RegExp(`\\${escape}`, "g"), `${escape}E${escape}`)
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
      .replace(/\n/g, `${escape}.br${escape}`);
  }

  /**
   * Build a field with components and subcomponents
   */
  buildField(components: (string | string[])[]): string {
    return components
      .map((comp) => {
        if (Array.isArray(comp)) {
          return comp
            .map((s) => this.escapeHL7(s))
            .join(this.delimiters.subComponent);
        }
        return this.escapeHL7(comp);
      })
      .join(this.delimiters.component);
  }

  /**
   * Build a field with repetitions
   */
  buildRepeatingField(repetitions: (string | string[])[][]): string {
    return repetitions
      .map((rep) => this.buildField(rep))
      .join(this.delimiters.repetition);
  }

  /**
   * Add MSH segment
   */
  addMSH(params: {
    sendingApplication: string;
    sendingFacility: string;
    receivingApplication: string;
    receivingFacility: string;
    messageType: string;
    triggerEvent: string;
    version?: string;
    processingId?: string;
  }): this {
    const {
      sendingApplication,
      sendingFacility,
      receivingApplication,
      receivingFacility,
      messageType,
      triggerEvent,
      version = "2.5",
      processingId = "P",
    } = params;

    const timestamp = this.formatDateTime(new Date());
    const encodingChars = `${this.delimiters.component}${this.delimiters.repetition}${this.delimiters.escape}${this.delimiters.subComponent}`;

    const fields = [
      "MSH",
      encodingChars,
      sendingApplication,
      sendingFacility,
      receivingApplication,
      receivingFacility,
      timestamp,
      "", // Security
      `${messageType}^${triggerEvent}`,
      this.messageControlId,
      processingId,
      version,
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add PID (Patient Identification) segment
   */
  addPID(params: {
    patientId?: string;
    patientIdList?: string;
    lastName: string;
    firstName: string;
    middleName?: string;
    dateOfBirth?: Date;
    gender?: "M" | "F" | "O" | "U";
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    ssn?: string;
    driversLicense?: string;
    sequenceNumber?: number;
  }): this {
    const fields = [
      "PID",
      String(params.sequenceNumber || 1), // Set ID
      params.patientId || "", // Patient ID (External)
      params.patientIdList || "", // Patient ID (Internal)
      "", // Alternate Patient ID
      this.buildField([
        params.lastName,
        params.firstName,
        params.middleName || "",
      ]), // Patient Name
      "", // Mother's Maiden Name
      params.dateOfBirth ? this.formatDate(params.dateOfBirth) : "", // Date of Birth
      params.gender || "", // Sex
      "", // Patient Alias
      "", // Race
      params.address && params.city
        ? this.buildField([
            params.address,
            "", // Other designation
            params.city,
            params.state || "",
            params.zipCode || "",
          ])
        : "", // Patient Address
      "", // County Code
      params.phone || "", // Phone Number - Home
      "", // Phone Number - Business
      "", // Primary Language
      "", // Marital Status
      "", // Religion
      "", // Patient Account Number
      params.ssn || "", // SSN
      params.driversLicense || "", // Driver's License Number
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add PV1 (Patient Visit) segment
   */
  addPV1(params: {
    patientClass: "E" | "I" | "O" | "P" | "R" | "B"; // E=Emergency, I=Inpatient, O=Outpatient
    assignedPatientLocation?: string;
    admissionType?: string;
    attendingDoctor?: string;
    referringDoctor?: string;
    admitDateTime?: Date;
    dischargeDateTime?: Date;
  }): this {
    const fields = [
      "PV1",
      "1", // Set ID
      params.patientClass,
      params.assignedPatientLocation || "",
      params.admissionType || "",
      "", // Preadmit Number
      "", // Prior Patient Location
      params.attendingDoctor || "",
      params.referringDoctor || "",
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
      "", // Visit Number
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
      params.admitDateTime ? this.formatDateTime(params.admitDateTime) : "",
      params.dischargeDateTime
        ? this.formatDateTime(params.dischargeDateTime)
        : "",
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add ORC (Common Order) segment
   */
  addORC(params: {
    orderControl:
      | "NW"
      | "CA"
      | "OC"
      | "CR"
      | "DC"
      | "DE"
      | "DF"
      | "DR"
      | "FU"
      | "HD"
      | "HR"
      | "NA"
      | "OD"
      | "OE"
      | "OF"
      | "OH"
      | "OK"
      | "OP"
      | "OR"
      | "PA"
      | "PR"
      | "RE"
      | "RF"
      | "RL"
      | "RO"
      | "RP"
      | "RQ"
      | "RR"
      | "RU"
      | "SC"
      | "SN"
      | "SR"
      | "SS"
      | "UA"
      | "UC"
      | "UD"
      | "UF"
      | "UH"
      | "UM"
      | "UN"
      | "UP"
      | "UR"
      | "UX"
      | "XO"
      | "XR";
    placerOrderNumber?: string;
    fillerOrderNumber?: string;
    orderStatus?: "A" | "CA" | "CM" | "DC" | "ER" | "HD" | "IP" | "RP" | "SC";
    orderDateTime?: Date;
    orderingProvider?: string;
  }): this {
    const fields = [
      "ORC",
      params.orderControl,
      params.placerOrderNumber || "",
      params.fillerOrderNumber || "",
      "", // Placer Group Number
      params.orderStatus || "",
      "", // Response Flag
      "", // Quantity/Timing
      "", // Parent
      params.orderDateTime ? this.formatDateTime(params.orderDateTime) : "",
      "", // Entered By
      "", // Verified By
      params.orderingProvider || "",
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add OBR (Observation Request) segment
   */
  addOBR(params: {
    setId: number;
    placerOrderNumber?: string;
    fillerOrderNumber?: string;
    universalServiceId: string;
    universalServiceText?: string;
    observationDateTime?: Date;
    specimenReceivedDateTime?: Date;
    orderingProvider?: string;
    resultStatus?: "O" | "I" | "S" | "A" | "P" | "F" | "R" | "C" | "M" | "X";
  }): this {
    const fields = [
      "OBR",
      String(params.setId),
      params.placerOrderNumber || "",
      params.fillerOrderNumber || "",
      this.buildField([
        params.universalServiceId,
        params.universalServiceText || "",
      ]),
      "", // Priority
      "", // Requested Date/Time
      params.observationDateTime
        ? this.formatDateTime(params.observationDateTime)
        : "",
      "", // Observation End Date/Time
      "", // Collection Volume
      "", // Collector Identifier
      "", // Specimen Action Code
      "", // Danger Code
      "", // Relevant Clinical Info
      params.specimenReceivedDateTime
        ? this.formatDateTime(params.specimenReceivedDateTime)
        : "",
      "", // Specimen Source
      params.orderingProvider || "",
      "", // Order Callback Phone Number
      "", // Placer Field 1
      "", // Placer Field 2
      "", // Filler Field 1
      "", // Filler Field 2
      "", // Results Rpt/Status Chng - Date/Time
      "", // Charge to Practice
      "", // Diagnostic Serv Sect ID
      params.resultStatus || "",
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add OBX (Observation/Result) segment
   */
  addOBX(params: {
    setId: number;
    valueType:
      | "CE"
      | "CWE"
      | "DT"
      | "DTM"
      | "FT"
      | "NM"
      | "SN"
      | "ST"
      | "TM"
      | "TS"
      | "TX";
    observationId: string;
    observationText?: string;
    observationValue: string | number;
    units?: string;
    referenceRange?: string;
    abnormalFlags?: string;
    observationResultStatus:
      | "F"
      | "P"
      | "R"
      | "C"
      | "X"
      | "I"
      | "N"
      | "D"
      | "W"
      | "S"
      | "U";
    observationDateTime?: Date;
  }): this {
    const fields = [
      "OBX",
      String(params.setId),
      params.valueType,
      this.buildField([params.observationId, params.observationText || ""]),
      "", // Observation Sub-ID
      String(params.observationValue),
      params.units || "",
      params.referenceRange || "",
      params.abnormalFlags || "",
      "", // Probability
      "", // Nature of Abnormal Test
      params.observationResultStatus,
      "", // Effective Date of Reference Range
      "", // User Defined Access Checks
      params.observationDateTime
        ? this.formatDateTime(params.observationDateTime)
        : "",
    ];

    this.segments.push(fields.join(this.delimiters.field));
    return this;
  }

  /**
   * Add custom segment
   */
  addSegment(segmentName: string, fields: string[]): this {
    const segment = [segmentName, ...fields].join(this.delimiters.field);
    this.segments.push(segment);
    return this;
  }

  /**
   * Build the complete message
   */
  build(): string {
    if (this.segments.length === 0) {
      throw new Error("Message must have at least one segment");
    }

    if (!this.segments[0]?.startsWith("MSH")) {
      throw new Error("Message must start with MSH segment");
    }

    return this.segments.join("\r\n") + "\r\n";
  }

  /**
   * Format date to HL7 format (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  /**
   * Format datetime to HL7 format (YYYYMMDDHHmmss)
   */
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${dateStr}${hour}${minute}${second}`;
  }

  /**
   * Reset builder for new message
   */
  reset(): this {
    this.segments = [];
    this.messageControlId = this.generateMessageControlId();
    return this;
  }

  /**
   * Get current message control ID
   */
  getMessageControlId(): string {
    return this.messageControlId;
  }

  /**
   * Set message control ID
   */
  setMessageControlId(id: string): this {
    this.messageControlId = id;
    return this;
  }
}

/**
 * Create new HL7 builder
 */
export function createHL7Builder(delimiters?: HL7Delimiters): HL7Builder {
  return new HL7Builder(delimiters);
}

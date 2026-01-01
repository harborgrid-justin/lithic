/**
 * PrescriptionService.ts
 * E-Prescribing and prescription validation service
 * Implements NCPDP SCRIPT standard for electronic prescriptions
 */

import { EventEmitter } from "events";
import type { Prescription, Medication } from "./PharmacyService";

export interface EPrescription {
  id: string;
  messageId: string; // NCPDP Message ID
  version: string; // NCPDP version (e.g., "10.6")
  messageType:
    | "NEWRX"
    | "RXCHG"
    | "RXFILL"
    | "CANRX"
    | "REFRES"
    | "RXHREQ"
    | "RXHRES";

  // Prescriber information
  prescriber: {
    npi: string;
    deaNumber?: string;
    stateLicenseNumber: string;
    firstName: string;
    lastName: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone: string;
    fax?: string;
    email?: string;
  };

  // Patient information
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "M" | "F" | "U";
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone: string;
    email?: string;
  };

  // Medication
  medication: {
    ndcCode?: string;
    description: string;
    strength: string;
    dosageForm: string;
    quantity: number;
    quantityUnit: string;
    directions: string;
    daysSupply: number;
    refills: number;
    substitutionsAllowed: boolean;
  };

  // Pharmacy
  pharmacy: {
    ncpdpId: string;
    npi?: string;
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone: string;
  };

  // Clinical information
  diagnosis?: string;
  notes?: string;
  priorAuthorizationNumber?: string;

  // Timestamps
  writtenDate: Date;
  receivedDate?: Date;
  processedDate?: Date;

  // Status
  status: "pending" | "accepted" | "rejected" | "changed" | "cancelled";
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  severity: "warning";
}

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  requestedDate: Date;
  requestedBy: "patient" | "prescriber" | "pharmacy";
  status: "pending" | "approved" | "denied" | "prescriber_review";
  denialReason?: string;
  processedDate?: Date;
  processedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrescriptionService extends EventEmitter {
  private ePrescriptions: Map<string, EPrescription> = new Map();
  private refillRequests: Map<string, RefillRequest> = new Map();

  // NCPDP message version
  private readonly NCPDP_VERSION = "10.6";

  constructor() {
    super();
  }

  /**
   * Validate a prescription for completeness and correctness
   */
  async validatePrescription(
    prescription: Partial<Prescription>,
  ): Promise<PrescriptionValidation> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    if (!prescription.patientId) {
      errors.push({
        code: "REQUIRED_FIELD",
        field: "patientId",
        message: "Patient ID is required",
        severity: "error",
      });
    }

    if (!prescription.prescriberId) {
      errors.push({
        code: "REQUIRED_FIELD",
        field: "prescriberId",
        message: "Prescriber ID is required",
        severity: "error",
      });
    }

    if (!prescription.medicationId) {
      errors.push({
        code: "REQUIRED_FIELD",
        field: "medicationId",
        message: "Medication ID is required",
        severity: "error",
      });
    }

    if (
      !prescription.directions ||
      prescription.directions.trim().length === 0
    ) {
      errors.push({
        code: "REQUIRED_FIELD",
        field: "directions",
        message: "Directions (SIG) are required",
        severity: "error",
      });
    }

    if (!prescription.quantity || prescription.quantity <= 0) {
      errors.push({
        code: "INVALID_VALUE",
        field: "quantity",
        message: "Quantity must be greater than zero",
        severity: "error",
      });
    }

    if (!prescription.daysSupply || prescription.daysSupply <= 0) {
      errors.push({
        code: "INVALID_VALUE",
        field: "daysSupply",
        message: "Days supply must be greater than zero",
        severity: "error",
      });
    }

    // Controlled substance validations
    if (prescription.isControlled) {
      if (!prescription.prescriberDEA) {
        errors.push({
          code: "DEA_REQUIRED",
          field: "prescriberDEA",
          message: "DEA number required for controlled substances",
          severity: "error",
        });
      }

      if (!prescription.diagnosis) {
        warnings.push({
          code: "DIAGNOSIS_RECOMMENDED",
          field: "diagnosis",
          message: "Diagnosis code recommended for controlled substances",
          severity: "warning",
        });
      }

      // Controlled substance quantity limits
      const medication = prescription.medication as Medication;
      if (
        medication?.deaSchedule === "2" &&
        prescription.daysSupply &&
        prescription.daysSupply > 30
      ) {
        warnings.push({
          code: "DAYS_SUPPLY_LIMIT",
          field: "daysSupply",
          message:
            "Schedule II controlled substances typically limited to 30 days supply",
          severity: "warning",
        });
      }

      if (
        prescription.refillsAuthorized &&
        prescription.refillsAuthorized > 0
      ) {
        if (medication?.deaSchedule === "2") {
          errors.push({
            code: "NO_REFILLS_ALLOWED",
            field: "refillsAuthorized",
            message: "Schedule II controlled substances cannot have refills",
            severity: "error",
          });
        } else if (
          medication?.deaSchedule &&
          ["3", "4", "5"].includes(medication.deaSchedule)
        ) {
          if (prescription.refillsAuthorized > 5) {
            errors.push({
              code: "REFILL_LIMIT",
              field: "refillsAuthorized",
              message:
                "Schedule III-V controlled substances limited to 5 refills",
              severity: "error",
            });
          }
        }
      }
    }

    // Date validations
    if (prescription.writtenDate && prescription.expirationDate) {
      if (prescription.expirationDate <= prescription.writtenDate) {
        errors.push({
          code: "INVALID_DATE",
          field: "expirationDate",
          message: "Expiration date must be after written date",
          severity: "error",
        });
      }

      // Check if prescription is expired
      if (prescription.expirationDate < new Date()) {
        errors.push({
          code: "EXPIRED",
          field: "expirationDate",
          message: "Prescription has expired",
          severity: "error",
        });
      }
    }

    // Drug interaction check warning
    if (!prescription.drugInteractionChecked) {
      warnings.push({
        code: "INTERACTION_CHECK_REQUIRED",
        field: "drugInteractionChecked",
        message: "Drug interaction check should be performed",
        severity: "warning",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Process incoming NCPDP e-prescription
   */
  async processEPrescription(
    data: Omit<EPrescription, "id" | "createdAt" | "updatedAt">,
  ): Promise<EPrescription> {
    const ePrescription: EPrescription = {
      ...data,
      id: this.generateId("ERX"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ePrescriptions.set(ePrescription.id, ePrescription);
    this.emit("eprescription:received", ePrescription);

    return ePrescription;
  }

  /**
   * Accept an e-prescription
   */
  async acceptEPrescription(
    id: string,
    processedBy: string,
  ): Promise<EPrescription | null> {
    const erx = this.ePrescriptions.get(id);
    if (!erx) return null;

    const updated: EPrescription = {
      ...erx,
      status: "accepted",
      processedDate: new Date(),
      updatedAt: new Date(),
    };

    this.ePrescriptions.set(id, updated);
    this.emit("eprescription:accepted", updated);

    return updated;
  }

  /**
   * Reject an e-prescription
   */
  async rejectEPrescription(
    id: string,
    reason: string,
  ): Promise<EPrescription | null> {
    const erx = this.ePrescriptions.get(id);
    if (!erx) return null;

    const updated: EPrescription = {
      ...erx,
      status: "rejected",
      rejectionReason: reason,
      processedDate: new Date(),
      updatedAt: new Date(),
    };

    this.ePrescriptions.set(id, updated);
    this.emit("eprescription:rejected", updated);

    return updated;
  }

  /**
   * Send NCPDP change request
   */
  async sendChangeRequest(
    prescriptionId: string,
    changes: {
      quantity?: number;
      daysSupply?: number;
      directions?: string;
      reason: string;
    },
  ): Promise<EPrescription> {
    const changeRequest: EPrescription = {
      id: this.generateId("ERX"),
      messageId: this.generateMessageId(),
      version: this.NCPDP_VERSION,
      messageType: "RXCHG",
      status: "pending",
      prescriber: {} as any, // Would be populated from the prescription
      patient: {} as any,
      medication: {
        description: "",
        strength: "",
        dosageForm: "",
        quantity: changes.quantity || 0,
        quantityUnit: "",
        directions: changes.directions || "",
        daysSupply: changes.daysSupply || 0,
        refills: 0,
        substitutionsAllowed: false,
      },
      pharmacy: {} as any,
      notes: changes.reason,
      writtenDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ePrescriptions.set(changeRequest.id, changeRequest);
    this.emit("eprescription:change_request", changeRequest);

    return changeRequest;
  }

  /**
   * Send NCPDP refill request
   */
  async sendRefillRequest(
    prescriptionId: string,
    requestedBy: RefillRequest["requestedBy"],
  ): Promise<RefillRequest> {
    const request: RefillRequest = {
      id: this.generateId("REFILL"),
      prescriptionId,
      patientId: "", // Would be from prescription
      requestedDate: new Date(),
      requestedBy,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.refillRequests.set(request.id, request);
    this.emit("refill:requested", request);

    // Send NCPDP REFRES message
    const refillMessage: EPrescription = {
      id: this.generateId("ERX"),
      messageId: this.generateMessageId(),
      version: this.NCPDP_VERSION,
      messageType: "REFRES",
      status: "pending",
      prescriber: {} as any,
      patient: {} as any,
      medication: {} as any,
      pharmacy: {} as any,
      writtenDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ePrescriptions.set(refillMessage.id, refillMessage);

    return request;
  }

  /**
   * Approve refill request
   */
  async approveRefillRequest(
    id: string,
    processedBy: string,
  ): Promise<RefillRequest | null> {
    const request = this.refillRequests.get(id);
    if (!request) return null;

    const updated: RefillRequest = {
      ...request,
      status: "approved",
      processedDate: new Date(),
      processedBy,
      updatedAt: new Date(),
    };

    this.refillRequests.set(id, updated);
    this.emit("refill:approved", updated);

    return updated;
  }

  /**
   * Deny refill request
   */
  async denyRefillRequest(
    id: string,
    reason: string,
    processedBy: string,
  ): Promise<RefillRequest | null> {
    const request = this.refillRequests.get(id);
    if (!request) return null;

    const updated: RefillRequest = {
      ...request,
      status: "denied",
      denialReason: reason,
      processedDate: new Date(),
      processedBy,
      updatedAt: new Date(),
    };

    this.refillRequests.set(id, updated);
    this.emit("refill:denied", updated);

    return updated;
  }

  /**
   * Get all refill requests
   */
  async getRefillRequests(filters?: {
    patientId?: string;
    status?: RefillRequest["status"];
  }): Promise<RefillRequest[]> {
    let requests = Array.from(this.refillRequests.values());

    if (filters) {
      if (filters.patientId) {
        requests = requests.filter((r) => r.patientId === filters.patientId);
      }
      if (filters.status) {
        requests = requests.filter((r) => r.status === filters.status);
      }
    }

    return requests.sort(
      (a, b) => b.requestedDate.getTime() - a.requestedDate.getTime(),
    );
  }

  /**
   * Get all e-prescriptions
   */
  async getEPrescriptions(filters?: {
    status?: EPrescription["status"];
    messageType?: EPrescription["messageType"];
  }): Promise<EPrescription[]> {
    let erxs = Array.from(this.ePrescriptions.values());

    if (filters) {
      if (filters.status) {
        erxs = erxs.filter((e) => e.status === filters.status);
      }
      if (filters.messageType) {
        erxs = erxs.filter((e) => e.messageType === filters.messageType);
      }
    }

    return erxs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Calculate expiration date based on prescription type
   */
  calculateExpirationDate(
    writtenDate: Date,
    isControlled: boolean,
    deaSchedule?: string,
  ): Date {
    const expiration = new Date(writtenDate);

    if (isControlled && deaSchedule) {
      // Schedule II: 90 days from written date in most states
      if (deaSchedule === "2") {
        expiration.setDate(expiration.getDate() + 90);
      }
      // Schedule III-V: 180 days (6 months)
      else if (["3", "4", "5"].includes(deaSchedule)) {
        expiration.setDate(expiration.getDate() + 180);
      }
    } else {
      // Non-controlled: 1 year
      expiration.setFullYear(expiration.getFullYear() + 1);
    }

    return expiration;
  }

  /**
   * Generate NCPDP message ID
   */
  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `MSG${timestamp}${random}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

const prescriptionService = new PrescriptionService();
export default prescriptionService;

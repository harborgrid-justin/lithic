/**
 * Prescription Service
 * Service for managing prescriptions, dispensing, refills, and e-prescribing
 */

import { Drug } from "./pharmacy.service";

export interface Prescription {
  id: string;
  rxNumber: string;
  status:
    | "pending"
    | "active"
    | "dispensed"
    | "cancelled"
    | "expired"
    | "on-hold";
  type: "new" | "refill" | "transfer";

  // Patient Information
  patientId: string;
  patientName: string;
  patientDOB: string;
  patientAllergies?: string[];

  // Prescriber Information
  prescriberId: string;
  prescriberName: string;
  prescriberNPI: string;
  prescriberDEA?: string;
  prescriberPhone: string;

  // Medication Information
  drugId: string;
  drug?: Drug;
  ndc: string;
  medicationName: string;
  strength: string;
  dosageForm: string;

  // Directions
  quantity: number;
  daysSupply: number;
  sig: string; // Directions for use

  // Refill Information
  refillsAuthorized: number;
  refillsRemaining: number;

  // Dates
  writtenDate: string;
  expirationDate: string;
  lastFilledDate?: string;
  nextRefillDate?: string;

  // E-Prescribe
  ePrescribed: boolean;
  ncpdpMessageId?: string;

  // Dispensing
  dispensedQuantity?: number;
  dispensedDate?: string;
  dispensedBy?: string;
  verifiedBy?: string;
  lotNumber?: string;

  // Clinical
  indication?: string;
  notes?: string;

  // Prior Authorization
  priorAuthRequired: boolean;
  priorAuthNumber?: string;
  priorAuthStatus?: "pending" | "approved" | "denied";

  // Insurance
  insuranceId?: string;
  copay?: number;

  createdAt: string;
  updatedAt: string;
}

export interface DispensingQueueItem {
  id: string;
  prescription: Prescription;
  priority: "routine" | "priority" | "urgent" | "stat";
  queuePosition: number;
  estimatedReadyTime: string;
  assignedTo?: string;
  status: "queued" | "in-progress" | "verification" | "ready" | "picked-up";
  enteredQueue: string;
  workflowSteps: {
    step: string;
    status: "pending" | "in-progress" | "completed";
    completedBy?: string;
    completedAt?: string;
  }[];
}

export interface EPrescribeMessage {
  id: string;
  messageType: "NEWRX" | "REFRES" | "RXCHG" | "CANRX" | "ERROR" | "STATUS";
  direction: "inbound" | "outbound";
  ncpdpMessageId: string;
  prescriptionId?: string;
  prescriberId: string;
  pharmacyNCPDP: string;
  patientId: string;
  messageData: any;
  status: "received" | "processed" | "error" | "sent" | "acknowledged";
  receivedAt?: string;
  processedAt?: string;
  sentAt?: string;
  errorMessage?: string;
}

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  prescription?: Prescription;
  requestedBy: "patient" | "provider" | "pharmacist";
  requestDate: string;
  status: "pending" | "approved" | "denied" | "processing" | "completed";
  approvedBy?: string;
  approvedDate?: string;
  denialReason?: string;
  notes?: string;
  tooSoonDate?: string;
}

class PrescriptionService {
  private apiBase = "/api/pharmacy";

  /**
   * Prescription Management
   */
  async getPrescriptions(filters?: {
    patientId?: string;
    prescriberId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Prescription[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append("patientId", filters.patientId);
    if (filters?.prescriberId)
      params.append("prescriberId", filters.prescriberId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await fetch(`${this.apiBase}/prescriptions?${params}`);
    if (!response.ok) throw new Error("Failed to get prescriptions");
    return response.json();
  }

  async getPrescription(id: string): Promise<Prescription> {
    const response = await fetch(`${this.apiBase}/prescriptions/${id}`);
    if (!response.ok) throw new Error("Prescription not found");
    return response.json();
  }

  async createPrescription(
    data: Omit<Prescription, "id" | "rxNumber" | "createdAt" | "updatedAt">,
  ): Promise<Prescription> {
    const response = await fetch(`${this.apiBase}/prescriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create prescription");
    return response.json();
  }

  async updatePrescription(
    id: string,
    data: Partial<Prescription>,
  ): Promise<Prescription> {
    const response = await fetch(`${this.apiBase}/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update prescription");
    return response.json();
  }

  async cancelPrescription(id: string, reason: string): Promise<Prescription> {
    const response = await fetch(`${this.apiBase}/prescriptions/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to cancel prescription");
    return response.json();
  }

  /**
   * Dispensing Operations
   */
  async getDispensingQueue(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<DispensingQueueItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);

    const response = await fetch(`${this.apiBase}/dispense/queue?${params}`);
    if (!response.ok) throw new Error("Failed to get dispensing queue");
    return response.json();
  }

  async addToDispensingQueue(
    prescriptionId: string,
    priority: DispensingQueueItem["priority"] = "routine",
  ): Promise<DispensingQueueItem> {
    const response = await fetch(`${this.apiBase}/dispense/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId, priority }),
    });
    if (!response.ok) throw new Error("Failed to add to dispensing queue");
    return response.json();
  }

  async updateQueueItem(
    id: string,
    data: Partial<DispensingQueueItem>,
  ): Promise<DispensingQueueItem> {
    const response = await fetch(`${this.apiBase}/dispense/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update queue item");
    return response.json();
  }

  async dispensePrescription(data: {
    prescriptionId: string;
    queueItemId: string;
    dispensedQuantity: number;
    lotNumber: string;
    ndc: string;
    dispensedBy: string;
    verifiedBy: string;
    patientCounseled: boolean;
    notes?: string;
  }): Promise<Prescription> {
    const response = await fetch(`${this.apiBase}/dispense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to dispense prescription");
    return response.json();
  }

  async verifyPrescription(
    prescriptionId: string,
    verifiedBy: string,
    checks: {
      drugVerified: boolean;
      quantityVerified: boolean;
      labelVerified: boolean;
      patientVerified: boolean;
      interactionsChecked: boolean;
    },
  ): Promise<void> {
    const response = await fetch(
      `${this.apiBase}/prescriptions/${prescriptionId}/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedBy, checks }),
      },
    );
    if (!response.ok) throw new Error("Failed to verify prescription");
  }

  /**
   * Refill Management
   */
  async getRefillRequests(filters?: {
    status?: string;
    patientId?: string;
  }): Promise<RefillRequest[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.patientId) params.append("patientId", filters.patientId);

    const response = await fetch(`${this.apiBase}/refills?${params}`);
    if (!response.ok) throw new Error("Failed to get refill requests");
    return response.json();
  }

  async createRefillRequest(
    prescriptionId: string,
    requestedBy: string,
  ): Promise<RefillRequest> {
    const response = await fetch(`${this.apiBase}/refills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId, requestedBy }),
    });
    if (!response.ok) throw new Error("Failed to create refill request");
    return response.json();
  }

  async processRefillRequest(
    id: string,
    action: "approve" | "deny",
    data: {
      processedBy: string;
      notes?: string;
      denialReason?: string;
    },
  ): Promise<RefillRequest> {
    const response = await fetch(`${this.apiBase}/refills/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to ${action} refill request`);
    return response.json();
  }

  async checkRefillEligibility(prescriptionId: string): Promise<{
    eligible: boolean;
    reason?: string;
    nextEligibleDate?: string;
    refillsRemaining: number;
  }> {
    const response = await fetch(
      `${this.apiBase}/refills/${prescriptionId}/eligibility`,
    );
    if (!response.ok) throw new Error("Failed to check refill eligibility");
    return response.json();
  }

  /**
   * E-Prescribing (NCPDP)
   */
  async getEPrescribeMessages(filters?: {
    messageType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EPrescribeMessage[]> {
    const params = new URLSearchParams();
    if (filters?.messageType) params.append("messageType", filters.messageType);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const response = await fetch(`${this.apiBase}/eprescribe?${params}`);
    if (!response.ok) throw new Error("Failed to get e-prescribe messages");
    return response.json();
  }

  async processNewRxMessage(messageId: string): Promise<Prescription> {
    const response = await fetch(
      `${this.apiBase}/eprescribe/${messageId}/process`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    if (!response.ok) throw new Error("Failed to process NEWRX message");
    return response.json();
  }

  async sendRefillResponse(
    messageId: string,
    response_type: "approved" | "denied" | "replaced",
    data?: {
      denialReason?: string;
      replacementPrescriptionId?: string;
      notes?: string;
    },
  ): Promise<void> {
    const response = await fetch(
      `${this.apiBase}/eprescribe/${messageId}/respond`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response_type, ...data }),
      },
    );
    if (!response.ok) throw new Error("Failed to send refill response");
  }

  async sendChangeRequest(
    prescriptionId: string,
    changes: {
      field: string;
      currentValue: string;
      requestedValue: string;
      reason: string;
    }[],
  ): Promise<EPrescribeMessage> {
    const response = await fetch(`${this.apiBase}/eprescribe/change-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId, changes }),
    });
    if (!response.ok) throw new Error("Failed to send change request");
    return response.json();
  }

  async cancelEPrescription(
    prescriptionId: string,
    reason: string,
  ): Promise<void> {
    const response = await fetch(`${this.apiBase}/eprescribe/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescriptionId, reason }),
    });
    if (!response.ok) throw new Error("Failed to cancel e-prescription");
  }

  /**
   * Label Generation
   */
  async generateMedicationLabel(prescriptionId: string): Promise<{
    labelData: {
      rxNumber: string;
      patientName: string;
      medicationName: string;
      strength: string;
      sig: string;
      quantity: number;
      refillsRemaining: number;
      prescriberName: string;
      dispensedDate: string;
      expirationDate: string;
      lotNumber: string;
      ndc: string;
      warnings: string[];
      pharmacyInfo: {
        name: string;
        address: string;
        phone: string;
        npi: string;
      };
    };
    barcodeData: string;
  }> {
    const response = await fetch(
      `${this.apiBase}/prescriptions/${prescriptionId}/label`,
    );
    if (!response.ok) throw new Error("Failed to generate medication label");
    return response.json();
  }

  /**
   * Utility Functions
   */
  calculateNextRefillDate(
    lastFilledDate: string,
    daysSupply: number,
    allowedRefillDays: number = 3,
  ): string {
    const lastFilled = new Date(lastFilledDate);
    const nextRefill = new Date(lastFilled);
    nextRefill.setDate(nextRefill.getDate() + daysSupply - allowedRefillDays);
    return nextRefill.toISOString().split("T")[0];
  }

  calculateExpirationDate(
    writtenDate: string,
    controlled: boolean = false,
  ): string {
    const written = new Date(writtenDate);
    const expiration = new Date(written);

    if (controlled) {
      // Controlled substances typically expire after 6 months
      expiration.setMonth(expiration.getMonth() + 6);
    } else {
      // Non-controlled prescriptions typically expire after 1 year
      expiration.setFullYear(expiration.getFullYear() + 1);
    }

    return expiration.toISOString().split("T")[0];
  }

  generateRxNumber(): string {
    // Generate a unique prescription number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `RX${timestamp}${random}`;
  }

  isTooSoonToRefill(
    lastFilledDate: string,
    daysSupply: number,
    allowedDays: number = 3,
  ): boolean {
    const lastFilled = new Date(lastFilledDate);
    const eligibleDate = new Date(lastFilled);
    eligibleDate.setDate(eligibleDate.getDate() + daysSupply - allowedDays);

    return new Date() < eligibleDate;
  }
}

export const prescriptionService = new PrescriptionService();
export default prescriptionService;

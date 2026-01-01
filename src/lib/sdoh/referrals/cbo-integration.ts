/**
 * Community-Based Organization (CBO) Integration
 * Bi-directional referral updates and secure messaging
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";
import type { Referral, ReferralStatus } from "./referral-engine";

// ============================================================================
// CBO Portal Types
// ============================================================================

export interface CBOOrganization {
  id: string;
  name: string;
  type: CBOType;
  taxId?: string;
  website?: string;
  description?: string;

  // Contact
  primaryContact: CBOContact;
  additionalContacts: CBOContact[];

  // Address
  addresses: CBOAddress[];

  // Services
  servicesProvided: string[];
  populationsServed: string[];
  serviceArea: ServiceArea;

  // Integration
  portalAccess: boolean;
  portalUrl?: string;
  apiEnabled: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  sftpEnabled: boolean;
  sftpConfig?: SFTPConfig;

  // Capabilities
  acceptsElectronicReferrals: boolean;
  providesReferralUpdates: boolean;
  supportsSecureMessaging: boolean;
  closedLoopCapable: boolean;
  realTimeUpdates: boolean;

  // Credentials
  credentials: CBOCredential[];
  licenses: CBOLicense[];

  // Status
  isActive: boolean;
  verifiedDate?: Date;
  lastContactDate?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
}

export enum CBOType {
  NONPROFIT = "NONPROFIT",
  GOVERNMENT = "GOVERNMENT",
  FAITH_BASED = "FAITH_BASED",
  COMMUNITY_CENTER = "COMMUNITY_CENTER",
  SOCIAL_SERVICE_AGENCY = "SOCIAL_SERVICE_AGENCY",
  HEALTHCARE_ORGANIZATION = "HEALTHCARE_ORGANIZATION",
  EDUCATIONAL_INSTITUTION = "EDUCATIONAL_INSTITUTION",
  OTHER = "OTHER",
}

export interface CBOContact {
  id: string;
  name: string;
  title?: string;
  role: ContactRole;
  email: string;
  phone: string;
  phoneExtension?: string;
  isPrimary: boolean;
  receiveReferrals: boolean;
  receiveUpdates: boolean;
}

export enum ContactRole {
  EXECUTIVE_DIRECTOR = "EXECUTIVE_DIRECTOR",
  PROGRAM_DIRECTOR = "PROGRAM_DIRECTOR",
  CASE_MANAGER = "CASE_MANAGER",
  INTAKE_COORDINATOR = "INTAKE_COORDINATOR",
  IT_ADMINISTRATOR = "IT_ADMINISTRATOR",
  OTHER = "OTHER",
}

export interface CBOAddress {
  id: string;
  type: "main" | "service" | "administrative" | "mailing";
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  isPrimary: boolean;
}

export interface ServiceArea {
  type: "city" | "county" | "state" | "zip_codes" | "national";
  values: string[];
}

export interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  publicKey: string;
  inboundPath: string;
  outboundPath: string;
}

export interface CBOCredential {
  id: string;
  type: string;
  name: string;
  issuingOrganization: string;
  credentialNumber?: string;
  issueDate: Date;
  expirationDate?: Date;
  verifiedDate?: Date;
  documentUrl?: string;
}

export interface CBOLicense {
  id: string;
  type: string;
  licenseNumber: string;
  issuingState: string;
  issueDate: Date;
  expirationDate: Date;
  status: "active" | "expired" | "suspended";
  documentUrl?: string;
}

// ============================================================================
// CBO Portal Integration
// ============================================================================

export interface CBOPortalCredentials {
  cboId: string;
  portalUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

export class CBOPortalClient {
  private credentials: CBOPortalCredentials;

  constructor(credentials: CBOPortalCredentials) {
    this.credentials = credentials;
  }

  /**
   * Send referral to CBO portal
   */
  async sendReferral(referral: Referral): Promise<{
    success: boolean;
    externalReferralId?: string;
    trackingUrl?: string;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.credentials.portalUrl}/api/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.apiKey}`,
        },
        body: JSON.stringify(this.convertReferralForCBO(referral)),
      });

      if (!response.ok) {
        throw new Error(`CBO Portal error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        externalReferralId: data.referralId,
        trackingUrl: data.trackingUrl,
      };
    } catch (error) {
      console.error("Failed to send referral to CBO:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get referral status from CBO portal
   */
  async getReferralStatus(externalReferralId: string): Promise<{
    status: ReferralStatus;
    statusDate: Date;
    notes?: string;
    serviceProvided?: boolean;
    outcomeNotes?: string;
  }> {
    const response = await fetch(
      `${this.credentials.portalUrl}/api/referrals/${externalReferralId}`,
      {
        headers: {
          Authorization: `Bearer ${this.credentials.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CBO Portal error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      status: this.mapCBOStatus(data.status),
      statusDate: new Date(data.statusDate),
      notes: data.notes,
      serviceProvided: data.serviceProvided,
      outcomeNotes: data.outcomeNotes,
    };
  }

  /**
   * Send message to CBO
   */
  async sendMessage(message: CBOMessage): Promise<boolean> {
    try {
      const response = await fetch(`${this.credentials.portalUrl}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.credentials.apiKey}`,
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to send message to CBO:", error);
      return false;
    }
  }

  /**
   * Get messages from CBO
   */
  async getMessages(referralId: string): Promise<CBOMessage[]> {
    const response = await fetch(
      `${this.credentials.portalUrl}/api/referrals/${referralId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${this.credentials.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CBO Portal error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    cboId: string,
    serviceType: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentSlot[]> {
    const params = new URLSearchParams({
      serviceType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await fetch(
      `${this.credentials.portalUrl}/api/appointments/available?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.credentials.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CBO Portal error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Schedule appointment
   */
  async scheduleAppointment(appointment: {
    referralId: string;
    slotId: string;
    patientName: string;
    patientPhone: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    appointmentId?: string;
    confirmationNumber?: string;
  }> {
    try {
      const response = await fetch(
        `${this.credentials.portalUrl}/api/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.credentials.apiKey}`,
          },
          body: JSON.stringify(appointment),
        }
      );

      if (!response.ok) {
        throw new Error(`CBO Portal error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        appointmentId: data.appointmentId,
        confirmationNumber: data.confirmationNumber,
      };
    } catch (error) {
      console.error("Failed to schedule appointment:", error);
      return { success: false };
    }
  }

  /**
   * Convert internal referral to CBO format
   */
  private convertReferralForCBO(referral: Referral): any {
    return {
      referralId: referral.id,
      patient: {
        name: referral.patientName,
        dateOfBirth: referral.patientDOB,
        phone: referral.patientPhone,
        email: referral.patientEmail,
        address: referral.patientAddress,
        preferredLanguage: referral.patientLanguage,
      },
      referralInfo: {
        needCategory: referral.needCategory,
        reason: referral.reasonForReferral,
        clinicalNotes: referral.clinicalNotes,
        urgency: referral.urgency,
      },
      referringProvider: {
        name: referral.referringProviderName,
        organization: referral.referringOrganization,
        phone: referral.referringPhone,
        email: referral.referringEmail,
      },
      consent: {
        obtained: referral.consentObtained,
        date: referral.consentDate,
      },
      referralDate: referral.sentDate || referral.createdAt,
    };
  }

  /**
   * Map CBO status to internal status
   */
  private mapCBOStatus(cboStatus: string): ReferralStatus {
    const statusMap: Record<string, ReferralStatus> = {
      pending: ReferralStatus.PENDING,
      received: ReferralStatus.RECEIVED,
      accepted: ReferralStatus.ACCEPTED,
      rejected: ReferralStatus.REJECTED,
      "in-progress": ReferralStatus.IN_PROGRESS,
      completed: ReferralStatus.COMPLETED,
      cancelled: ReferralStatus.CANCELLED,
    };

    return statusMap[cboStatus.toLowerCase()] || ReferralStatus.PENDING;
  }
}

// ============================================================================
// Secure Messaging
// ============================================================================

export interface CBOMessage {
  id: string;
  referralId: string;
  threadId?: string;
  direction: "inbound" | "outbound";
  sender: {
    id: string;
    name: string;
    organization: string;
    type: "provider" | "cbo" | "system";
  };
  recipient: {
    id: string;
    name: string;
    organization: string;
  };
  subject: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
  messageType: MessageType;
  attachments?: MessageAttachment[];
  readStatus: boolean;
  readAt?: Date;
  sentAt: Date;
  encrypted: boolean;
  hipaaCompliant: boolean;
}

export enum MessageType {
  GENERAL = "GENERAL",
  STATUS_UPDATE = "STATUS_UPDATE",
  APPOINTMENT_REQUEST = "APPOINTMENT_REQUEST",
  APPOINTMENT_CONFIRMATION = "APPOINTMENT_CONFIRMATION",
  DOCUMENTATION_REQUEST = "DOCUMENTATION_REQUEST",
  OUTCOME_REPORT = "OUTCOME_REPORT",
  FOLLOW_UP = "FOLLOW_UP",
  QUESTION = "QUESTION",
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  encrypted: boolean;
}

export interface AppointmentSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
  serviceType: string;
  providerId?: string;
  providerName?: string;
  location?: string;
}

// ============================================================================
// CBO Data Exchange Formats
// ============================================================================

export interface StandardizedReferralData {
  // Based on Gravity Project FHIR IG
  version: string;
  referralId: string;
  patientIdentifier: string;
  patientDemographics: {
    name: string;
    dateOfBirth: string;
    gender?: string;
    preferredLanguage?: string;
    address?: any;
    phone?: string;
    email?: string;
  };
  socialNeeds: SocialNeed[];
  referralDetails: {
    category: string;
    subcategory?: string;
    urgency: string;
    reason: string;
    clinicalContext?: string;
  };
  referringProvider: {
    npi?: string;
    name: string;
    organization: string;
    phone: string;
    email: string;
  };
  targetOrganization: {
    name: string;
    id?: string;
    phone?: string;
    email?: string;
  };
  consent: {
    obtained: boolean;
    date?: string;
    scope?: string[];
  };
  requestedServices?: string[];
  expectedOutcome?: string;
  followUpRequired?: boolean;
  metadata: {
    sentDate: string;
    expirationDate?: string;
    trackingNumber?: string;
  };
}

export interface SocialNeed {
  category: string;
  code: string; // SNOMED, LOINC, or ICD-10 code
  display: string;
  severity?: "low" | "moderate" | "high" | "critical";
  identifiedDate: string;
  screeningTool?: string;
  notes?: string;
}

// ============================================================================
// Webhook Handler for CBO Updates
// ============================================================================

export interface CBOWebhookPayload {
  event: WebhookEvent;
  referralId: string;
  externalReferralId: string;
  timestamp: string;
  cboId: string;
  cboName: string;
  data: any;
  signature: string;
}

export enum WebhookEvent {
  REFERRAL_RECEIVED = "referral.received",
  REFERRAL_ACCEPTED = "referral.accepted",
  REFERRAL_REJECTED = "referral.rejected",
  STATUS_UPDATED = "referral.status_updated",
  APPOINTMENT_SCHEDULED = "appointment.scheduled",
  APPOINTMENT_CANCELLED = "appointment.cancelled",
  SERVICE_PROVIDED = "service.provided",
  OUTCOME_REPORTED = "outcome.reported",
  MESSAGE_RECEIVED = "message.received",
}

export class CBOWebhookHandler {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    // Implement HMAC signature verification
    // This is a placeholder - implement actual crypto verification
    return true;
  }

  /**
   * Process webhook payload
   */
  async processWebhook(payload: CBOWebhookPayload): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify signature
      const isValid = this.verifySignature(
        JSON.stringify(payload),
        payload.signature
      );

      if (!isValid) {
        return { success: false, error: "Invalid signature" };
      }

      // Process based on event type
      switch (payload.event) {
        case WebhookEvent.REFERRAL_RECEIVED:
          await this.handleReferralReceived(payload);
          break;
        case WebhookEvent.REFERRAL_ACCEPTED:
          await this.handleReferralAccepted(payload);
          break;
        case WebhookEvent.REFERRAL_REJECTED:
          await this.handleReferralRejected(payload);
          break;
        case WebhookEvent.STATUS_UPDATED:
          await this.handleStatusUpdated(payload);
          break;
        case WebhookEvent.SERVICE_PROVIDED:
          await this.handleServiceProvided(payload);
          break;
        case WebhookEvent.OUTCOME_REPORTED:
          await this.handleOutcomeReported(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${payload.event}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async handleReferralReceived(payload: CBOWebhookPayload): Promise<void> {
    console.log("Referral received by CBO:", payload.referralId);
    // Update referral status in database
  }

  private async handleReferralAccepted(payload: CBOWebhookPayload): Promise<void> {
    console.log("Referral accepted by CBO:", payload.referralId);
    // Update referral status and notify referring provider
  }

  private async handleReferralRejected(payload: CBOWebhookPayload): Promise<void> {
    console.log("Referral rejected by CBO:", payload.referralId);
    // Update referral status and notify referring provider
  }

  private async handleStatusUpdated(payload: CBOWebhookPayload): Promise<void> {
    console.log("Referral status updated:", payload.referralId);
    // Update referral status
  }

  private async handleServiceProvided(payload: CBOWebhookPayload): Promise<void> {
    console.log("Service provided:", payload.referralId);
    // Update referral with service details
  }

  private async handleOutcomeReported(payload: CBOWebhookPayload): Promise<void> {
    console.log("Outcome reported:", payload.referralId);
    // Update referral with outcome data
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const CBOOrganizationSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(CBOType),
  primaryContact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    role: z.nativeEnum(ContactRole),
  }),
  servicesProvided: z.array(z.string()),
  acceptsElectronicReferrals: z.boolean(),
});

export const CBOMessageSchema = z.object({
  referralId: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  messageType: z.nativeEnum(MessageType),
});

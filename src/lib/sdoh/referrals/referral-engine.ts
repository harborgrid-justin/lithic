/**
 * SDOH Referral Engine
 * Closed-loop referral management
 * SDOH & Care Coordination Specialist - Agent 7
 */

import { z } from "zod";

// ============================================================================
// Referral Types
// ============================================================================

export enum ReferralStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  SENT = "SENT",
  RECEIVED = "RECEIVED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum ReferralPriority {
  ROUTINE = "ROUTINE",
  URGENT = "URGENT",
  EMERGENCY = "EMERGENCY",
}

export enum ReferralMethod {
  EMAIL = "EMAIL",
  FAX = "FAX",
  PHONE = "PHONE",
  ONLINE_FORM = "ONLINE_FORM",
  API = "API",
  MANUAL = "MANUAL",
}

export interface Referral {
  id: string;
  organizationId: string;

  // Patient Information
  patientId: string;
  patientName: string;
  patientDOB: Date;
  patientPhone?: string;
  patientEmail?: string;
  patientAddress?: Address;
  patientLanguage?: string;

  // Referral Details
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  needCategory: string;
  reasonForReferral: string;
  clinicalNotes?: string;
  urgency: ReferralPriority;

  // Referring Provider
  referringProviderId: string;
  referringProviderName: string;
  referringOrganization: string;
  referringPhone: string;
  referringEmail: string;

  // Receiving Organization
  receivingOrganizationId?: string;
  receivingOrganizationName: string;
  receivingContactName?: string;
  receivingPhone?: string;
  receivingEmail?: string;

  // Status and Tracking
  status: ReferralStatus;
  statusHistory: StatusUpdate[];
  sentDate?: Date;
  receivedDate?: Date;
  completedDate?: Date;
  expirationDate?: Date;

  // Communication
  method: ReferralMethod;
  confirmationNumber?: string;
  trackingUrl?: string;

  // Consent and Privacy
  consentObtained: boolean;
  consentDate?: Date;
  consentFormId?: string;
  hipaaCompliant: boolean;

  // Follow-up
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;

  // Outcomes
  serviceProvided: boolean;
  outcomeNotes?: string;
  patientSatisfaction?: number; // 1-5 rating
  needMet: boolean;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  closedLoopEnabled: boolean;
  externalReferralId?: string;
  attachments?: ReferralAttachment[];
  tags: string[];
  internalNotes?: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface StatusUpdate {
  status: ReferralStatus;
  timestamp: Date;
  updatedBy: string;
  updatedByOrganization?: string;
  notes?: string;
  automated: boolean;
}

export interface ReferralAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// ============================================================================
// Referral Creation and Management
// ============================================================================

export interface CreateReferralRequest {
  // Patient Info
  patientId: string;
  patientName: string;
  patientDOB: Date;
  patientPhone?: string;
  patientEmail?: string;
  patientAddress?: Address;
  patientLanguage?: string;

  // Referral Details
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  needCategory: string;
  reasonForReferral: string;
  clinicalNotes?: string;
  urgency?: ReferralPriority;

  // Provider Info
  referringProviderId: string;
  referringProviderName: string;
  organizationId: string;

  // Consent
  consentObtained: boolean;
  consentDate?: Date;
  consentFormId?: string;

  // Receiving Organization
  receivingOrganizationName: string;
  receivingPhone?: string;
  receivingEmail?: string;

  // Follow-up
  followUpRequired?: boolean;
  followUpDate?: Date;

  // Method
  method?: ReferralMethod;
}

export interface UpdateReferralRequest {
  referralId: string;
  status?: ReferralStatus;
  notes?: string;
  serviceProvided?: boolean;
  needMet?: boolean;
  outcomeNotes?: string;
  patientSatisfaction?: number;
  updatedBy: string;
}

export class ReferralEngine {
  private referrals: Map<string, Referral> = new Map();

  /**
   * Create a new referral
   */
  createReferral(request: CreateReferralRequest): Referral {
    const referralId = this.generateReferralId();
    const now = new Date();

    const referral: Referral = {
      id: referralId,
      organizationId: request.organizationId,

      // Patient
      patientId: request.patientId,
      patientName: request.patientName,
      patientDOB: request.patientDOB,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      patientAddress: request.patientAddress,
      patientLanguage: request.patientLanguage,

      // Referral
      resourceId: request.resourceId,
      resourceName: request.resourceName,
      resourceCategory: request.resourceCategory,
      needCategory: request.needCategory,
      reasonForReferral: request.reasonForReferral,
      clinicalNotes: request.clinicalNotes,
      urgency: request.urgency || ReferralPriority.ROUTINE,

      // Provider
      referringProviderId: request.referringProviderId,
      referringProviderName: request.referringProviderName,
      referringOrganization: request.organizationId,
      referringPhone: "",
      referringEmail: "",

      // Receiving
      receivingOrganizationName: request.receivingOrganizationName,
      receivingPhone: request.receivingPhone,
      receivingEmail: request.receivingEmail,

      // Status
      status: ReferralStatus.DRAFT,
      statusHistory: [
        {
          status: ReferralStatus.DRAFT,
          timestamp: now,
          updatedBy: request.referringProviderId,
          notes: "Referral created",
          automated: false,
        },
      ],

      // Method
      method: request.method || ReferralMethod.EMAIL,

      // Consent
      consentObtained: request.consentObtained,
      consentDate: request.consentDate,
      consentFormId: request.consentFormId,
      hipaaCompliant: true,

      // Follow-up
      followUpRequired: request.followUpRequired || false,
      followUpDate: request.followUpDate,

      // Outcomes
      serviceProvided: false,
      needMet: false,

      // Metadata
      createdBy: request.referringProviderId,
      createdAt: now,
      updatedAt: now,
      closedLoopEnabled: false,
      tags: [],
    };

    // Set expiration date (90 days for routine, 30 for urgent, 7 for emergency)
    const expirationDays =
      referral.urgency === ReferralPriority.EMERGENCY
        ? 7
        : referral.urgency === ReferralPriority.URGENT
          ? 30
          : 90;
    referral.expirationDate = new Date(
      now.getTime() + expirationDays * 24 * 60 * 60 * 1000
    );

    this.referrals.set(referralId, referral);
    return referral;
  }

  /**
   * Send referral
   */
  sendReferral(referralId: string, sentBy: string): Referral {
    const referral = this.referrals.get(referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    if (referral.status !== ReferralStatus.DRAFT) {
      throw new Error("Only draft referrals can be sent");
    }

    const now = new Date();
    referral.status = ReferralStatus.SENT;
    referral.sentDate = now;
    referral.updatedAt = now;

    referral.statusHistory.push({
      status: ReferralStatus.SENT,
      timestamp: now,
      updatedBy: sentBy,
      notes: "Referral sent to receiving organization",
      automated: false,
    });

    this.referrals.set(referralId, referral);
    return referral;
  }

  /**
   * Update referral status
   */
  updateReferralStatus(request: UpdateReferralRequest): Referral {
    const referral = this.referrals.get(request.referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    const now = new Date();

    if (request.status) {
      referral.status = request.status;
      referral.statusHistory.push({
        status: request.status,
        timestamp: now,
        updatedBy: request.updatedBy,
        notes: request.notes,
        automated: false,
      });

      // Set special dates based on status
      if (request.status === ReferralStatus.RECEIVED && !referral.receivedDate) {
        referral.receivedDate = now;
      }
      if (request.status === ReferralStatus.COMPLETED && !referral.completedDate) {
        referral.completedDate = now;
      }
    }

    if (request.serviceProvided !== undefined) {
      referral.serviceProvided = request.serviceProvided;
    }
    if (request.needMet !== undefined) {
      referral.needMet = request.needMet;
    }
    if (request.outcomeNotes) {
      referral.outcomeNotes = request.outcomeNotes;
    }
    if (request.patientSatisfaction) {
      referral.patientSatisfaction = request.patientSatisfaction;
    }

    referral.updatedAt = now;
    this.referrals.set(request.referralId, referral);
    return referral;
  }

  /**
   * Accept referral (by receiving organization)
   */
  acceptReferral(referralId: string, acceptedBy: string): Referral {
    return this.updateReferralStatus({
      referralId,
      status: ReferralStatus.ACCEPTED,
      notes: "Referral accepted by receiving organization",
      updatedBy: acceptedBy,
    });
  }

  /**
   * Reject referral (by receiving organization)
   */
  rejectReferral(
    referralId: string,
    rejectedBy: string,
    reason: string
  ): Referral {
    return this.updateReferralStatus({
      referralId,
      status: ReferralStatus.REJECTED,
      notes: `Referral rejected: ${reason}`,
      updatedBy: rejectedBy,
    });
  }

  /**
   * Complete referral
   */
  completeReferral(
    referralId: string,
    completedBy: string,
    outcome: {
      serviceProvided: boolean;
      needMet: boolean;
      outcomeNotes: string;
      patientSatisfaction?: number;
    }
  ): Referral {
    return this.updateReferralStatus({
      referralId,
      status: ReferralStatus.COMPLETED,
      notes: "Referral completed",
      updatedBy: completedBy,
      ...outcome,
    });
  }

  /**
   * Cancel referral
   */
  cancelReferral(referralId: string, cancelledBy: string, reason: string): Referral {
    return this.updateReferralStatus({
      referralId,
      status: ReferralStatus.CANCELLED,
      notes: `Referral cancelled: ${reason}`,
      updatedBy: cancelledBy,
    });
  }

  /**
   * Get referral by ID
   */
  getReferral(referralId: string): Referral | undefined {
    return this.referrals.get(referralId);
  }

  /**
   * Get referrals for patient
   */
  getPatientReferrals(patientId: string): Referral[] {
    return Array.from(this.referrals.values()).filter(
      (r) => r.patientId === patientId
    );
  }

  /**
   * Get referrals by status
   */
  getReferralsByStatus(status: ReferralStatus): Referral[] {
    return Array.from(this.referrals.values()).filter(
      (r) => r.status === status
    );
  }

  /**
   * Get referrals for organization
   */
  getOrganizationReferrals(organizationId: string): Referral[] {
    return Array.from(this.referrals.values()).filter(
      (r) => r.organizationId === organizationId
    );
  }

  /**
   * Get expired referrals
   */
  getExpiredReferrals(): Referral[] {
    const now = new Date();
    return Array.from(this.referrals.values()).filter(
      (r) =>
        r.expirationDate &&
        r.expirationDate < now &&
        r.status !== ReferralStatus.COMPLETED &&
        r.status !== ReferralStatus.CANCELLED &&
        r.status !== ReferralStatus.EXPIRED
    );
  }

  /**
   * Mark expired referrals
   */
  markExpiredReferrals(): number {
    const expiredReferrals = this.getExpiredReferrals();
    expiredReferrals.forEach((referral) => {
      this.updateReferralStatus({
        referralId: referral.id,
        status: ReferralStatus.EXPIRED,
        notes: "Referral expired",
        updatedBy: "system",
      });
    });
    return expiredReferrals.length;
  }

  /**
   * Get referrals needing follow-up
   */
  getReferralsNeedingFollowUp(): Referral[] {
    const now = new Date();
    return Array.from(this.referrals.values()).filter(
      (r) =>
        r.followUpRequired &&
        r.followUpDate &&
        r.followUpDate <= now &&
        r.status !== ReferralStatus.COMPLETED &&
        r.status !== ReferralStatus.CANCELLED
    );
  }

  /**
   * Add attachment to referral
   */
  addAttachment(
    referralId: string,
    attachment: Omit<ReferralAttachment, "id">
  ): Referral {
    const referral = this.referrals.get(referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    if (!referral.attachments) {
      referral.attachments = [];
    }

    const newAttachment: ReferralAttachment = {
      ...attachment,
      id: this.generateAttachmentId(),
    };

    referral.attachments.push(newAttachment);
    referral.updatedAt = new Date();

    this.referrals.set(referralId, referral);
    return referral;
  }

  /**
   * Generate analytics for referrals
   */
  getAnalytics(organizationId?: string): ReferralAnalytics {
    const referrals = organizationId
      ? this.getOrganizationReferrals(organizationId)
      : Array.from(this.referrals.values());

    const total = referrals.length;
    const byStatus = this.groupByStatus(referrals);
    const byPriority = this.groupByPriority(referrals);
    const byCategory = this.groupByCategory(referrals);

    const completedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED
    );

    const successRate =
      completedReferrals.length > 0
        ? (completedReferrals.filter((r) => r.needMet).length /
            completedReferrals.length) *
          100
        : 0;

    const avgSatisfaction =
      completedReferrals.length > 0
        ? completedReferrals
            .filter((r) => r.patientSatisfaction)
            .reduce((sum, r) => sum + (r.patientSatisfaction || 0), 0) /
          completedReferrals.filter((r) => r.patientSatisfaction).length
        : 0;

    const avgTimeToCompletion = this.calculateAvgTimeToCompletion(
      completedReferrals
    );

    return {
      total,
      byStatus,
      byPriority,
      byCategory,
      completionRate: (completedReferrals.length / total) * 100,
      successRate,
      avgSatisfaction,
      avgTimeToCompletionDays: avgTimeToCompletion,
    };
  }

  private groupByStatus(referrals: Referral[]): Record<ReferralStatus, number> {
    const grouped = {} as Record<ReferralStatus, number>;
    Object.values(ReferralStatus).forEach((status) => {
      grouped[status] = referrals.filter((r) => r.status === status).length;
    });
    return grouped;
  }

  private groupByPriority(
    referrals: Referral[]
  ): Record<ReferralPriority, number> {
    const grouped = {} as Record<ReferralPriority, number>;
    Object.values(ReferralPriority).forEach((priority) => {
      grouped[priority] = referrals.filter((r) => r.urgency === priority).length;
    });
    return grouped;
  }

  private groupByCategory(referrals: Referral[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    referrals.forEach((r) => {
      grouped[r.needCategory] = (grouped[r.needCategory] || 0) + 1;
    });
    return grouped;
  }

  private calculateAvgTimeToCompletion(referrals: Referral[]): number {
    if (referrals.length === 0) return 0;

    const totalDays = referrals.reduce((sum, r) => {
      if (r.sentDate && r.completedDate) {
        const days =
          (r.completedDate.getTime() - r.sentDate.getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);

    return totalDays / referrals.length;
  }

  private generateReferralId(): string {
    return `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAttachmentId(): string {
    return `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ReferralAnalytics {
  total: number;
  byStatus: Record<ReferralStatus, number>;
  byPriority: Record<ReferralPriority, number>;
  byCategory: Record<string, number>;
  completionRate: number;
  successRate: number;
  avgSatisfaction: number;
  avgTimeToCompletionDays: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const CreateReferralSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  patientDOB: z.date(),
  patientPhone: z.string().optional(),
  patientEmail: z.string().email().optional(),
  resourceId: z.string(),
  resourceName: z.string(),
  resourceCategory: z.string(),
  needCategory: z.string(),
  reasonForReferral: z.string().min(10),
  clinicalNotes: z.string().optional(),
  urgency: z.nativeEnum(ReferralPriority).optional(),
  referringProviderId: z.string(),
  referringProviderName: z.string(),
  organizationId: z.string(),
  consentObtained: z.boolean(),
  consentDate: z.date().optional(),
  receivingOrganizationName: z.string(),
  method: z.nativeEnum(ReferralMethod).optional(),
});

export const UpdateReferralSchema = z.object({
  referralId: z.string(),
  status: z.nativeEnum(ReferralStatus).optional(),
  notes: z.string().optional(),
  serviceProvided: z.boolean().optional(),
  needMet: z.boolean().optional(),
  outcomeNotes: z.string().optional(),
  patientSatisfaction: z.number().min(1).max(5).optional(),
  updatedBy: z.string(),
});

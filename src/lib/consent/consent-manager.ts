/**
 * Consent Manager Service
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive consent management with:
 * - Digital consent forms
 * - Version tracking
 * - Expiration handling
 * - Withdrawal tracking
 * - Audit trails
 * - HIPAA compliance
 */

import { v4 as uuidv4 } from 'uuid';

export type ConsentType =
  | 'treatment'
  | 'research'
  | 'data_sharing'
  | 'marketing'
  | 'telehealth'
  | 'photography'
  | 'disclosure'
  | 'hipaa_authorization'
  | 'financial'
  | 'general';

export type ConsentStatus =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'withdrawn'
  | 'expired'
  | 'revoked';

export interface ConsentForm {
  id: string;
  organizationId: string;
  patientId: string;
  type: ConsentType;
  title: string;
  description: string;
  content: string;
  version: string;
  status: ConsentStatus;
  grantedAt?: Date;
  deniedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  effectiveDate: Date;
  consentMethod: 'digital' | 'verbal' | 'written' | 'implied';
  signatureRequired: boolean;
  signatureData?: string;
  witnessRequired: boolean;
  witnessSignature?: string;
  witnessName?: string;
  scope: ConsentScope;
  restrictions: ConsentRestriction[];
  relatedForms: string[];
  documentUrls: string[];
  languageCode: string;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  auditLog: ConsentAuditEntry[];
  metadata: Record<string, unknown>;
}

export interface ConsentScope {
  purpose: string[];
  dataCategories: string[];
  recipients: string[];
  geographicScope?: string[];
  duration?: {
    startDate: Date;
    endDate?: Date;
    indefinite: boolean;
  };
}

export interface ConsentRestriction {
  id: string;
  type: 'exclude' | 'limit' | 'require';
  description: string;
  appliesTo: string[];
  effectiveDate: Date;
  expirationDate?: Date;
}

export interface ConsentAuditEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'viewed' | 'granted' | 'denied' | 'withdrawn' | 'modified' | 'expired' | 'revoked';
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
}

interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class ConsentManager {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Create a new consent form
   */
  async createConsentForm(data: CreateConsentFormData): Promise<ConsentForm> {
    const formId = uuidv4();

    const form: ConsentForm = {
      id: formId,
      organizationId: this.organizationId,
      patientId: data.patientId,
      type: data.type,
      title: data.title,
      description: data.description,
      content: data.content,
      version: data.version || '1.0',
      status: 'pending',
      effectiveDate: data.effectiveDate || new Date(),
      expiresAt: data.expiresAt,
      consentMethod: data.consentMethod || 'digital',
      signatureRequired: data.signatureRequired !== false,
      witnessRequired: data.witnessRequired || false,
      scope: data.scope,
      restrictions: data.restrictions || [],
      relatedForms: data.relatedForms || [],
      documentUrls: data.documentUrls || [],
      languageCode: data.languageCode || 'en',
      isActive: true,
      createdAt: new Date(),
      createdBy: this.userId,
      updatedAt: new Date(),
      updatedBy: this.userId,
      auditLog: [
        {
          id: uuidv4(),
          timestamp: new Date(),
          action: 'created',
          performedBy: this.userId,
          performedByName: await this.getUserName(this.userId),
          performedByRole: 'provider',
          ipAddress: data.ipAddress || '',
          userAgent: data.userAgent || '',
          details: {
            type: data.type,
            version: data.version || '1.0',
          },
        },
      ],
      metadata: data.metadata || {},
    };

    await this.saveConsentForm(form);

    return form;
  }

  /**
   * Grant consent
   */
  async grantConsent(
    formId: string,
    signatureData?: string,
    witnessData?: { signature: string; name: string },
    metadata?: ConsentGrantMetadata
  ): Promise<ConsentForm> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    if (form.status !== 'pending') {
      throw new Error('Consent form is not pending');
    }

    if (form.signatureRequired && !signatureData) {
      throw new Error('Signature is required');
    }

    if (form.witnessRequired && !witnessData) {
      throw new Error('Witness signature is required');
    }

    form.status = 'granted';
    form.grantedAt = new Date();
    form.signatureData = signatureData;
    form.witnessSignature = witnessData?.signature;
    form.witnessName = witnessData?.name;
    form.ipAddress = metadata?.ipAddress;
    form.userAgent = metadata?.userAgent;
    form.geolocation = metadata?.geolocation;
    form.updatedAt = new Date();
    form.updatedBy = this.userId;

    form.auditLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'granted',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'patient',
      ipAddress: metadata?.ipAddress || '',
      userAgent: metadata?.userAgent || '',
      details: {
        hasSignature: !!signatureData,
        hasWitness: !!witnessData,
      },
    });

    await this.saveConsentForm(form);
    await this.notifyConsentGranted(form);

    return form;
  }

  /**
   * Deny consent
   */
  async denyConsent(
    formId: string,
    reason?: string,
    metadata?: ConsentGrantMetadata
  ): Promise<ConsentForm> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    if (form.status !== 'pending') {
      throw new Error('Consent form is not pending');
    }

    form.status = 'denied';
    form.deniedAt = new Date();
    form.updatedAt = new Date();
    form.updatedBy = this.userId;

    form.auditLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'denied',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'patient',
      ipAddress: metadata?.ipAddress || '',
      userAgent: metadata?.userAgent || '',
      details: {
        reason: reason || 'Not specified',
      },
    });

    await this.saveConsentForm(form);
    await this.notifyConsentDenied(form);

    return form;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    formId: string,
    reason: string,
    metadata?: ConsentGrantMetadata
  ): Promise<ConsentForm> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    if (form.status !== 'granted') {
      throw new Error('Consent is not granted');
    }

    form.status = 'withdrawn';
    form.withdrawnAt = new Date();
    form.isActive = false;
    form.updatedAt = new Date();
    form.updatedBy = this.userId;

    form.auditLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'withdrawn',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'patient',
      ipAddress: metadata?.ipAddress || '',
      userAgent: metadata?.userAgent || '',
      details: {
        reason,
      },
    });

    await this.saveConsentForm(form);
    await this.notifyConsentWithdrawn(form);

    return form;
  }

  /**
   * Get consent form
   */
  async getConsentForm(formId: string): Promise<ConsentForm | null> {
    // Load from database
    return null;
  }

  /**
   * Get patient consents
   */
  async getPatientConsents(patientId: string): Promise<ConsentForm[]> {
    // Query from database
    return [];
  }

  /**
   * Get active consents by type
   */
  async getActiveConsentsByType(
    patientId: string,
    type: ConsentType
  ): Promise<ConsentForm[]> {
    const consents = await this.getPatientConsents(patientId);
    return consents.filter(
      (c) => c.type === type && c.status === 'granted' && c.isActive
    );
  }

  /**
   * Check if patient has active consent
   */
  async hasActiveConsent(
    patientId: string,
    type: ConsentType,
    purpose?: string
  ): Promise<boolean> {
    const consents = await this.getActiveConsentsByType(patientId, type);

    if (purpose) {
      return consents.some((c) => c.scope.purpose.includes(purpose));
    }

    return consents.length > 0;
  }

  /**
   * Get consent history
   */
  async getConsentHistory(formId: string): Promise<ConsentAuditEntry[]> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    return form.auditLog;
  }

  /**
   * Add restriction to consent
   */
  async addRestriction(
    formId: string,
    restriction: Omit<ConsentRestriction, 'id'>
  ): Promise<ConsentForm> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    const newRestriction: ConsentRestriction = {
      id: uuidv4(),
      ...restriction,
    };

    form.restrictions.push(newRestriction);
    form.updatedAt = new Date();
    form.updatedBy = this.userId;

    form.auditLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'modified',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'provider',
      ipAddress: '',
      userAgent: '',
      details: {
        action: 'restriction_added',
        restriction: newRestriction,
      },
    });

    await this.saveConsentForm(form);

    return form;
  }

  /**
   * Remove restriction from consent
   */
  async removeRestriction(
    formId: string,
    restrictionId: string
  ): Promise<ConsentForm> {
    const form = await this.getConsentForm(formId);

    if (!form) {
      throw new Error('Consent form not found');
    }

    form.restrictions = form.restrictions.filter((r) => r.id !== restrictionId);
    form.updatedAt = new Date();
    form.updatedBy = this.userId;

    form.auditLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'modified',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'provider',
      ipAddress: '',
      userAgent: '',
      details: {
        action: 'restriction_removed',
        restrictionId,
      },
    });

    await this.saveConsentForm(form);

    return form;
  }

  /**
   * Check and expire consents
   */
  async expireConsents(): Promise<void> {
    const now = new Date();

    // This would be run as a scheduled task
    const forms = await this.getExpiringConsents(now);

    for (const form of forms) {
      form.status = 'expired';
      form.isActive = false;
      form.updatedAt = now;

      form.auditLog.push({
        id: uuidv4(),
        timestamp: now,
        action: 'expired',
        performedBy: 'system',
        performedByName: 'System',
        performedByRole: 'system',
        ipAddress: '',
        userAgent: '',
        details: {
          expiresAt: form.expiresAt,
        },
      });

      await this.saveConsentForm(form);
      await this.notifyConsentExpired(form);
    }
  }

  /**
   * Generate consent summary
   */
  async generateConsentSummary(
    patientId: string
  ): Promise<ConsentSummary> {
    const consents = await this.getPatientConsents(patientId);

    const summary: ConsentSummary = {
      patientId,
      totalConsents: consents.length,
      activeConsents: consents.filter((c) => c.status === 'granted' && c.isActive).length,
      pendingConsents: consents.filter((c) => c.status === 'pending').length,
      withdrawnConsents: consents.filter((c) => c.status === 'withdrawn').length,
      expiredConsents: consents.filter((c) => c.status === 'expired').length,
      byType: this.groupConsentsByType(consents),
      expiringWithin30Days: consents.filter(
        (c) =>
          c.expiresAt &&
          c.status === 'granted' &&
          c.expiresAt.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
      ).length,
      lastUpdated: new Date(),
    };

    return summary;
  }

  // Private helper methods

  private async getUserName(userId: string): Promise<string> {
    return 'User Name';
  }

  private async saveConsentForm(form: ConsentForm): Promise<void> {
    // Save to database
  }

  private async notifyConsentGranted(form: ConsentForm): Promise<void> {
    // Send notifications
  }

  private async notifyConsentDenied(form: ConsentForm): Promise<void> {
    // Send notifications
  }

  private async notifyConsentWithdrawn(form: ConsentForm): Promise<void> {
    // Send notifications
  }

  private async notifyConsentExpired(form: ConsentForm): Promise<void> {
    // Send notifications
  }

  private async getExpiringConsents(date: Date): Promise<ConsentForm[]> {
    // Query expiring consents
    return [];
  }

  private groupConsentsByType(consents: ConsentForm[]): Record<ConsentType, number> {
    const groups: Record<string, number> = {};

    for (const consent of consents) {
      groups[consent.type] = (groups[consent.type] || 0) + 1;
    }

    return groups as Record<ConsentType, number>;
  }
}

interface CreateConsentFormData {
  patientId: string;
  type: ConsentType;
  title: string;
  description: string;
  content: string;
  version?: string;
  effectiveDate?: Date;
  expiresAt?: Date;
  consentMethod?: 'digital' | 'verbal' | 'written' | 'implied';
  signatureRequired?: boolean;
  witnessRequired?: boolean;
  scope: ConsentScope;
  restrictions?: ConsentRestriction[];
  relatedForms?: string[];
  documentUrls?: string[];
  languageCode?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface ConsentGrantMetadata {
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;
}

interface ConsentSummary {
  patientId: string;
  totalConsents: number;
  activeConsents: number;
  pendingConsents: number;
  withdrawnConsents: number;
  expiredConsents: number;
  byType: Record<ConsentType, number>;
  expiringWithin30Days: number;
  lastUpdated: Date;
}

export default ConsentManager;

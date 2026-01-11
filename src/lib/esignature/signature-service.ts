/**
 * E-Signature Service
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive electronic signature service with:
 * - Signature request creation and management
 * - Multi-party signing workflows
 * - Authentication and verification
 * - Audit trail generation
 * - Compliance tracking (ESIGN, UETA, eIDAS)
 */

import {
  SignatureRequest,
  Signer,
  SignatureField,
  SignatureData,
  SignatureStatus,
  SignatureAuditEntry,
  SignatureTemplate,
  BulkSignatureRequest,
  BulkSignatureResult,
  EmbeddedSigningSession,
  SignatureAnalytics,
} from '@/types/esignature';
import { v4 as uuidv4 } from 'uuid';

export class SignatureService {
  private organizationId: string;
  private userId: string;

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Create a new signature request
   */
  async createSignatureRequest(
    data: CreateSignatureRequestData
  ): Promise<SignatureRequest> {
    const requestId = uuidv4();

    const request: SignatureRequest = {
      id: requestId,
      organizationId: this.organizationId,
      documentId: data.documentId,
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      title: data.title,
      message: data.message,
      status: 'draft',
      signingOrder: data.signingOrder || 'parallel',
      signers: data.signers.map((signer, index) => ({
        id: uuidv4(),
        signerOrder: signer.order || index + 1,
        role: signer.role,
        name: signer.name,
        email: signer.email,
        phoneNumber: signer.phoneNumber,
        userId: signer.userId,
        status: 'draft',
        authenticationMethod: signer.authenticationMethod || 'email',
        signatureFields: signer.fields || [],
        attachments: [],
        accessCode: signer.requireAccessCode
          ? this.generateAccessCode()
          : undefined,
      })),
      expiresAt: data.expiresAt,
      reminderFrequency: data.reminderFrequency || 'none',
      emailSubject: data.emailSubject,
      emailMessage: data.emailMessage,
      brandingOptions: data.brandingOptions,
      notificationSettings: {
        notifyOnSent: true,
        notifyOnViewed: true,
        notifyOnSigned: true,
        notifyOnCompleted: true,
        notifyOnDeclined: true,
        notifyOnExpired: true,
        ccEmails: data.ccEmails || [],
      },
      declineOptions: {
        allowDecline: data.allowDecline !== false,
        requireDeclineReason: data.requireDeclineReason || false,
        declineReasons: data.declineReasons || [
          'Not authorized',
          'Incorrect information',
          'Other',
        ],
      },
      authenticationRequired: data.authenticationRequired || false,
      inPersonSigning: data.inPersonSigning || false,
      allowComments: data.allowComments !== false,
      requireAllSignatures: data.requireAllSignatures !== false,
      createdAt: new Date(),
      createdBy: this.userId,
      createdByName: await this.getUserName(this.userId),
      lastActivityAt: new Date(),
      auditTrail: [
        {
          id: uuidv4(),
          timestamp: new Date(),
          action: 'created',
          performedBy: this.userId,
          performedByName: await this.getUserName(this.userId),
          performedByRole: 'creator',
          ipAddress: data.ipAddress || '',
          userAgent: data.userAgent || '',
          details: {
            title: data.title,
            signerCount: data.signers.length,
          },
        },
      ],
      metadata: data.metadata,
      webhookUrl: data.webhookUrl,
      callbackUrl: data.callbackUrl,
    };

    await this.saveSignatureRequest(request);

    return request;
  }

  /**
   * Send signature request to signers
   */
  async sendSignatureRequest(requestId: string): Promise<SignatureRequest> {
    const request = await this.getSignatureRequest(requestId);

    if (!request) {
      throw new Error('Signature request not found');
    }

    if (request.status !== 'draft') {
      throw new Error('Signature request already sent');
    }

    // Update request status
    request.status = 'sent';
    request.sentAt = new Date();

    // Send emails to signers based on signing order
    if (request.signingOrder === 'sequential') {
      // Send only to first signer
      const firstSigner = request.signers.find((s) => s.signerOrder === 1);
      if (firstSigner) {
        await this.sendSignerEmail(request, firstSigner);
        firstSigner.status = 'sent';
        firstSigner.sentAt = new Date();
      }
    } else {
      // Send to all signers
      for (const signer of request.signers) {
        await this.sendSignerEmail(request, signer);
        signer.status = 'sent';
        signer.sentAt = new Date();
      }
    }

    // Add audit entry
    request.auditTrail.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'sent',
      performedBy: this.userId,
      performedByName: await this.getUserName(this.userId),
      performedByRole: 'creator',
      ipAddress: '',
      userAgent: '',
      details: {
        sentTo: request.signers.map((s) => s.email),
      },
    });

    await this.saveSignatureRequest(request);

    // Trigger webhook
    if (request.webhookUrl) {
      await this.triggerWebhook(request.webhookUrl, 'sent', request);
    }

    return request;
  }

  /**
   * Sign document
   */
  async signDocument(
    requestId: string,
    signerId: string,
    signatures: Record<string, SignatureData>,
    metadata: SigningMetadata
  ): Promise<SignatureRequest> {
    const request = await this.getSignatureRequest(requestId);

    if (!request) {
      throw new Error('Signature request not found');
    }

    const signer = request.signers.find((s) => s.id === signerId);

    if (!signer) {
      throw new Error('Signer not found');
    }

    if (signer.status === 'signed') {
      throw new Error('Already signed');
    }

    // Validate all required fields are signed
    const requiredFields = signer.signatureFields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!signatures[field.id]) {
        throw new Error(`Required field ${field.label} not signed`);
      }
    }

    // Apply signatures to fields
    for (const [fieldId, signatureData] of Object.entries(signatures)) {
      const field = signer.signatureFields.find((f) => f.id === fieldId);
      if (field) {
        field.signatureData = signatureData;
        field.value = signatureData.textValue || 'Signed';
      }
    }

    // Update signer status
    signer.status = 'signed';
    signer.signedAt = new Date();
    signer.ipAddress = metadata.ipAddress;
    signer.userAgent = metadata.userAgent;
    signer.geolocation = metadata.geolocation;
    signer.signingDuration = metadata.signingDuration;

    // Add audit entry
    request.auditTrail.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'signed',
      performedBy: signerId,
      performedByName: signer.name,
      performedByRole: signer.role,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      geolocation: metadata.geolocation,
      details: {
        fieldCount: Object.keys(signatures).length,
      },
    });

    // Check if all required signers have signed
    const allSigned = this.checkAllSigned(request);

    if (allSigned) {
      request.status = 'completed';
      request.completedAt = new Date();

      // Add completion audit entry
      request.auditTrail.push({
        id: uuidv4(),
        timestamp: new Date(),
        action: 'completed',
        performedBy: this.userId,
        performedByName: 'System',
        performedByRole: 'system',
        ipAddress: '',
        userAgent: '',
        details: {
          totalSigners: request.signers.length,
        },
      });

      // Generate signed document
      await this.generateSignedDocument(request);
    } else if (request.signingOrder === 'sequential') {
      // Send to next signer
      const nextSigner = this.getNextSigner(request);
      if (nextSigner) {
        await this.sendSignerEmail(request, nextSigner);
        nextSigner.status = 'sent';
        nextSigner.sentAt = new Date();
      }
    }

    await this.saveSignatureRequest(request);

    // Trigger webhook
    if (request.webhookUrl) {
      await this.triggerWebhook(
        request.webhookUrl,
        allSigned ? 'completed' : 'signed',
        request
      );
    }

    return request;
  }

  /**
   * Decline signature request
   */
  async declineSignatureRequest(
    requestId: string,
    signerId: string,
    reason: string
  ): Promise<SignatureRequest> {
    const request = await this.getSignatureRequest(requestId);

    if (!request) {
      throw new Error('Signature request not found');
    }

    const signer = request.signers.find((s) => s.id === signerId);

    if (!signer) {
      throw new Error('Signer not found');
    }

    if (!request.declineOptions.allowDecline) {
      throw new Error('Declining is not allowed');
    }

    signer.status = 'declined';
    signer.declinedAt = new Date();
    signer.declineReason = reason;

    request.status = 'declined';

    // Add audit entry
    request.auditTrail.push({
      id: uuidv4(),
      timestamp: new Date(),
      action: 'declined',
      performedBy: signerId,
      performedByName: signer.name,
      performedByRole: signer.role,
      ipAddress: '',
      userAgent: '',
      details: {
        reason,
      },
    });

    await this.saveSignatureRequest(request);

    // Trigger webhook
    if (request.webhookUrl) {
      await this.triggerWebhook(request.webhookUrl, 'declined', request);
    }

    return request;
  }

  /**
   * Get signature request
   */
  async getSignatureRequest(
    requestId: string
  ): Promise<SignatureRequest | null> {
    // Load from database
    return null;
  }

  /**
   * Get signature requests for organization
   */
  async getSignatureRequests(
    filters: SignatureRequestFilters = {}
  ): Promise<SignatureRequest[]> {
    // Query from database
    return [];
  }

  /**
   * Create embedded signing session
   */
  async createEmbeddedSession(
    requestId: string,
    signerId: string,
    returnUrl?: string
  ): Promise<EmbeddedSigningSession> {
    const request = await this.getSignatureRequest(requestId);

    if (!request) {
      throw new Error('Signature request not found');
    }

    const signer = request.signers.find((s) => s.id === signerId);

    if (!signer) {
      throw new Error('Signer not found');
    }

    const sessionId = uuidv4();
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${sessionId}`;

    const session: EmbeddedSigningSession = {
      sessionId,
      signatureRequestId: requestId,
      signerId,
      url,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      returnUrl,
      events: [],
    };

    await this.saveEmbeddedSession(session);

    signer.embeddedSigningUrl = url;
    await this.saveSignatureRequest(request);

    return session;
  }

  /**
   * Get signature analytics
   */
  async getAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<SignatureAnalytics> {
    // Query analytics from database
    return {
      totalRequests: 0,
      completedRequests: 0,
      declinedRequests: 0,
      expiredRequests: 0,
      averageCompletionTime: 0,
      completionRate: 0,
      declineRate: 0,
      averageViewToSignTime: 0,
      topDeclineReasons: [],
      signerEngagement: {
        totalViews: 0,
        averageViewDuration: 0,
        averageViewsBeforeSigning: 0,
        mobileSigningRate: 0,
        desktopSigningRate: 0,
        peakSigningHours: [],
        peakSigningDays: [],
      },
    };
  }

  // Private helper methods

  private async getUserName(userId: string): Promise<string> {
    return 'User Name';
  }

  private generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async sendSignerEmail(
    request: SignatureRequest,
    signer: Signer
  ): Promise<void> {
    // Send email with signing link
  }

  private checkAllSigned(request: SignatureRequest): boolean {
    if (!request.requireAllSignatures) {
      return request.signers.some((s) => s.status === 'signed');
    }
    return request.signers
      .filter((s) => s.role === 'signer')
      .every((s) => s.status === 'signed');
  }

  private getNextSigner(request: SignatureRequest): Signer | undefined {
    const signedOrders = request.signers
      .filter((s) => s.status === 'signed')
      .map((s) => s.signerOrder);

    const maxOrder = Math.max(...signedOrders, 0);

    return request.signers.find((s) => s.signerOrder === maxOrder + 1);
  }

  private async generateSignedDocument(
    request: SignatureRequest
  ): Promise<void> {
    // Generate PDF with signatures applied
  }

  private async saveSignatureRequest(request: SignatureRequest): Promise<void> {
    // Save to database
  }

  private async saveEmbeddedSession(
    session: EmbeddedSigningSession
  ): Promise<void> {
    // Save to database
  }

  private async triggerWebhook(
    url: string,
    event: string,
    data: SignatureRequest
  ): Promise<void> {
    // Send webhook notification
  }
}

interface CreateSignatureRequestData {
  documentId: string;
  documentName: string;
  documentUrl: string;
  title: string;
  message?: string;
  signingOrder?: 'parallel' | 'sequential' | 'hybrid';
  signers: Array<{
    name: string;
    email: string;
    phoneNumber?: string;
    userId?: string;
    role: 'signer' | 'approver' | 'witness' | 'carbon_copy';
    order?: number;
    authenticationMethod?: 'email' | 'sms' | 'access_code';
    requireAccessCode?: boolean;
    fields?: SignatureField[];
  }>;
  expiresAt?: Date;
  reminderFrequency?: 'daily' | 'weekly' | 'none';
  emailSubject?: string;
  emailMessage?: string;
  brandingOptions?: any;
  ccEmails?: string[];
  allowDecline?: boolean;
  requireDeclineReason?: boolean;
  declineReasons?: string[];
  authenticationRequired?: boolean;
  inPersonSigning?: boolean;
  allowComments?: boolean;
  requireAllSignatures?: boolean;
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  callbackUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SigningMetadata {
  ipAddress: string;
  userAgent: string;
  geolocation?: any;
  signingDuration?: number;
}

interface SignatureRequestFilters {
  status?: SignatureStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  signerId?: string;
}

export default SignatureService;

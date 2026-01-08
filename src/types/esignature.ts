/**
 * E-Signature Types
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive type definitions for electronic signature workflows,
 * signature capture, authentication, and compliance tracking.
 */

export type SignatureType = 'drawn' | 'typed' | 'uploaded' | 'biometric' | 'digital_certificate';

export type SignatureStatus =
  | 'draft'
  | 'sent'
  | 'delivered'
  | 'viewed'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'voided'
  | 'cancelled';

export type SignerRole = 'signer' | 'approver' | 'witness' | 'carbon_copy' | 'reviewer';

export type AuthenticationMethod =
  | 'email'
  | 'sms'
  | 'access_code'
  | 'id_verification'
  | 'two_factor'
  | 'biometric'
  | 'certificate';

export type SigningOrder = 'parallel' | 'sequential' | 'hybrid';

export interface SignatureRequest {
  id: string;
  organizationId: string;
  documentId: string;
  documentName: string;
  documentUrl: string;
  title: string;
  message?: string;
  status: SignatureStatus;
  signingOrder: SigningOrder;
  signers: Signer[];
  expiresAt?: Date;
  reminderFrequency?: 'daily' | 'weekly' | 'none';
  emailSubject?: string;
  emailMessage?: string;
  brandingOptions?: BrandingOptions;
  notificationSettings: NotificationSettings;
  declineOptions: DeclineOptions;
  authenticationRequired: boolean;
  inPersonSigning: boolean;
  allowComments: boolean;
  requireAllSignatures: boolean;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  sentAt?: Date;
  completedAt?: Date;
  lastActivityAt: Date;
  auditTrail: SignatureAuditEntry[];
  metadata?: Record<string, unknown>;
  webhookUrl?: string;
  callbackUrl?: string;
}

export interface Signer {
  id: string;
  signerOrder: number;
  role: SignerRole;
  name: string;
  email: string;
  phoneNumber?: string;
  userId?: string;
  status: SignatureStatus;
  signedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  viewedAt?: Date;
  sentAt?: Date;
  authenticationMethod: AuthenticationMethod;
  authenticationData?: AuthenticationData;
  accessCode?: string;
  signatureFields: SignatureField[];
  ipAddress?: string;
  userAgent?: string;
  geolocation?: Geolocation;
  signingDuration?: number;
  attachments: SignerAttachment[];
  comments?: SignerComment[];
  redirectUrl?: string;
  embeddedSigningUrl?: string;
}

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'dropdown' | 'radio';
  label: string;
  required: boolean;
  value?: string;
  signatureData?: SignatureData;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontSize?: number;
  fontFamily?: string;
  tooltip?: string;
  validationRule?: string;
  options?: string[];
  groupId?: string;
  conditionalLogic?: ConditionalLogic;
}

export interface SignatureData {
  type: SignatureType;
  imageUrl?: string;
  imageData?: string;
  svgData?: string;
  textValue?: string;
  fontFamily?: string;
  biometricData?: BiometricData;
  certificateData?: CertificateData;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  geolocation?: Geolocation;
}

export interface BiometricData {
  pressure: number[];
  speed: number[];
  acceleration: number[];
  duration: number;
  strokes: BiometricStroke[];
  signatureHash: string;
}

export interface BiometricStroke {
  points: BiometricPoint[];
  pressure: number[];
  timestamp: number[];
}

export interface BiometricPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface CertificateData {
  certificateId: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  algorithm: string;
  publicKey: string;
}

export interface AuthenticationData {
  method: AuthenticationMethod;
  successful: boolean;
  attemptedAt: Date;
  verificationCode?: string;
  idVerification?: IDVerification;
  twoFactorData?: TwoFactorData;
  biometricMatch?: number;
}

export interface IDVerification {
  provider: string;
  documentType: 'passport' | 'drivers_license' | 'national_id' | 'other';
  documentNumber: string;
  issueDate: Date;
  expiryDate: Date;
  matchScore: number;
  faceMatchScore: number;
  livenessScore: number;
  verifiedAt: Date;
}

export interface TwoFactorData {
  method: 'sms' | 'email' | 'app' | 'hardware_token';
  verifiedAt: Date;
  deviceId?: string;
  deviceName?: string;
}

export interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  timezone: string;
}

export interface SignerAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  required: boolean;
}

export interface SignerComment {
  id: string;
  text: string;
  createdAt: Date;
  pageNumber?: number;
  position?: {
    x: number;
    y: number;
  };
}

export interface BrandingOptions {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailHeaderUrl?: string;
  emailFooterText?: string;
  companyName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface NotificationSettings {
  notifyOnSent: boolean;
  notifyOnViewed: boolean;
  notifyOnSigned: boolean;
  notifyOnCompleted: boolean;
  notifyOnDeclined: boolean;
  notifyOnExpired: boolean;
  ccEmails: string[];
}

export interface DeclineOptions {
  allowDecline: boolean;
  requireDeclineReason: boolean;
  declineReasons: string[];
}

export interface ConditionalLogic {
  dependsOn: string;
  showIf: string;
  requiredIf: string;
}

export interface SignatureAuditEntry {
  id: string;
  timestamp: Date;
  action: SignatureAuditAction;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  ipAddress: string;
  userAgent: string;
  geolocation?: Geolocation;
  details: Record<string, unknown>;
}

export type SignatureAuditAction =
  | 'created'
  | 'sent'
  | 'delivered'
  | 'viewed'
  | 'downloaded'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'voided'
  | 'cancelled'
  | 'reminder_sent'
  | 'authentication_attempted'
  | 'authentication_successful'
  | 'authentication_failed'
  | 'document_modified'
  | 'signer_added'
  | 'signer_removed'
  | 'access_code_viewed';

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  documentTemplateId: string;
  signers: SignerTemplate[];
  fields: SignatureField[];
  settings: TemplateSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface SignerTemplate {
  order: number;
  role: SignerRole;
  roleName: string;
  authenticationMethod: AuthenticationMethod;
  routingOrder: number;
}

export interface TemplateSettings {
  expirationDays: number;
  reminderFrequency: 'daily' | 'weekly' | 'none';
  authenticationRequired: boolean;
  allowDecline: boolean;
  requireAllSignatures: boolean;
  brandingOptions?: BrandingOptions;
}

export interface SignaturePadOptions {
  width: number;
  height: number;
  backgroundColor: string;
  penColor: string;
  penWidth: number;
  minPenWidth: number;
  maxPenWidth: number;
  velocityFilterWeight: number;
  dotSize: number;
  throttle: number;
  minDistance: number;
  onBegin?: () => void;
  onEnd?: () => void;
  captureVelocity: boolean;
  capturePressure: boolean;
}

export interface SignaturePadData {
  isEmpty: boolean;
  points: SignaturePoint[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    pointCount: number;
    strokeCount: number;
  };
}

export interface SignaturePoint {
  x: number;
  y: number;
  time: number;
  pressure?: number;
  velocityX?: number;
  velocityY?: number;
}

export interface SignatureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
  tamperDetection: TamperDetection;
  certificateValidation?: CertificateValidation;
}

export interface TamperDetection {
  isTampered: boolean;
  modifications: string[];
  detectionMethod: string;
  confidence: number;
}

export interface CertificateValidation {
  isValid: boolean;
  isRevoked: boolean;
  isTrusted: boolean;
  validationPath: string[];
  ocspResponse?: OCSPResponse;
  crlStatus?: CRLStatus;
}

export interface OCSPResponse {
  status: 'good' | 'revoked' | 'unknown';
  producedAt: Date;
  nextUpdate: Date;
}

export interface CRLStatus {
  isRevoked: boolean;
  revocationDate?: Date;
  reason?: string;
}

export interface BulkSignatureRequest {
  templateId: string;
  recipients: BulkRecipient[];
  commonSettings: Partial<SignatureRequest>;
  batchSize: number;
  scheduleAt?: Date;
}

export interface BulkRecipient {
  name: string;
  email: string;
  phoneNumber?: string;
  customFields: Record<string, string>;
}

export interface BulkSignatureResult {
  totalRequests: number;
  successful: number;
  failed: number;
  pending: number;
  requestIds: string[];
  errors: Array<{
    recipient: string;
    error: string;
  }>;
}

export interface EmbeddedSigningSession {
  sessionId: string;
  signatureRequestId: string;
  signerId: string;
  url: string;
  expiresAt: Date;
  returnUrl?: string;
  events: EmbeddedSigningEvent[];
}

export interface EmbeddedSigningEvent {
  type: 'started' | 'completed' | 'declined' | 'error' | 'exception';
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface SignatureAnalytics {
  totalRequests: number;
  completedRequests: number;
  declinedRequests: number;
  expiredRequests: number;
  averageCompletionTime: number;
  completionRate: number;
  declineRate: number;
  averageViewToSignTime: number;
  topDeclineReasons: Array<{ reason: string; count: number }>;
  signerEngagement: SignerEngagementMetrics;
}

export interface SignerEngagementMetrics {
  totalViews: number;
  averageViewDuration: number;
  averageViewsBeforeSigning: number;
  mobileSigningRate: number;
  desktopSigningRate: number;
  peakSigningHours: number[];
  peakSigningDays: string[];
}

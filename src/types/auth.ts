/**
 * Authentication & Authorization Module Types
 * Agent 10: Security, Auth & HIPAA Compliance
 */

import type { BaseEntity, User, Role, Permission } from './index';

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles: Role[];
  permissions: Permission[];
  mfaEnabled: boolean;
  mfaVerified: boolean;
  sessionId: string;
  lastLoginAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  organizationId?: string;
  mfaCode?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMFA: boolean;
  mfaChallenge?: MFAChallenge;
}

export interface MFAChallenge {
  challengeId: string;
  type: MFAType;
  expiresAt: Date;
}

export enum MFAType {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  BACKUP_CODE = 'BACKUP_CODE',
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface VerifyMFADto {
  challengeId: string;
  code: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession extends BaseEntity {
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  ipAddress: string;
  userAgent: string;
  device: DeviceInfo;
  location: LocationInfo | null;
  lastActivityAt: Date;
  status: SessionStatus;
  logoutAt: Date | null;
  logoutReason: string | null;
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  LOGGED_OUT = 'LOGGED_OUT',
}

export interface DeviceInfo {
  type: DeviceType;
  os: string;
  browser: string;
  version: string;
}

export enum DeviceType {
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  UNKNOWN = 'UNKNOWN',
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

// ============================================================================
// Permission & Authorization Types
// ============================================================================

export interface PermissionCheck {
  userId: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  conditions?: Record<string, any>;
}

export interface RoleAssignment extends BaseEntity {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt: Date | null;
  isTemporary: boolean;
  reason: string | null;
}

export interface PermissionGrant extends BaseEntity {
  userId: string;
  resource: string;
  actions: string[];
  conditions: Record<string, any> | null;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;
  reason: string | null;
}

// ============================================================================
// Break-the-Glass Access Types
// ============================================================================

export interface BreakGlassAccess extends BaseEntity {
  userId: string;
  userName: string;
  patientId: string;
  reason: string;
  justification: string;
  ipAddress: string;
  accessedAt: Date;
  duration: number;
  expiresAt: Date;
  resourcesAccessed: string[];
  actionsPerformed: BreakGlassAction[];
  supervisorNotified: boolean;
  supervisorId: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewStatus: ReviewStatus | null;
  reviewNotes: string | null;
}

export interface BreakGlassAction {
  timestamp: Date;
  resource: string;
  action: string;
  details: Record<string, any>;
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  VIOLATION = 'VIOLATION',
}

// ============================================================================
// Password Policy Types
// ============================================================================

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays: number;
  warningDays: number;
  maxAttempts: number;
  lockoutDuration: number;
  complexityScore: number;
}

export interface PasswordHistory extends BaseEntity {
  userId: string;
  passwordHash: string;
  changedAt: Date;
  changedBy: string;
  changedReason: PasswordChangeReason;
}

export enum PasswordChangeReason {
  USER_INITIATED = 'USER_INITIATED',
  EXPIRED = 'EXPIRED',
  RESET = 'RESET',
  ADMIN_FORCED = 'ADMIN_FORCED',
  SECURITY_BREACH = 'SECURITY_BREACH',
}

export interface PasswordStrength {
  score: number;
  strength: 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG' | 'VERY_STRONG';
  feedback: string[];
}

// ============================================================================
// Login Attempt Types
// ============================================================================

export interface LoginAttempt extends BaseEntity {
  email: string;
  userId: string | null;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason: LoginFailureReason | null;
  attemptedAt: Date;
  location: LocationInfo | null;
  accountLocked: boolean;
}

export enum LoginFailureReason {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  MFA_FAILED = 'MFA_FAILED',
  IP_BLOCKED = 'IP_BLOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  ORGANIZATION_SUSPENDED = 'ORGANIZATION_SUSPENDED',
}

// ============================================================================
// API Key Types
// ============================================================================

export interface APIKey extends BaseEntity {
  name: string;
  key: string;
  hashedKey: string;
  userId: string;
  organizationId: string;
  permissions: Permission[];
  scopes: string[];
  rateLimit: number;
  ipWhitelist: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  usageCount: number;
  status: APIKeyStatus;
}

export enum APIKeyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED',
}

export interface APIKeyUsage extends BaseEntity {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  requestedAt: Date;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthClient extends BaseEntity {
  clientId: string;
  clientSecret: string;
  name: string;
  description: string | null;
  redirectUris: string[];
  grantTypes: OAuthGrantType[];
  scopes: string[];
  organizationId: string;
  ownerId: string;
  logoUrl: string | null;
  homepageUrl: string | null;
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  status: OAuthClientStatus;
}

export enum OAuthGrantType {
  AUTHORIZATION_CODE = 'AUTHORIZATION_CODE',
  CLIENT_CREDENTIALS = 'CLIENT_CREDENTIALS',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  PASSWORD = 'PASSWORD',
}

export enum OAuthClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export interface OAuthToken extends BaseEntity {
  clientId: string;
  userId: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenType: 'Bearer';
  scope: string[];
  expiresAt: Date;
  refreshExpiresAt: Date | null;
  status: TokenStatus;
}

export enum TokenStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

// ============================================================================
// HIPAA Compliance Types
// ============================================================================

export interface PHIAccessLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  patientId: string;
  patientName: string;
  accessType: PHIAccessType;
  resource: string;
  resourceId: string;
  action: string;
  purpose: AccessPurpose | null;
  dataAccessed: string[];
  ipAddress: string;
  timestamp: Date;
  sessionId: string;
  breakGlass: boolean;
  authorized: boolean;
  denialReason: string | null;
}

export enum PHIAccessType {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  SHARE = 'SHARE',
}

export enum AccessPurpose {
  TREATMENT = 'TREATMENT',
  PAYMENT = 'PAYMENT',
  OPERATIONS = 'OPERATIONS',
  RESEARCH = 'RESEARCH',
  PUBLIC_HEALTH = 'PUBLIC_HEALTH',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export interface DataAccessAgreement extends BaseEntity {
  userId: string;
  documentType: AgreementType;
  version: string;
  content: string;
  signedAt: Date;
  ipAddress: string;
  expiresAt: Date | null;
}

export enum AgreementType {
  HIPAA_PRIVACY = 'HIPAA_PRIVACY',
  HIPAA_SECURITY = 'HIPAA_SECURITY',
  BAA = 'BAA',
  CONFIDENTIALITY = 'CONFIDENTIALITY',
  TERMS_OF_USE = 'TERMS_OF_USE',
}

export interface EncryptionKey extends BaseEntity {
  keyId: string;
  algorithm: EncryptionAlgorithm;
  keyVersion: number;
  status: KeyStatus;
  createdAt: Date;
  rotatedAt: Date | null;
  expiresAt: Date | null;
  encryptedKey: string;
}

export enum EncryptionAlgorithm {
  AES_256_GCM = 'AES_256_GCM',
  AES_256_CBC = 'AES_256_CBC',
  RSA_2048 = 'RSA_2048',
  RSA_4096 = 'RSA_4096',
}

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  ROTATING = 'ROTATING',
  RETIRED = 'RETIRED',
  COMPROMISED = 'COMPROMISED',
}

// ============================================================================
// Security Monitoring Types
// ============================================================================

export interface SecurityAlert extends BaseEntity {
  type: SecurityAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedUserId: string | null;
  affectedResource: string | null;
  ipAddress: string | null;
  detectedAt: Date;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  status: SecurityAlertStatus;
  metadata: Record<string, any>;
}

export enum SecurityAlertType {
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  UNUSUAL_TIME = 'UNUSUAL_TIME',
  EXCESSIVE_PHI_ACCESS = 'EXCESSIVE_PHI_ACCESS',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  SUSPICIOUS_API_USAGE = 'SUSPICIOUS_API_USAGE',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SecurityAlertStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export interface RateLimitRule {
  id: string;
  name: string;
  resource: string;
  method: string | null;
  maxRequests: number;
  windowSeconds: number;
  scope: RateLimitScope;
  status: 'ACTIVE' | 'INACTIVE';
}

export enum RateLimitScope {
  GLOBAL = 'GLOBAL',
  PER_USER = 'PER_USER',
  PER_IP = 'PER_IP',
  PER_API_KEY = 'PER_API_KEY',
}

export interface RateLimitViolation extends BaseEntity {
  ruleId: string;
  userId: string | null;
  ipAddress: string;
  resource: string;
  requestCount: number;
  windowStart: Date;
  violatedAt: Date;
  blocked: boolean;
}

// ============================================================================
// DTOs
// ============================================================================

export interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles?: string[];
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
  expiresAt?: Date;
  reason?: string;
}

export interface GrantPermissionDto {
  userId: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
  expiresAt?: Date;
  reason?: string;
}

export interface InitiateBreakGlassDto {
  patientId: string;
  reason: string;
  justification: string;
  duration?: number;
}

export interface AuditQuery {
  userId?: string;
  patientId?: string;
  resource?: string;
  action?: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
  offset?: number;
}

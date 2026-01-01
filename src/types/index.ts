/**
 * Shared Types for Lithic Enterprise Healthcare Platform
 * These types are used across all modules for consistency
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface BaseEntity {
  id: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

export interface Organization extends BaseEntity {
  name: string;
  type: OrganizationType;
  npi: string;
  taxId: string;
  address: Address;
  contactInfo: ContactInfo;
  settings: OrganizationSettings;
  status: OrganizationStatus;
  subscription: SubscriptionTier;
  licenseCount: number;
  activeUntil: Date;
}

export enum OrganizationType {
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  PRACTICE = 'PRACTICE',
  HEALTH_SYSTEM = 'HEALTH_SYSTEM',
  LABORATORY = 'LABORATORY',
  IMAGING_CENTER = 'IMAGING_CENTER',
  PHARMACY = 'PHARMACY',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  INACTIVE = 'INACTIVE',
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  ENTERPRISE_PLUS = 'ENTERPRISE_PLUS',
}

export interface OrganizationSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  locale: string;
  currency: string;
  features: FeatureFlags;
  branding: BrandingSettings;
  compliance: ComplianceSettings;
}

export interface FeatureFlags {
  patientPortal: boolean;
  telemedicine: boolean;
  labIntegration: boolean;
  pharmacyIntegration: boolean;
  imagingIntegration: boolean;
  billingModule: boolean;
  analyticsModule: boolean;
  mobileApp: boolean;
}

export interface BrandingSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string;
}

export interface ComplianceSettings {
  hipaaEnabled: boolean;
  auditLogging: boolean;
  phiEncryption: boolean;
  dataRetentionDays: number;
  requireMFA: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User extends BaseEntity {
  email: string;
  emailVerified: Date | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  title: string | null;
  credentials: string | null;
  npi: string | null;
  deaNumber: string | null;
  specialty: MedicalSpecialty | null;
  roles: Role[];
  permissions: Permission[];
  status: UserStatus;
  lastLoginAt: Date | null;
  lastPasswordChange: Date;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  phone: string | null;
  avatar: string | null;
  signature: string | null;
  preferences: UserPreferences;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  defaultView: string;
  language: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  appointmentReminders: boolean;
  labResults: boolean;
  criticalAlerts: boolean;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  color: string;
}

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  PHYSICIAN = 'PHYSICIAN',
  NURSE = 'NURSE',
  NURSE_PRACTITIONER = 'NURSE_PRACTITIONER',
  PHYSICIAN_ASSISTANT = 'PHYSICIAN_ASSISTANT',
  MEDICAL_ASSISTANT = 'MEDICAL_ASSISTANT',
  FRONT_DESK = 'FRONT_DESK',
  BILLING_STAFF = 'BILLING_STAFF',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  PHARMACIST = 'PHARMACIST',
  RADIOLOGIST = 'RADIOLOGIST',
  RADIOLOGY_TECH = 'RADIOLOGY_TECH',
  PATIENT = 'PATIENT',
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  conditions: Record<string, any> | null;
}

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXECUTE = 'EXECUTE',
  APPROVE = 'APPROVE',
  SIGN = 'SIGN',
  PRESCRIBE = 'PRESCRIBE',
  ORDER = 'ORDER',
  ADMIN = 'ADMIN',
}

// ============================================================================
// Audit & Security Types
// ============================================================================

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId: string;
  phiAccessed: boolean;
  success: boolean;
  errorMessage: string | null;
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  EMERGENCY_ACCESS = 'EMERGENCY_ACCESS',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  FAILED_LOGIN = 'FAILED_LOGIN',
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  ipAddress: string;
  userAgent: string;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface SecurityIncident {
  id: string;
  organizationId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  affectedUsers: string[];
  affectedResources: string[];
  detectedAt: Date;
  resolvedAt: Date | null;
  status: IncidentStatus;
  metadata: Record<string, any>;
}

export enum IncidentType {
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  BRUTE_FORCE = 'BRUTE_FORCE',
  DATA_BREACH = 'DATA_BREACH',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

// ============================================================================
// Common Value Objects
// ============================================================================

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  county: string | null;
}

export interface ContactInfo {
  phone: string;
  fax: string | null;
  email: string;
  website: string | null;
}

export interface Name {
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  prefix: string | null;
  preferredName: string | null;
}

// ============================================================================
// Medical Types
// ============================================================================

export enum MedicalSpecialty {
  FAMILY_MEDICINE = 'FAMILY_MEDICINE',
  INTERNAL_MEDICINE = 'INTERNAL_MEDICINE',
  PEDIATRICS = 'PEDIATRICS',
  OBSTETRICS_GYNECOLOGY = 'OBSTETRICS_GYNECOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  EMERGENCY_MEDICINE = 'EMERGENCY_MEDICINE',
  PSYCHIATRY = 'PSYCHIATRY',
  SURGERY = 'SURGERY',
  ORTHOPEDICS = 'ORTHOPEDICS',
  RADIOLOGY = 'RADIOLOGY',
  ANESTHESIOLOGY = 'ANESTHESIOLOGY',
  PATHOLOGY = 'PATHOLOGY',
  NEUROLOGY = 'NEUROLOGY',
  ONCOLOGY = 'ONCOLOGY',
  UROLOGY = 'UROLOGY',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  OTOLARYNGOLOGY = 'OTOLARYNGOLOGY',
  PULMONOLOGY = 'PULMONOLOGY',
  GASTROENTEROLOGY = 'GASTROENTEROLOGY',
  NEPHROLOGY = 'NEPHROLOGY',
  ENDOCRINOLOGY = 'ENDOCRINOLOGY',
  RHEUMATOLOGY = 'RHEUMATOLOGY',
  INFECTIOUS_DISEASE = 'INFECTIOUS_DISEASE',
  ALLERGY_IMMUNOLOGY = 'ALLERGY_IMMUNOLOGY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
  DECLINE_TO_ANSWER = 'DECLINE_TO_ANSWER',
}

export enum BloodType {
  A_POSITIVE = 'A_POSITIVE',
  A_NEGATIVE = 'A_NEGATIVE',
  B_POSITIVE = 'B_POSITIVE',
  B_NEGATIVE = 'B_NEGATIVE',
  AB_POSITIVE = 'AB_POSITIVE',
  AB_NEGATIVE = 'AB_NEGATIVE',
  O_POSITIVE = 'O_POSITIVE',
  O_NEGATIVE = 'O_NEGATIVE',
  UNKNOWN = 'UNKNOWN',
}

export enum Race {
  AMERICAN_INDIAN_ALASKA_NATIVE = 'AMERICAN_INDIAN_ALASKA_NATIVE',
  ASIAN = 'ASIAN',
  BLACK_AFRICAN_AMERICAN = 'BLACK_AFRICAN_AMERICAN',
  NATIVE_HAWAIIAN_PACIFIC_ISLANDER = 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER',
  WHITE = 'WHITE',
  OTHER = 'OTHER',
  DECLINE_TO_ANSWER = 'DECLINE_TO_ANSWER',
}

export enum Ethnicity {
  HISPANIC_LATINO = 'HISPANIC_LATINO',
  NOT_HISPANIC_LATINO = 'NOT_HISPANIC_LATINO',
  DECLINE_TO_ANSWER = 'DECLINE_TO_ANSWER',
}

export enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED',
  DOMESTIC_PARTNER = 'DOMESTIC_PARTNER',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type AuditFields = {
  createdBy: string;
  updatedBy: string;
} & Timestamps;

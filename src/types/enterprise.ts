/**
 * Enterprise Multi-Organization Management Module Types
 * Agent 10: Multi-Organization Management
 */

import type { BaseEntity, Address, ContactInfo } from "./index";

// ============================================================================
// Organization Hierarchy Types
// ============================================================================

export interface Organization extends BaseEntity {
  name: string;
  type: OrganizationType;
  parentOrganizationId: string | null;
  npi: string;
  taxId: string;
  clia: string | null;
  address: Address;
  contactInfo: ContactInfo;
  settings: OrganizationSettings;
  status: OrganizationStatus;
  subscription: SubscriptionTier;
  licenseAllocations: LicenseAllocation[];
  activeUntil: Date;
  trialEndsAt: Date | null;
  billingContact: ContactInfo | null;
  technicalContact: ContactInfo | null;
  metadata: Record<string, any>;
}

export enum OrganizationType {
  HEALTH_SYSTEM = "HEALTH_SYSTEM",
  HOSPITAL = "HOSPITAL",
  MEDICAL_CENTER = "MEDICAL_CENTER",
  CLINIC = "CLINIC",
  PRACTICE = "PRACTICE",
  URGENT_CARE = "URGENT_CARE",
  LABORATORY = "LABORATORY",
  IMAGING_CENTER = "IMAGING_CENTER",
  PHARMACY = "PHARMACY",
  SKILLED_NURSING_FACILITY = "SKILLED_NURSING_FACILITY",
  HOME_HEALTH = "HOME_HEALTH",
  HOSPICE = "HOSPICE",
  OUTPATIENT_SURGERY_CENTER = "OUTPATIENT_SURGERY_CENTER",
}

export enum OrganizationStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  TRIAL = "TRIAL",
  INACTIVE = "INACTIVE",
  PENDING_SETUP = "PENDING_SETUP",
  ARCHIVED = "ARCHIVED",
}

export enum SubscriptionTier {
  TRIAL = "TRIAL",
  BASIC = "BASIC",
  PROFESSIONAL = "PROFESSIONAL",
  ENTERPRISE = "ENTERPRISE",
  ENTERPRISE_PLUS = "ENTERPRISE_PLUS",
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
  billing: BillingSettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
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
  apiAccess: boolean;
  customBranding: boolean;
  ssoEnabled: boolean;
  advancedReporting: boolean;
  aiAssistant: boolean;
  qualityMetrics: boolean;
  populationHealth: boolean;
}

export interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  customCss: string | null;
  emailHeader: string | null;
  emailFooter: string | null;
}

export interface ComplianceSettings {
  hipaaEnabled: boolean;
  auditLogging: boolean;
  phiEncryption: boolean;
  dataRetentionDays: number;
  requireMFA: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  breakGlassEnabled: boolean;
  consentManagement: boolean;
  gdprCompliant: boolean;
}

export interface BillingSettings {
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  paymentMethod: PaymentMethod;
  autoRenew: boolean;
  invoiceEmail: string;
  purchaseOrderRequired: boolean;
  taxExempt: boolean;
  taxExemptCertificate: string | null;
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  ACH = "ACH",
  WIRE_TRANSFER = "WIRE_TRANSFER",
  CHECK = "CHECK",
  INVOICE = "INVOICE",
}

export interface IntegrationSettings {
  hl7Enabled: boolean;
  fhirEnabled: boolean;
  directMessaging: boolean;
  externalEhr: string | null;
  externalLis: string | null;
  externalRis: string | null;
  externalPms: string | null;
  webhooksEnabled: boolean;
}

export interface SecuritySettings {
  ipWhitelist: string[];
  allowedDomains: string[];
  ssoProvider: SSOProvider | null;
  ssoConfig: Record<string, any> | null;
  dataResidency: DataResidency;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
}

export enum SSOProvider {
  OKTA = "OKTA",
  AZURE_AD = "AZURE_AD",
  GOOGLE_WORKSPACE = "GOOGLE_WORKSPACE",
  ONELOGIN = "ONELOGIN",
  SAML = "SAML",
  OAUTH2 = "OAUTH2",
}

export enum DataResidency {
  US = "US",
  EU = "EU",
  UK = "UK",
  CANADA = "CANADA",
  AUSTRALIA = "AUSTRALIA",
  ASIA_PACIFIC = "ASIA_PACIFIC",
}

export interface NotificationSettings {
  systemAlerts: boolean;
  securityAlerts: boolean;
  complianceAlerts: boolean;
  billingAlerts: boolean;
  usageAlerts: boolean;
  maintenanceNotifications: boolean;
  alertEmail: string;
  alertSms: string | null;
  escalationPolicy: EscalationPolicy | null;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  enabled: boolean;
}

export interface EscalationLevel {
  level: number;
  delayMinutes: number;
  contacts: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ============================================================================
// Facility Types
// ============================================================================

export interface Facility extends BaseEntity {
  organizationId: string;
  name: string;
  facilityCode: string;
  type: FacilityType;
  npi: string | null;
  address: Address;
  contactInfo: ContactInfo;
  coordinates: GeoCoordinates | null;
  departments: Department[];
  operatingHours: OperatingHours;
  services: ServiceLine[];
  capacity: FacilityCapacity | null;
  accreditations: Accreditation[];
  licenses: FacilityLicense[];
  status: FacilityStatus;
  primaryContact: string;
  emergencyContact: string | null;
  settings: FacilitySettings;
}

export enum FacilityType {
  MAIN_CAMPUS = "MAIN_CAMPUS",
  SATELLITE_CLINIC = "SATELLITE_CLINIC",
  EMERGENCY_DEPARTMENT = "EMERGENCY_DEPARTMENT",
  URGENT_CARE = "URGENT_CARE",
  OUTPATIENT_CENTER = "OUTPATIENT_CENTER",
  SURGICAL_CENTER = "SURGICAL_CENTER",
  LABORATORY = "LABORATORY",
  IMAGING_CENTER = "IMAGING_CENTER",
  PHARMACY = "PHARMACY",
  ADMINISTRATIVE = "ADMINISTRATIVE",
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  holidays: HolidayHours[];
}

export interface DayHours {
  open: boolean;
  openTime: string | null; // HH:MM format
  closeTime: string | null; // HH:MM format
  breaks: TimeRange[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface HolidayHours {
  date: Date;
  name: string;
  closed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface ServiceLine {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  active: boolean;
}

export enum ServiceCategory {
  PRIMARY_CARE = "PRIMARY_CARE",
  SPECIALTY_CARE = "SPECIALTY_CARE",
  EMERGENCY_SERVICES = "EMERGENCY_SERVICES",
  SURGICAL_SERVICES = "SURGICAL_SERVICES",
  DIAGNOSTIC_SERVICES = "DIAGNOSTIC_SERVICES",
  THERAPEUTIC_SERVICES = "THERAPEUTIC_SERVICES",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  BEHAVIORAL_HEALTH = "BEHAVIORAL_HEALTH",
  WOMEN_HEALTH = "WOMEN_HEALTH",
  PEDIATRICS = "PEDIATRICS",
  GERIATRICS = "GERIATRICS",
}

export interface FacilityCapacity {
  totalBeds: number;
  icuBeds: number;
  emergencyBeds: number;
  operatingRooms: number;
  examinationRooms: number;
  parkingSpaces: number;
}

export interface Accreditation {
  id: string;
  body: string;
  type: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  status: AccreditationStatus;
  documentUrl: string | null;
}

export enum AccreditationStatus {
  ACTIVE = "ACTIVE",
  PENDING_RENEWAL = "PENDING_RENEWAL",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
}

export interface FacilityLicense {
  id: string;
  type: LicenseType;
  number: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  status: LicenseStatus;
  documentUrl: string | null;
}

export enum LicenseType {
  MEDICAL_FACILITY = "MEDICAL_FACILITY",
  LABORATORY = "LABORATORY",
  PHARMACY = "PHARMACY",
  RADIOLOGY = "RADIOLOGY",
  AMBULATORY_SURGERY = "AMBULATORY_SURGERY",
  CONTROLLED_SUBSTANCES = "CONTROLLED_SUBSTANCES",
}

export enum LicenseStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
  SUSPENDED = "SUSPENDED",
}

export enum FacilityStatus {
  OPERATIONAL = "OPERATIONAL",
  UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION",
  TEMPORARILY_CLOSED = "TEMPORARILY_CLOSED",
  PERMANENTLY_CLOSED = "PERMANENTLY_CLOSED",
}

export interface FacilitySettings {
  defaultTimezone: string;
  appointmentDuration: number;
  walkinEnabled: boolean;
  telemedicineEnabled: boolean;
  parkingValidation: boolean;
  valetService: boolean;
  wheelchairAccessible: boolean;
  languageServices: string[];
}

// ============================================================================
// Department Types
// ============================================================================

export interface Department extends BaseEntity {
  facilityId: string;
  name: string;
  code: string;
  type: DepartmentType;
  parentDepartmentId: string | null;
  costCenter: string | null;
  glCode: string | null;
  manager: string | null;
  staffMembers: DepartmentStaff[];
  services: ServiceLine[];
  operatingHours: OperatingHours | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  budget: DepartmentBudget | null;
  status: DepartmentStatus;
}

export enum DepartmentType {
  CLINICAL = "CLINICAL",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  SUPPORT_SERVICES = "SUPPORT_SERVICES",
  ANCILLARY = "ANCILLARY",
  EMERGENCY = "EMERGENCY",
  INPATIENT = "INPATIENT",
  OUTPATIENT = "OUTPATIENT",
  SURGICAL = "SURGICAL",
  DIAGNOSTIC = "DIAGNOSTIC",
  THERAPEUTIC = "THERAPEUTIC",
}

export interface DepartmentStaff {
  userId: string;
  role: StaffRole;
  fte: number; // Full-Time Equivalent
  isPrimary: boolean;
  startDate: Date;
  endDate: Date | null;
}

export enum StaffRole {
  DEPARTMENT_HEAD = "DEPARTMENT_HEAD",
  MANAGER = "MANAGER",
  SUPERVISOR = "SUPERVISOR",
  PHYSICIAN = "PHYSICIAN",
  NURSE = "NURSE",
  TECHNICIAN = "TECHNICIAN",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  SUPPORT = "SUPPORT",
}

export interface DepartmentBudget {
  fiscalYear: number;
  totalBudget: number;
  personnelBudget: number;
  operatingBudget: number;
  capitalBudget: number;
  currentSpend: number;
  projectedSpend: number;
}

export enum DepartmentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  RESTRUCTURING = "RESTRUCTURING",
  MERGED = "MERGED",
}

// ============================================================================
// Data Sharing Agreement Types
// ============================================================================

export interface DataSharingAgreement extends BaseEntity {
  name: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  type: AgreementType;
  purpose: AgreementPurpose;
  status: AgreementStatus;
  dataTypes: DataType[];
  accessRules: AccessRule[];
  effectiveDate: Date;
  expiryDate: Date | null;
  autoRenew: boolean;
  renewalTermDays: number;
  signedBy: SignatureInfo[];
  documentUrl: string | null;
  restrictions: DataRestriction[];
  auditRequired: boolean;
  complianceFramework: ComplianceFramework[];
  notificationContacts: string[];
  terminationNoticeDays: number;
}

export enum AgreementType {
  BAA = "BAA", // Business Associate Agreement
  DATA_USE = "DATA_USE",
  RESEARCH_COLLABORATION = "RESEARCH_COLLABORATION",
  HIE = "HIE", // Health Information Exchange
  INTEROPERABILITY = "INTEROPERABILITY",
  REFERRAL_NETWORK = "REFERRAL_NETWORK",
  TELEHEALTH = "TELEHEALTH",
}

export enum AgreementPurpose {
  TREATMENT = "TREATMENT",
  CARE_COORDINATION = "CARE_COORDINATION",
  REFERRALS = "REFERRALS",
  RESEARCH = "RESEARCH",
  PUBLIC_HEALTH = "PUBLIC_HEALTH",
  QUALITY_IMPROVEMENT = "QUALITY_IMPROVEMENT",
  POPULATION_HEALTH = "POPULATION_HEALTH",
  OPERATIONS = "OPERATIONS",
  BILLING = "BILLING",
}

export enum AgreementStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
  UNDER_REVIEW = "UNDER_REVIEW",
}

export enum DataType {
  DEMOGRAPHICS = "DEMOGRAPHICS",
  CLINICAL_NOTES = "CLINICAL_NOTES",
  LAB_RESULTS = "LAB_RESULTS",
  IMAGING_REPORTS = "IMAGING_REPORTS",
  MEDICATIONS = "MEDICATIONS",
  ALLERGIES = "ALLERGIES",
  IMMUNIZATIONS = "IMMUNIZATIONS",
  VITALS = "VITALS",
  DIAGNOSES = "DIAGNOSES",
  PROCEDURES = "PROCEDURES",
  BILLING_DATA = "BILLING_DATA",
  INSURANCE = "INSURANCE",
  APPOINTMENTS = "APPOINTMENTS",
  REFERRALS = "REFERRALS",
  CARE_PLANS = "CARE_PLANS",
  CONSENT_FORMS = "CONSENT_FORMS",
}

export interface AccessRule {
  id: string;
  dataType: DataType;
  accessLevel: AccessLevel;
  conditions: AccessCondition[];
  allowedUsers: string[];
  allowedRoles: string[];
  allowedDepartments: string[];
  timeRestrictions: TimeRestriction | null;
  purposeRestriction: AgreementPurpose[];
}

export enum AccessLevel {
  READ_ONLY = "READ_ONLY",
  READ_WRITE = "READ_WRITE",
  CREATE_ONLY = "CREATE_ONLY",
  NO_ACCESS = "NO_ACCESS",
}

export interface AccessCondition {
  field: string;
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "IN"
    | "NOT_IN"
    | "GREATER_THAN"
    | "LESS_THAN";
  value: any;
}

export interface TimeRestriction {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday-Saturday
  timezone: string;
}

export interface SignatureInfo {
  userId: string;
  userName: string;
  role: string;
  organizationId: string;
  signedAt: Date;
  ipAddress: string;
  signature: string;
}

export interface DataRestriction {
  type: RestrictionType;
  description: string;
  enforcement: "MANDATORY" | "ADVISORY";
}

export enum RestrictionType {
  NO_REDISCLOSURE = "NO_REDISCLOSURE",
  MINIMUM_NECESSARY = "MINIMUM_NECESSARY",
  PURPOSE_LIMITATION = "PURPOSE_LIMITATION",
  RETENTION_LIMIT = "RETENTION_LIMIT",
  DELETION_REQUIRED = "DELETION_REQUIRED",
  CONSENT_REQUIRED = "CONSENT_REQUIRED",
  DE_IDENTIFICATION = "DE_IDENTIFICATION",
}

export enum ComplianceFramework {
  HIPAA = "HIPAA",
  HITECH = "HITECH",
  GDPR = "GDPR",
  CCPA = "CCPA",
  SOC2 = "SOC2",
  HITRUST = "HITRUST",
  ISO27001 = "ISO27001",
}

// ============================================================================
// License Management Types
// ============================================================================

export interface LicenseAllocation extends BaseEntity {
  organizationId: string;
  licenseType: LicenseType;
  totalLicenses: number;
  allocatedLicenses: number;
  availableLicenses: number;
  assignments: LicenseAssignment[];
  effectiveDate: Date;
  expiryDate: Date | null;
  autoRenew: boolean;
  costPerLicense: number;
  billingCycle: "MONTHLY" | "ANNUAL";
}

export interface LicenseAssignment {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  assignedAt: Date;
  assignedBy: string;
  lastUsed: Date | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface LicenseUsageMetrics {
  organizationId: string;
  period: DateRange;
  totalLicenses: number;
  activeUsers: number;
  inactiveUsers: number;
  utilizationRate: number;
  peakUsage: number;
  averageUsage: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  byFacility: Record<string, number>;
  trends: UsageTrend[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface UsageTrend {
  date: Date;
  activeUsers: number;
  utilizationRate: number;
}

// ============================================================================
// Cross-Organization Reporting Types
// ============================================================================

export interface CrossOrgReport extends BaseEntity {
  name: string;
  description: string;
  type: ReportType;
  organizations: string[];
  facilities: string[];
  departments: string[];
  parameters: ReportParameter[];
  schedule: ReportSchedule | null;
  format: ReportFormat;
  recipients: string[];
  lastRun: Date | null;
  nextRun: Date | null;
  status: ReportStatus;
  generatedBy: string;
}

export enum ReportType {
  FINANCIAL = "FINANCIAL",
  CLINICAL_QUALITY = "CLINICAL_QUALITY",
  OPERATIONAL = "OPERATIONAL",
  UTILIZATION = "UTILIZATION",
  COMPLIANCE = "COMPLIANCE",
  PATIENT_SATISFACTION = "PATIENT_SATISFACTION",
  STAFF_PRODUCTIVITY = "STAFF_PRODUCTIVITY",
  CUSTOM = "CUSTOM",
}

export interface ReportParameter {
  name: string;
  type: "STRING" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT";
  value: any;
  options?: any[];
}

export interface ReportSchedule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

export enum ReportFormat {
  PDF = "PDF",
  EXCEL = "EXCEL",
  CSV = "CSV",
  JSON = "JSON",
  HTML = "HTML",
}

export enum ReportStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// ============================================================================
// Organization Context Types
// ============================================================================

export interface OrganizationContext {
  organizationId: string;
  organization: Organization;
  facilityId: string | null;
  facility: Facility | null;
  departmentId: string | null;
  department: Department | null;
  permissions: string[];
  dataAccessScope: DataAccessScope;
}

export interface DataAccessScope {
  organizations: string[];
  facilities: string[];
  departments: string[];
  sharingAgreements: string[];
  restrictions: ScopeRestriction[];
}

export interface ScopeRestriction {
  resource: string;
  condition: string;
  reason: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateOrganizationDto {
  name: string;
  type: OrganizationType;
  parentOrganizationId?: string;
  npi: string;
  taxId: string;
  address: Address;
  contactInfo: ContactInfo;
  subscription: SubscriptionTier;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {
  id: string;
}

export interface CreateFacilityDto {
  organizationId: string;
  name: string;
  facilityCode: string;
  type: FacilityType;
  address: Address;
  contactInfo: ContactInfo;
  coordinates?: GeoCoordinates;
  operatingHours?: OperatingHours;
  services?: ServiceLine[];
}

export interface UpdateFacilityDto extends Partial<CreateFacilityDto> {
  id: string;
}

export interface CreateDepartmentDto {
  facilityId: string;
  name: string;
  code: string;
  type: DepartmentType;
  parentDepartmentId?: string;
  manager?: string;
  services?: ServiceLine[];
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  id: string;
}

export interface CreateDataSharingAgreementDto {
  name: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  type: AgreementType;
  purpose: AgreementPurpose;
  dataTypes: DataType[];
  accessRules: AccessRule[];
  effectiveDate: Date;
  expiryDate?: Date;
  restrictions?: DataRestriction[];
  complianceFramework: ComplianceFramework[];
}

export interface UpdateDataSharingAgreementDto extends Partial<CreateDataSharingAgreementDto> {
  id: string;
}

export interface SwitchOrganizationDto {
  organizationId: string;
  facilityId?: string;
  departmentId?: string;
}

export interface AllocateLicenseDto {
  userId: string;
  licenseType: LicenseType;
  organizationId: string;
}

export interface RevokeLicenseDto {
  userId: string;
  licenseType: LicenseType;
  reason?: string;
}

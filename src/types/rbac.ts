/**
 * Advanced RBAC & Permission System Types
 * Lithic v0.2 - Agent 3
 */

import type { BaseEntity } from "./index";

// ============================================================================
// Role Hierarchy Types
// ============================================================================

export interface RoleHierarchy extends BaseEntity {
  roleId: string;
  parentRoleId: string | null;
  level: number;
  path: string[];
  inheritPermissions: boolean;
}

export interface RoleNode {
  id: string;
  name: string;
  description: string;
  level: number;
  children: RoleNode[];
  permissions: RolePermission[];
  inheritedPermissions: RolePermission[];
}

export interface RoleConflict {
  roleId: string;
  conflictingRoleId: string;
  conflictType: "PERMISSION_OVERLAP" | "HIERARCHY_CIRCULAR" | "SCOPE_MISMATCH";
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ============================================================================
// Permission Types
// ============================================================================

export interface RolePermission {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
  conditions: PermissionConditions | null;
  inherited: boolean;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
}

export enum PermissionResource {
  // Patient Management
  PATIENT = "patient",
  PATIENT_DEMOGRAPHICS = "patient.demographics",
  PATIENT_INSURANCE = "patient.insurance",
  PATIENT_DOCUMENTS = "patient.documents",
  PATIENT_MERGE = "patient.merge",

  // Clinical
  CLINICAL_NOTES = "clinical.notes",
  CLINICAL_ORDERS = "clinical.orders",
  CLINICAL_VITALS = "clinical.vitals",
  CLINICAL_ALLERGIES = "clinical.allergies",
  CLINICAL_MEDICATIONS = "clinical.medications",
  CLINICAL_PROBLEMS = "clinical.problems",
  CLINICAL_ENCOUNTERS = "clinical.encounters",

  // Scheduling
  APPOINTMENTS = "appointments",
  APPOINTMENT_CALENDAR = "appointments.calendar",
  APPOINTMENT_PROVIDERS = "appointments.providers",
  APPOINTMENT_RESOURCES = "appointments.resources",

  // Billing
  BILLING_CLAIMS = "billing.claims",
  BILLING_PAYMENTS = "billing.payments",
  BILLING_INVOICES = "billing.invoices",
  BILLING_CODING = "billing.coding",

  // Laboratory
  LAB_ORDERS = "lab.orders",
  LAB_RESULTS = "lab.results",
  LAB_SPECIMENS = "lab.specimens",
  LAB_PANELS = "lab.panels",

  // Imaging
  IMAGING_ORDERS = "imaging.orders",
  IMAGING_STUDIES = "imaging.studies",
  IMAGING_REPORTS = "imaging.reports",
  IMAGING_VIEWER = "imaging.viewer",

  // Pharmacy
  PHARMACY_PRESCRIPTIONS = "pharmacy.prescriptions",
  PHARMACY_DISPENSING = "pharmacy.dispensing",
  PHARMACY_INVENTORY = "pharmacy.inventory",
  PHARMACY_CONTROLLED = "pharmacy.controlled",

  // Analytics
  ANALYTICS_DASHBOARDS = "analytics.dashboards",
  ANALYTICS_REPORTS = "analytics.reports",
  ANALYTICS_EXPORTS = "analytics.exports",

  // Administration
  ADMIN_USERS = "admin.users",
  ADMIN_ROLES = "admin.roles",
  ADMIN_PERMISSIONS = "admin.permissions",
  ADMIN_ORGANIZATIONS = "admin.organizations",
  ADMIN_SETTINGS = "admin.settings",
  ADMIN_AUDIT = "admin.audit",
  ADMIN_SECURITY = "admin.security",

  // System
  SYSTEM_ALL = "system.*",
}

export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  EXECUTE = "execute",
  APPROVE = "approve",
  SIGN = "sign",
  PRESCRIBE = "prescribe",
  ORDER = "order",
  EXPORT = "export",
  PRINT = "print",
  SHARE = "share",
  ADMIN = "admin",
  ALL = "*",
}

export enum PermissionScope {
  ALL = "ALL",
  ORGANIZATION = "ORGANIZATION",
  DEPARTMENT = "DEPARTMENT",
  LOCATION = "LOCATION",
  TEAM = "TEAM",
  OWN = "OWN",
  ASSIGNED = "ASSIGNED",
}

export interface PermissionConditions {
  departments?: string[];
  locations?: string[];
  timeRestrictions?: TimeRestriction[];
  ipRestrictions?: IPRestriction[];
  customRules?: CustomRule[];
}

// ============================================================================
// Department Access Control Types
// ============================================================================

export interface Department extends BaseEntity {
  name: string;
  code: string;
  description: string;
  parentDepartmentId: string | null;
  locationId: string;
  managerId: string | null;
  metadata: Record<string, any>;
  status: DepartmentStatus;
}

export enum DepartmentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export interface DepartmentAccess {
  userId: string;
  departmentId: string;
  accessLevel: DepartmentAccessLevel;
  canCrossDepartment: boolean;
  allowedDepartments: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;
}

export enum DepartmentAccessLevel {
  FULL = "FULL",
  READ_ONLY = "READ_ONLY",
  LIMITED = "LIMITED",
  NONE = "NONE",
}

export interface CrossDepartmentRule {
  id: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  allowedResources: PermissionResource[];
  requiresApproval: boolean;
  autoExpireMinutes: number | null;
  reason: string;
}

// ============================================================================
// Location-Based Access Types
// ============================================================================

export interface Location extends BaseEntity {
  name: string;
  code: string;
  type: LocationType;
  address: LocationAddress;
  parentLocationId: string | null;
  timezone: string;
  coordinates: GeoCoordinates | null;
  ipRanges: string[];
  metadata: Record<string, any>;
  status: LocationStatus;
}

export enum LocationType {
  HOSPITAL = "HOSPITAL",
  CLINIC = "CLINIC",
  OFFICE = "OFFICE",
  LAB = "LAB",
  IMAGING_CENTER = "IMAGING_CENTER",
  PHARMACY = "PHARMACY",
  REMOTE = "REMOTE",
}

export enum LocationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
}

export interface LocationAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAccess {
  userId: string;
  locationId: string;
  accessLevel: LocationAccessLevel;
  allowedResources: PermissionResource[];
  requiresVPN: boolean;
  allowedIPRanges: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;
}

export enum LocationAccessLevel {
  FULL = "FULL",
  RESTRICTED = "RESTRICTED",
  EMERGENCY_ONLY = "EMERGENCY_ONLY",
  NONE = "NONE",
}

export interface IPRestriction {
  allowedRanges: string[];
  blockedRanges: string[];
  requireVPN: boolean;
  geoFencing?: GeoFence;
}

export interface GeoFence {
  enabled: boolean;
  allowedCountries: string[];
  allowedRegions: string[];
  radiusMeters?: number;
  centerPoint?: GeoCoordinates;
}

// ============================================================================
// Time-Based Access Types
// ============================================================================

export interface TimeRestriction {
  id: string;
  name: string;
  schedules: AccessSchedule[];
  timezone: string;
  holidays: Holiday[];
  allowBreakGlass: boolean;
  notifyOnViolation: boolean;
}

export interface AccessSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export interface Holiday {
  name: string;
  date: Date;
  allowAccess: boolean;
  emergencyOnly: boolean;
}

export interface AfterHoursAccess extends BaseEntity {
  userId: string;
  resource: PermissionResource;
  reason: string;
  requestedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  expiresAt: Date;
  status: AfterHoursAccessStatus;
}

export enum AfterHoursAccessStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

// ============================================================================
// Policy-Based Access Types
// ============================================================================

export interface AccessPolicy extends BaseEntity {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  rules: PolicyRule[];
  effect: PolicyEffect;
  conditions: PolicyConditions;
  version: number;
  previousVersionId: string | null;
}

export enum PolicyEffect {
  ALLOW = "ALLOW",
  DENY = "DENY",
  REQUIRE_MFA = "REQUIRE_MFA",
  REQUIRE_APPROVAL = "REQUIRE_APPROVAL",
  AUDIT_ONLY = "AUDIT_ONLY",
}

export interface PolicyRule {
  id: string;
  resource: PermissionResource | string;
  actions: PermissionAction[];
  effect: PolicyEffect;
  conditions: PolicyRuleConditions;
  priority: number;
}

export interface PolicyConditions {
  userAttributes?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
  environmentAttributes?: EnvironmentAttributes;
  customExpression?: string;
}

export interface PolicyRuleConditions {
  userRoles?: string[];
  userDepartments?: string[];
  userLocations?: string[];
  timeWindow?: TimeWindow;
  ipRange?: string[];
  mfaRequired?: boolean;
  approvalRequired?: boolean;
  customChecks?: CustomRule[];
}

export interface EnvironmentAttributes {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  timestamp?: Date;
  riskScore?: number;
}

export interface TimeWindow {
  startTime: string;
  endTime: string;
  daysOfWeek: DayOfWeek[];
  timezone: string;
}

export interface CustomRule {
  id: string;
  name: string;
  expression: string;
  parameters: Record<string, any>;
}

// ============================================================================
// Break-the-Glass Types
// ============================================================================

export interface BreakGlassRequest extends BaseEntity {
  userId: string;
  patientId: string;
  resource: PermissionResource;
  action: PermissionAction;
  reason: BreakGlassReason;
  justification: string;
  emergencyType: EmergencyType;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  deniedAt: Date | null;
  deniedBy: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedBy: string | null;
  status: BreakGlassStatus;
  accessLog: BreakGlassAccessLog[];
  notificationsSent: NotificationLog[];
}

export enum BreakGlassReason {
  EMERGENCY_TREATMENT = "EMERGENCY_TREATMENT",
  CRITICAL_CARE = "CRITICAL_CARE",
  TIME_SENSITIVE = "TIME_SENSITIVE",
  SYSTEM_FAILURE = "SYSTEM_FAILURE",
  TECHNICAL_ISSUE = "TECHNICAL_ISSUE",
  OTHER = "OTHER",
}

export enum EmergencyType {
  LIFE_THREATENING = "LIFE_THREATENING",
  URGENT = "URGENT",
  TIME_SENSITIVE = "TIME_SENSITIVE",
  SYSTEM_RECOVERY = "SYSTEM_RECOVERY",
}

export enum BreakGlassStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
  UNDER_REVIEW = "UNDER_REVIEW",
}

export interface BreakGlassAccessLog {
  timestamp: Date;
  resource: string;
  action: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  phiAccessed: string[];
}

export interface NotificationLog {
  timestamp: Date;
  recipient: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  message: string;
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH",
  SLACK = "SLACK",
  PAGER = "PAGER",
}

export enum NotificationStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  BOUNCED = "BOUNCED",
}

export interface BreakGlassAudit extends BaseEntity {
  breakGlassRequestId: string;
  reviewedBy: string;
  reviewedAt: Date;
  reviewStatus: BreakGlassReviewStatus;
  findings: string;
  violations: BreakGlassViolation[];
  actionTaken: string | null;
  followUpRequired: boolean;
}

export enum BreakGlassReviewStatus {
  APPROVED = "APPROVED",
  FLAGGED = "FLAGGED",
  VIOLATION = "VIOLATION",
  JUSTIFIED = "JUSTIFIED",
  REQUIRES_INVESTIGATION = "REQUIRES_INVESTIGATION",
}

export interface BreakGlassViolation {
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  evidence: Record<string, any>;
}

export enum ViolationType {
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  EXCESSIVE_ACCESS = "EXCESSIVE_ACCESS",
  INAPPROPRIATE_JUSTIFICATION = "INAPPROPRIATE_JUSTIFICATION",
  POLICY_VIOLATION = "POLICY_VIOLATION",
  TIME_VIOLATION = "TIME_VIOLATION",
}

export enum ViolationSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// Permission Evaluation Types
// ============================================================================

export interface PermissionContext {
  userId: string;
  organizationId: string;
  resource: PermissionResource | string;
  action: PermissionAction | string;
  resourceId?: string;
  departmentId?: string;
  locationId?: string;
  ipAddress?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface PermissionEvaluationResult {
  allowed: boolean;
  reason: string;
  matchedPolicies: string[];
  deniedBy?: string;
  requiresMFA?: boolean;
  requiresApproval?: boolean;
  requiresBreakGlass?: boolean;
  conditions?: EvaluatedCondition[];
  cacheKey?: string;
  evaluationTime?: number;
}

export interface EvaluatedCondition {
  type: string;
  satisfied: boolean;
  details: string;
}

export interface PermissionCache {
  key: string;
  result: PermissionEvaluationResult;
  expiresAt: Date;
  hits: number;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateRoleDto {
  name: string;
  description: string;
  parentRoleId?: string;
  permissions: CreatePermissionDto[];
  inheritPermissions?: boolean;
}

export interface CreatePermissionDto {
  resource: PermissionResource | string;
  action: PermissionAction | string;
  scope: PermissionScope;
  conditions?: PermissionConditions;
}

export interface CreatePolicyDto {
  name: string;
  description: string;
  priority: number;
  rules: PolicyRule[];
  effect: PolicyEffect;
  conditions: PolicyConditions;
}

export interface InitiateBreakGlassDto {
  patientId: string;
  resource: PermissionResource;
  action: PermissionAction;
  reason: BreakGlassReason;
  justification: string;
  emergencyType: EmergencyType;
  duration?: number;
}

export interface GrantDepartmentAccessDto {
  userId: string;
  departmentId: string;
  accessLevel: DepartmentAccessLevel;
  canCrossDepartment?: boolean;
  allowedDepartments?: string[];
  expiresAt?: Date;
}

export interface GrantLocationAccessDto {
  userId: string;
  locationId: string;
  accessLevel: LocationAccessLevel;
  allowedResources?: PermissionResource[];
  requiresVPN?: boolean;
  allowedIPRanges?: string[];
  expiresAt?: Date;
}

export interface CreateTimeRestrictionDto {
  name: string;
  schedules: AccessSchedule[];
  timezone: string;
  holidays?: Holiday[];
  allowBreakGlass?: boolean;
}

// ============================================================================
// Query Types
// ============================================================================

export interface PermissionQuery {
  userId?: string;
  roleId?: string;
  resource?: PermissionResource | string;
  action?: PermissionAction | string;
  scope?: PermissionScope;
  includeInherited?: boolean;
}

export interface BreakGlassQuery {
  userId?: string;
  patientId?: string;
  status?: BreakGlassStatus;
  startDate?: Date;
  endDate?: Date;
  reviewStatus?: BreakGlassReviewStatus;
  page?: number;
  limit?: number;
}

export interface AccessPolicyQuery {
  enabled?: boolean;
  resource?: PermissionResource | string;
  effect?: PolicyEffect;
  priority?: number;
  orderBy?: "priority" | "name" | "createdAt";
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface RBACStatistics {
  totalRoles: number;
  totalPermissions: number;
  totalPolicies: number;
  activeBreakGlassRequests: number;
  breakGlassRequestsLast24h: number;
  policyViolationsLast24h: number;
  averagePermissionEvaluationTime: number;
  cacheHitRate: number;
}

export interface UserAccessSummary {
  userId: string;
  roles: string[];
  departments: string[];
  locations: string[];
  permissionCount: number;
  activeBreakGlassCount: number;
  lastAccessReview?: Date;
  riskScore: number;
}

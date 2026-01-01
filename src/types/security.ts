/**
 * Security Types for Lithic Enterprise Healthcare Platform
 * Comprehensive type definitions for security, compliance, and audit
 */

// ============================================================================
// Access Control Types
// ============================================================================

export enum AccessControlMode {
  RBAC = "RBAC",
  ABAC = "ABAC",
  HYBRID = "HYBRID",
}

export enum PermissionEffect {
  ALLOW = "ALLOW",
  DENY = "DENY",
  REQUIRE_MFA = "REQUIRE_MFA",
  REQUIRE_APPROVAL = "REQUIRE_APPROVAL",
}

export interface AccessControlPolicy {
  id: string;
  name: string;
  description: string;
  mode: AccessControlMode;
  effect: PermissionEffect;
  priority: number;
  conditions: PolicyCondition[];
  rules: AccessRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessRule {
  id: string;
  resource: string;
  actions: string[];
  attributes?: Record<string, any>;
  constraints?: RuleConstraint[];
}

export interface PolicyCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: any;
  attributes?: Record<string, any>;
}

export enum ConditionType {
  TIME_BASED = "TIME_BASED",
  LOCATION_BASED = "LOCATION_BASED",
  DEPARTMENT_BASED = "DEPARTMENT_BASED",
  IP_BASED = "IP_BASED",
  DEVICE_BASED = "DEVICE_BASED",
  RISK_SCORE = "RISK_SCORE",
  MFA_VERIFIED = "MFA_VERIFIED",
  RELATIONSHIP = "RELATIONSHIP",
}

export enum ConditionOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  IN = "IN",
  NOT_IN = "NOT_IN",
  CONTAINS = "CONTAINS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  BETWEEN = "BETWEEN",
  MATCHES_PATTERN = "MATCHES_PATTERN",
}

export interface RuleConstraint {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface BreakGlassAccess {
  id: string;
  userId: string;
  resource: string;
  resourceId?: string;
  action: string;
  reason: string;
  justification: string;
  approvedBy?: string;
  approvedAt?: Date;
  expiresAt: Date;
  status: BreakGlassStatus;
  auditTrail: BreakGlassAuditEntry[];
  createdAt: Date;
}

export enum BreakGlassStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export interface BreakGlassAuditEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  details: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  sessionId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  resourceType?: string;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: DeviceInfo;
  location?: GeoLocation;
  timestamp: Date;
  phiAccessed: boolean;
  phiFields?: string[];
  success: boolean;
  errorMessage?: string;
  riskScore?: number;
  metadata?: Record<string, any>;
  tamperProof: TamperProofData;
}

export enum AuditAction {
  // Authentication
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  PASSWORD_RESET = "PASSWORD_RESET",
  MFA_ENABLED = "MFA_ENABLED",
  MFA_DISABLED = "MFA_DISABLED",
  MFA_VERIFIED = "MFA_VERIFIED",
  MFA_FAILED = "MFA_FAILED",

  // Data Access
  PHI_READ = "PHI_READ",
  PHI_CREATE = "PHI_CREATE",
  PHI_UPDATE = "PHI_UPDATE",
  PHI_DELETE = "PHI_DELETE",
  PHI_EXPORT = "PHI_EXPORT",
  PHI_PRINT = "PHI_PRINT",

  // Permission Management
  ACCESS_GRANTED = "ACCESS_GRANTED",
  ACCESS_DENIED = "ACCESS_DENIED",
  PERMISSION_CHANGED = "PERMISSION_CHANGED",
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  ROLE_REMOVED = "ROLE_REMOVED",

  // Emergency Access
  EMERGENCY_ACCESS = "EMERGENCY_ACCESS",
  BREAK_GLASS_ACTIVATED = "BREAK_GLASS_ACTIVATED",
  BREAK_GLASS_APPROVED = "BREAK_GLASS_APPROVED",
  BREAK_GLASS_REVOKED = "BREAK_GLASS_REVOKED",

  // Configuration
  CONFIG_CHANGED = "CONFIG_CHANGED",
  SECURITY_SETTING_CHANGED = "SECURITY_SETTING_CHANGED",
  ENCRYPTION_KEY_ROTATED = "ENCRYPTION_KEY_ROTATED",

  // Compliance
  COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION",
  POLICY_VIOLATION = "POLICY_VIOLATION",
  ANOMALY_DETECTED = "ANOMALY_DETECTED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
}

export interface AuditDetails {
  description: string;
  changes?: ChangeRecord[];
  context?: Record<string, any>;
  dataClassification?: DataClassification;
}

export interface ChangeRecord {
  field: string;
  oldValue?: any;
  newValue?: any;
  encrypted?: boolean;
}

export enum DataClassification {
  PUBLIC = "PUBLIC",
  INTERNAL = "INTERNAL",
  CONFIDENTIAL = "CONFIDENTIAL",
  PHI = "PHI",
  PII = "PII",
  FINANCIAL = "FINANCIAL",
}

export interface TamperProofData {
  hash: string;
  previousHash: string;
  chainVerified: boolean;
  signature: string;
  timestamp: number;
}

export interface DeviceInfo {
  deviceId?: string;
  deviceType: string;
  os: string;
  browser: string;
  trusted: boolean;
  fingerprint: string;
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: { lat: number; lon: number };
  timezone?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface MFAConfig {
  enabled: boolean;
  required: boolean;
  methods: MFAMethod[];
  gracePeriod?: number; // days
  backupCodes?: number;
}

export enum MFAMethod {
  TOTP = "TOTP",
  SMS = "SMS",
  EMAIL = "EMAIL",
  AUTHENTICATOR = "AUTHENTICATOR",
  BIOMETRIC = "BIOMETRIC",
  HARDWARE_TOKEN = "HARDWARE_TOKEN",
  PUSH = "PUSH",
}

export interface MFASetup {
  userId: string;
  method: MFAMethod;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  verified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface BiometricData {
  type: BiometricType;
  template: string; // Encrypted template
  quality: number;
  enrolledAt: Date;
  lastUsedAt?: Date;
  deviceId: string;
  verified: boolean;
}

export enum BiometricType {
  FINGERPRINT = "FINGERPRINT",
  FACE = "FACE",
  IRIS = "IRIS",
  VOICE = "VOICE",
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number; // Number of previous passwords to check
  maxAge: number; // Days before password expires
  minAge: number; // Days before password can be changed
  complexity: PasswordComplexity;
  prohibitedPasswords: string[]; // Common passwords, dictionary words
}

export enum PasswordComplexity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export interface AccountLockoutPolicy {
  enabled: boolean;
  maxAttempts: number;
  windowMinutes: number;
  lockoutDurationMinutes: number;
  automaticUnlock: boolean;
  notifyUser: boolean;
  notifyAdmin: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  ipAddress: string;
  userAgent: string;
  device: DeviceInfo;
  location?: GeoLocation;
  mfaVerified: boolean;
  riskScore: number;
  lastActivityAt: Date;
  status: SessionStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum SessionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
  SUSPICIOUS = "SUSPICIOUS",
}

// ============================================================================
// SSO Types
// ============================================================================

export interface SAMLConfig {
  enabled: boolean;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  signatureAlgorithm: string;
  digestAlgorithm: string;
  attributeMapping: SAMLAttributeMapping;
  allowUnsolicitedResponse: boolean;
  wantAssertionsSigned: boolean;
  wantResponsesSigned: boolean;
}

export interface SAMLAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  groups?: string;
  roles?: string;
  department?: string;
  [key: string]: string | undefined;
}

export interface OIDCConfig {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  responseType: string;
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  jwksUri: string;
  attributeMapping: OIDCAttributeMapping;
}

export interface OIDCAttributeMapping {
  email: string;
  given_name: string;
  family_name: string;
  groups?: string;
  roles?: string;
  [key: string]: string | undefined;
}

export interface LDAPConfig {
  enabled: boolean;
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  searchFilter: string;
  attributeMapping: LDAPAttributeMapping;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  useTLS: boolean;
  tlsCertificate?: string;
}

export interface LDAPAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  title?: string;
  [key: string]: string | undefined;
}

export interface IdentityFederation {
  id: string;
  name: string;
  type: IdentityProviderType;
  enabled: boolean;
  config: SAMLConfig | OIDCConfig | LDAPConfig;
  trustLevel: TrustLevel;
  userProvisioning: ProvisioningConfig;
  attributeSynchronization: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum IdentityProviderType {
  SAML = "SAML",
  OIDC = "OIDC",
  LDAP = "LDAP",
  OAUTH2 = "OAUTH2",
}

export enum TrustLevel {
  FULL = "FULL",
  CONDITIONAL = "CONDITIONAL",
  RESTRICTED = "RESTRICTED",
}

export interface ProvisioningConfig {
  autoCreate: boolean;
  autoUpdate: boolean;
  autoDeactivate: boolean;
  defaultRole: string;
  attributeMapping: Record<string, string>;
}

// ============================================================================
// Compliance Types
// ============================================================================

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  category: string;
  title: string;
  description: string;
  requirement: string;
  implementation: string;
  status: ControlStatus;
  evidence: ControlEvidence[];
  owner: string;
  testDate?: Date;
  nextTestDate?: Date;
  findings?: string[];
  remediation?: string;
  priority: ControlPriority;
  automated: boolean;
  metadata?: Record<string, any>;
}

export enum ComplianceFramework {
  HIPAA = "HIPAA",
  SOC2 = "SOC2",
  HITRUST = "HITRUST",
  GDPR = "GDPR",
  PCI_DSS = "PCI_DSS",
  NIST = "NIST",
  ISO27001 = "ISO27001",
}

export enum ControlStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT",
  NOT_TESTED = "NOT_TESTED",
  NOT_APPLICABLE = "NOT_APPLICABLE",
  IN_REMEDIATION = "IN_REMEDIATION",
}

export enum ControlPriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface ControlEvidence {
  id: string;
  type: EvidenceType;
  description: string;
  url?: string;
  collectedAt: Date;
  collectedBy: string;
  verified: boolean;
}

export enum EvidenceType {
  DOCUMENT = "DOCUMENT",
  SCREENSHOT = "SCREENSHOT",
  LOG = "LOG",
  CERTIFICATE = "CERTIFICATE",
  AUDIT_REPORT = "AUDIT_REPORT",
  AUTOMATED_TEST = "AUTOMATED_TEST",
}

export interface RiskAssessment {
  id: string;
  organizationId: string;
  type: RiskType;
  category: RiskCategory;
  description: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  riskScore: number;
  inherentRisk: number;
  residualRisk: number;
  status: RiskStatus;
  owner: string;
  mitigation: RiskMitigation[];
  controls: string[]; // Control IDs
  lastReviewDate: Date;
  nextReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum RiskType {
  SECURITY = "SECURITY",
  PRIVACY = "PRIVACY",
  COMPLIANCE = "COMPLIANCE",
  OPERATIONAL = "OPERATIONAL",
  FINANCIAL = "FINANCIAL",
  REPUTATIONAL = "REPUTATIONAL",
}

export enum RiskCategory {
  DATA_BREACH = "DATA_BREACH",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  MALWARE = "MALWARE",
  DENIAL_OF_SERVICE = "DENIAL_OF_SERVICE",
  INSIDER_THREAT = "INSIDER_THREAT",
  THIRD_PARTY = "THIRD_PARTY",
  PHYSICAL_SECURITY = "PHYSICAL_SECURITY",
  BUSINESS_CONTINUITY = "BUSINESS_CONTINUITY",
}

export enum RiskLikelihood {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

export enum RiskImpact {
  NEGLIGIBLE = 1,
  MINOR = 2,
  MODERATE = 3,
  MAJOR = 4,
  CATASTROPHIC = 5,
}

export enum RiskStatus {
  IDENTIFIED = "IDENTIFIED",
  ASSESSING = "ASSESSING",
  MITIGATING = "MITIGATING",
  MONITORING = "MONITORING",
  ACCEPTED = "ACCEPTED",
  TRANSFERRED = "TRANSFERRED",
  CLOSED = "CLOSED",
}

export interface RiskMitigation {
  id: string;
  description: string;
  implementation: string;
  owner: string;
  dueDate: Date;
  status: MitigationStatus;
  effectiveness: number; // 0-100
}

export enum MitigationStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DEFERRED = "DEFERRED",
}

export interface ComplianceReport {
  id: string;
  organizationId: string;
  framework: ComplianceFramework;
  reportType: ReportType;
  periodStart: Date;
  periodEnd: Date;
  overallScore: number;
  controlsTested: number;
  controlsPassed: number;
  controlsFailed: number;
  findings: ReportFinding[];
  recommendations: string[];
  generatedBy: string;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reportUrl?: string;
}

export enum ReportType {
  SELF_ASSESSMENT = "SELF_ASSESSMENT",
  INTERNAL_AUDIT = "INTERNAL_AUDIT",
  EXTERNAL_AUDIT = "EXTERNAL_AUDIT",
  CONTINUOUS_MONITORING = "CONTINUOUS_MONITORING",
  EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY",
}

export interface ReportFinding {
  id: string;
  controlId: string;
  severity: FindingSeverity;
  description: string;
  impact: string;
  recommendation: string;
  status: FindingStatus;
  dueDate?: Date;
  assignedTo?: string;
}

export enum FindingSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export enum FindingStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  ACCEPTED = "ACCEPTED",
  DEFERRED = "DEFERRED",
}

// ============================================================================
// Security Monitoring Types
// ============================================================================

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  source: string;
  target: string;
  description: string;
  indicators: ThreatIndicator[];
  status: ThreatStatus;
  detectedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  mitigationSteps?: string[];
  relatedEvents: string[]; // Audit log IDs
}

export enum ThreatType {
  BRUTE_FORCE = "BRUTE_FORCE",
  CREDENTIAL_STUFFING = "CREDENTIAL_STUFFING",
  SQL_INJECTION = "SQL_INJECTION",
  XSS = "XSS",
  CSRF = "CSRF",
  MALWARE = "MALWARE",
  PHISHING = "PHISHING",
  DDOS = "DDOS",
  DATA_EXFILTRATION = "DATA_EXFILTRATION",
  PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION",
  ANOMALOUS_BEHAVIOR = "ANOMALOUS_BEHAVIOR",
}

export enum ThreatSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INFO = "INFO",
}

export enum ThreatStatus {
  DETECTED = "DETECTED",
  INVESTIGATING = "INVESTIGATING",
  CONFIRMED = "CONFIRMED",
  FALSE_POSITIVE = "FALSE_POSITIVE",
  MITIGATED = "MITIGATED",
  RESOLVED = "RESOLVED",
}

export interface ThreatIndicator {
  type: IndicatorType;
  value: string;
  confidence: number; // 0-100
}

export enum IndicatorType {
  IP_ADDRESS = "IP_ADDRESS",
  USER_AGENT = "USER_AGENT",
  BEHAVIOR_PATTERN = "BEHAVIOR_PATTERN",
  TIME_PATTERN = "TIME_PATTERN",
  VOLUME_ANOMALY = "VOLUME_ANOMALY",
}

export interface SecurityMetrics {
  organizationId: string;
  period: { start: Date; end: Date };
  totalLogins: number;
  failedLogins: number;
  mfaAdoption: number; // Percentage
  activeUsers: number;
  activeSessions: number;
  phiAccessCount: number;
  threatCount: number;
  highSeverityThreats: number;
  averageRiskScore: number;
  complianceScore: number;
  policyViolations: number;
  incidentCount: number;
}

// ============================================================================
// Encryption Types
// ============================================================================

export interface EncryptionKey {
  id: string;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  purpose: KeyPurpose;
  status: KeyStatus;
  createdAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  rotationSchedule?: RotationSchedule;
  lastRotated?: Date;
  nextRotation?: Date;
  version: number;
}

export enum EncryptionAlgorithm {
  AES_256_GCM = "AES_256_GCM",
  AES_256_CBC = "AES_256_CBC",
  RSA_4096 = "RSA_4096",
  CHACHA20_POLY1305 = "CHACHA20_POLY1305",
}

export enum KeyPurpose {
  DATA_ENCRYPTION = "DATA_ENCRYPTION",
  KEY_ENCRYPTION = "KEY_ENCRYPTION",
  TOKEN_SIGNING = "TOKEN_SIGNING",
  CERTIFICATE = "CERTIFICATE",
}

export enum KeyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  COMPROMISED = "COMPROMISED",
  DESTROYED = "DESTROYED",
}

export interface RotationSchedule {
  frequency: number; // Days
  automaticRotation: boolean;
  notifyBeforeDays: number;
  gracePeriodDays: number;
}

// ============================================================================
// Security Dashboard Types
// ============================================================================

export interface SecurityPosture {
  score: number; // 0-100
  grade: SecurityGrade;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  components: {
    authentication: number;
    authorization: number;
    dataProtection: number;
    networkSecurity: number;
    incidentResponse: number;
    compliance: number;
  };
  recommendations: SecurityRecommendation[];
  lastUpdated: Date;
}

export enum SecurityGrade {
  A_PLUS = "A+",
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  F = "F",
}

export interface SecurityRecommendation {
  id: string;
  priority: ControlPriority;
  category: string;
  title: string;
  description: string;
  impact: number; // Expected score improvement
  effort: EffortLevel;
  resources?: string[];
}

export enum EffortLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface AnomalyDetection {
  id: string;
  type: AnomalyType;
  severity: ThreatSeverity;
  userId: string;
  description: string;
  baseline: any;
  observed: any;
  deviation: number;
  confidence: number; // 0-100
  detectedAt: Date;
  status: AnomalyStatus;
}

export enum AnomalyType {
  LOGIN_TIME = "LOGIN_TIME",
  LOGIN_LOCATION = "LOGIN_LOCATION",
  ACCESS_PATTERN = "ACCESS_PATTERN",
  DATA_VOLUME = "DATA_VOLUME",
  FAILED_ATTEMPTS = "FAILED_ATTEMPTS",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
}

export enum AnomalyStatus {
  NEW = "NEW",
  REVIEWING = "REVIEWING",
  CONFIRMED = "CONFIRMED",
  DISMISSED = "DISMISSED",
  RESOLVED = "RESOLVED",
}

/**
 * Patient Portal Types
 * Agent 1: Patient Portal & Experience Expert
 * Enterprise-grade patient-facing features rivaling Epic's MyChart
 */

import type { BaseEntity, Name, Address } from "./index";

// ============================================================================
// Patient Portal Session & Authentication
// ============================================================================

export interface PatientPortalSession extends BaseEntity {
  patientId: string;
  email: string;
  lastLogin: Date | null;
  mfaEnabled: boolean;
  preferences: PatientPreferences;
  dependents: PatientDependent[];
  proxyAccess: ProxyAccess[];
}

export interface PatientPreferences {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  appointmentReminders: boolean;
  labResultNotifications: boolean;
  billingNotifications: boolean;
  messageNotifications: boolean;
  medicationReminders: boolean;
  theme: "light" | "dark" | "system";
  privacyMode: boolean;
}

export interface PatientDependent {
  id: string;
  patientId: string;
  relationship: string;
  name: Name;
  dateOfBirth: Date;
  accessLevel: DependentAccessLevel;
  expiresAt: Date | null;
}

export enum DependentAccessLevel {
  FULL = "FULL",
  LIMITED = "LIMITED",
  VIEW_ONLY = "VIEW_ONLY",
}

export interface ProxyAccess {
  id: string;
  grantedBy: string;
  grantedTo: string;
  grantedToEmail: string;
  grantedToName: string;
  accessLevel: ProxyAccessLevel;
  permissions: ProxyPermission[];
  startDate: Date;
  endDate: Date | null;
  status: ProxyAccessStatus;
}

export enum ProxyAccessLevel {
  FULL = "FULL",
  MEDICAL_ONLY = "MEDICAL_ONLY",
  BILLING_ONLY = "BILLING_ONLY",
  CUSTOM = "CUSTOM",
}

export enum ProxyPermission {
  VIEW_RECORDS = "VIEW_RECORDS",
  SCHEDULE_APPOINTMENTS = "SCHEDULE_APPOINTMENTS",
  MESSAGE_PROVIDERS = "MESSAGE_PROVIDERS",
  REQUEST_REFILLS = "REQUEST_REFILLS",
  VIEW_BILLING = "VIEW_BILLING",
  MAKE_PAYMENTS = "MAKE_PAYMENTS",
  DOWNLOAD_RECORDS = "DOWNLOAD_RECORDS",
}

export enum ProxyAccessStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
  PENDING = "PENDING",
}

// ============================================================================
// Dashboard & Health Summary
// ============================================================================

export interface HealthSummary {
  patientId: string;
  vitals: VitalTrend[];
  chronicConditions: ChronicCondition[];
  recentDiagnoses: Diagnosis[];
  activeMedications: MedicationSummary[];
  allergies: AllergySummary[];
  immunizations: ImmunizationSummary[];
  upcomingAppointments: AppointmentSummary[];
  recentTestResults: TestResultSummary[];
  careGaps: CareGap[];
  healthScore: HealthScore;
  recommendations: HealthRecommendation[];
}

export interface VitalTrend {
  type: VitalType;
  currentValue: number;
  unit: string;
  trend: "improving" | "stable" | "declining";
  history: VitalReading[];
  status: VitalStatus;
  lastRecorded: Date;
}

export enum VitalType {
  BLOOD_PRESSURE_SYSTOLIC = "BLOOD_PRESSURE_SYSTOLIC",
  BLOOD_PRESSURE_DIASTOLIC = "BLOOD_PRESSURE_DIASTOLIC",
  HEART_RATE = "HEART_RATE",
  TEMPERATURE = "TEMPERATURE",
  RESPIRATORY_RATE = "RESPIRATORY_RATE",
  OXYGEN_SATURATION = "OXYGEN_SATURATION",
  WEIGHT = "WEIGHT",
  HEIGHT = "HEIGHT",
  BMI = "BMI",
  BLOOD_GLUCOSE = "BLOOD_GLUCOSE",
  PAIN_LEVEL = "PAIN_LEVEL",
}

export enum VitalStatus {
  NORMAL = "NORMAL",
  BORDERLINE = "BORDERLINE",
  ABNORMAL = "ABNORMAL",
  CRITICAL = "CRITICAL",
}

export interface VitalReading {
  value: number;
  recordedAt: Date;
  recordedBy?: string;
  notes?: string;
}

export interface ChronicCondition {
  id: string;
  condition: string;
  icdCode: string;
  diagnosedDate: Date;
  status: ConditionStatus;
  severity: ConditionSeverity;
  managementPlan: string | null;
}

export enum ConditionStatus {
  ACTIVE = "ACTIVE",
  MANAGED = "MANAGED",
  IN_REMISSION = "IN_REMISSION",
  RESOLVED = "RESOLVED",
}

export enum ConditionSeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
}

export interface Diagnosis {
  id: string;
  condition: string;
  icdCode: string;
  diagnosedDate: Date;
  diagnosedBy: string;
  status: string;
  notes: string | null;
}

export interface MedicationSummary {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: Date;
  refillsRemaining: number;
  nextRefillDate: Date | null;
  status: MedicationStatus;
}

export enum MedicationStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  DISCONTINUED = "DISCONTINUED",
  COMPLETED = "COMPLETED",
}

export interface AllergySummary {
  id: string;
  allergen: string;
  reaction: string;
  severity: string;
  status: string;
}

export interface ImmunizationSummary {
  id: string;
  vaccine: string;
  administeredDate: Date;
  nextDueDate: Date | null;
}

export interface AppointmentSummary {
  id: string;
  type: string;
  provider: string;
  providerSpecialty: string;
  date: Date;
  time: string;
  duration: number;
  location: string;
  status: AppointmentStatus;
  canCheckIn: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  telehealth: boolean;
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

export interface TestResultSummary {
  id: string;
  testName: string;
  testType: string;
  orderedDate: Date;
  resultDate: Date;
  status: TestResultStatus;
  hasAbnormal: boolean;
  provider: string;
}

export enum TestResultStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  FINAL = "FINAL",
  AMENDED = "AMENDED",
  CANCELLED = "CANCELLED",
}

export interface CareGap {
  id: string;
  category: CareGapCategory;
  title: string;
  description: string;
  priority: CareGapPriority;
  dueDate: Date | null;
  recommendedAction: string;
}

export enum CareGapCategory {
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  CHRONIC_DISEASE_MANAGEMENT = "CHRONIC_DISEASE_MANAGEMENT",
  IMMUNIZATION = "IMMUNIZATION",
  SCREENING = "SCREENING",
  FOLLOW_UP = "FOLLOW_UP",
}

export enum CareGapPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface HealthScore {
  overall: number;
  cardiovascular: number;
  metabolic: number;
  mental: number;
  lifestyle: number;
  calculatedDate: Date;
  factors: HealthScoreFactor[];
}

export interface HealthScoreFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

export interface HealthRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ============================================================================
// Messaging Center
// ============================================================================

export interface Message extends BaseEntity {
  threadId: string;
  subject: string;
  body: string;
  senderId: string;
  senderName: string;
  senderType: MessageSenderType;
  recipientId: string;
  recipientName: string;
  recipientType: MessageSenderType;
  category: MessageCategory;
  priority: MessagePriority;
  status: MessageStatus;
  readAt: Date | null;
  repliedAt: Date | null;
  attachments: MessageAttachment[];
  metadata: Record<string, any>;
}

export enum MessageSenderType {
  PATIENT = "PATIENT",
  PROVIDER = "PROVIDER",
  CARE_TEAM = "CARE_TEAM",
  SYSTEM = "SYSTEM",
}

export enum MessageCategory {
  GENERAL_QUESTION = "GENERAL_QUESTION",
  APPOINTMENT_REQUEST = "APPOINTMENT_REQUEST",
  PRESCRIPTION_REFILL = "PRESCRIPTION_REFILL",
  TEST_RESULTS = "TEST_RESULTS",
  BILLING_INQUIRY = "BILLING_INQUIRY",
  TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT",
  ADMINISTRATIVE = "ADMINISTRATIVE",
}

export enum MessagePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  REPLIED = "REPLIED",
  ARCHIVED = "ARCHIVED",
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: MessageParticipant[];
  messages: Message[];
  category: MessageCategory;
  priority: MessagePriority;
  status: ThreadStatus;
  lastMessageAt: Date;
  unreadCount: number;
}

export enum ThreadStatus {
  ACTIVE = "ACTIVE",
  RESOLVED = "RESOLVED",
  ARCHIVED = "ARCHIVED",
}

export interface MessageParticipant {
  id: string;
  name: string;
  type: MessageSenderType;
  role?: string;
  avatar?: string;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

export interface MessageDraft {
  threadId?: string;
  subject: string;
  body: string;
  recipientId: string;
  category: MessageCategory;
  attachments: File[];
  savedAt: Date;
}

// ============================================================================
// Appointments & Scheduling
// ============================================================================

export interface PatientAppointment extends BaseEntity {
  patientId: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  appointmentType: string;
  appointmentTypeId: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  location: AppointmentLocation;
  status: AppointmentStatus;
  reasonForVisit: string;
  chiefComplaint?: string;
  preVisitQuestionnaire?: PreVisitQuestionnaire;
  telehealth: boolean;
  telehealthLink?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  rescheduledFrom?: string;
  confirmationSent: boolean;
  remindersSent: number;
  instructions?: string;
  copay?: number;
}

export interface AppointmentLocation {
  facilityId: string;
  facilityName: string;
  address: Address;
  roomNumber?: string;
  parkingInstructions?: string;
  directions?: string;
}

export interface PreVisitQuestionnaire {
  id: string;
  appointmentId: string;
  questions: QuestionnaireQuestion[];
  completedAt: Date | null;
  responses: QuestionnaireResponse[];
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

export enum QuestionType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  SCALE = "SCALE",
  DATE = "DATE",
}

export interface QuestionnaireResponse {
  questionId: string;
  answer: string | number | boolean | string[];
}

export interface ProviderAvailability {
  providerId: string;
  providerName: string;
  specialty: string;
  availableSlots: TimeSlot[];
  nextAvailable: Date | null;
}

export interface TimeSlot {
  date: Date;
  time: string;
  duration: number;
  available: boolean;
  appointmentTypeIds: string[];
}

export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number;
  specialty?: string;
  selfSchedulable: boolean;
  requiresReferral: boolean;
  teleHealthAvailable: boolean;
  copay?: number;
}

export interface AppointmentReminderSettings {
  enabled: boolean;
  emailReminder: boolean;
  smsReminder: boolean;
  pushReminder: boolean;
  reminderTimes: number[];
}

// ============================================================================
// Medical Records Access
// ============================================================================

export interface MedicalRecord extends BaseEntity {
  patientId: string;
  documentType: MedicalDocumentType;
  title: string;
  description?: string;
  date: Date;
  provider: string;
  specialty?: string;
  category: string;
  content: RecordContent;
  attachments: RecordAttachment[];
  status: RecordStatus;
  confidential: boolean;
  releaseAuthorization?: ReleaseAuthorization;
}

export enum MedicalDocumentType {
  CLINICAL_NOTE = "CLINICAL_NOTE",
  DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY",
  OPERATIVE_REPORT = "OPERATIVE_REPORT",
  PROGRESS_NOTE = "PROGRESS_NOTE",
  CONSULTATION = "CONSULTATION",
  LAB_RESULT = "LAB_RESULT",
  IMAGING_REPORT = "IMAGING_REPORT",
  PATHOLOGY_REPORT = "PATHOLOGY_REPORT",
  MEDICATION_LIST = "MEDICATION_LIST",
  IMMUNIZATION_RECORD = "IMMUNIZATION_RECORD",
  ALLERGY_LIST = "ALLERGY_LIST",
  PROBLEM_LIST = "PROBLEM_LIST",
  PROCEDURE_REPORT = "PROCEDURE_REPORT",
  REFERRAL = "REFERRAL",
  LETTER = "LETTER",
}

export enum RecordStatus {
  DRAFT = "DRAFT",
  FINAL = "FINAL",
  AMENDED = "AMENDED",
  CORRECTED = "CORRECTED",
  ENTERED_IN_ERROR = "ENTERED_IN_ERROR",
}

export interface RecordContent {
  text?: string;
  structured?: Record<string, any>;
  format: "text" | "html" | "markdown" | "fhir" | "cda";
}

export interface RecordAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnail?: string;
}

export interface ReleaseAuthorization {
  authorizedBy: string;
  authorizedTo: string;
  purpose: string;
  expiresAt: Date;
  restrictions?: string[];
}

export interface LabResult extends BaseEntity {
  patientId: string;
  orderId: string;
  testName: string;
  loincCode?: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  status: TestResultStatus;
  abnormalFlag?: AbnormalFlag;
  orderedBy: string;
  orderedDate: Date;
  collectedDate?: Date;
  resultDate: Date;
  performingLab: string;
  notes?: string;
  criticalValue: boolean;
}

export enum AbnormalFlag {
  NORMAL = "NORMAL",
  LOW = "LOW",
  HIGH = "HIGH",
  CRITICAL_LOW = "CRITICAL_LOW",
  CRITICAL_HIGH = "CRITICAL_HIGH",
}

export interface ImagingStudy extends BaseEntity {
  patientId: string;
  studyId: string;
  modality: string;
  bodyPart: string;
  description: string;
  orderedBy: string;
  orderedDate: Date;
  performedDate: Date;
  performingFacility: string;
  status: string;
  images: ImagingImage[];
  report?: ImagingReport;
}

export interface ImagingImage {
  id: string;
  sopInstanceUID: string;
  seriesNumber: number;
  instanceNumber: number;
  thumbnail: string;
  viewerUrl: string;
}

export interface ImagingReport {
  id: string;
  reportText: string;
  impressions: string;
  findings: string;
  radiologist: string;
  signedDate: Date;
  status: string;
}

export interface BlueButtonExport {
  format: "ccda" | "fhir" | "pdf";
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCategories: string[];
  status: ExportStatus;
  downloadUrl?: string;
  expiresAt?: Date;
}

export enum ExportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  READY = "READY",
  EXPIRED = "EXPIRED",
  FAILED = "FAILED",
}

// ============================================================================
// Billing & Payments
// ============================================================================

export interface BillingStatement extends BaseEntity {
  patientId: string;
  statementNumber: string;
  statementDate: Date;
  dueDate: Date;
  previousBalance: number;
  currentCharges: number;
  payments: number;
  adjustments: number;
  totalDue: number;
  lineItems: BillingLineItem[];
  status: StatementStatus;
}

export enum StatementStatus {
  CURRENT = "CURRENT",
  OVERDUE = "OVERDUE",
  PAID = "PAID",
  PAYMENT_PLAN = "PAYMENT_PLAN",
  IN_COLLECTIONS = "IN_COLLECTIONS",
}

export interface BillingLineItem {
  id: string;
  serviceDate: Date;
  provider: string;
  description: string;
  cptCode?: string;
  quantity: number;
  charge: number;
  insurance: number;
  patientResponsibility: number;
  status: LineItemStatus;
}

export enum LineItemStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  PAID = "PAID",
  DENIED = "DENIED",
  PARTIAL = "PARTIAL",
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  confirmationNumber: string;
  appliedTo: string[];
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  ACH = "ACH",
  CHECK = "CHECK",
  CASH = "CASH",
  PAYMENT_PLAN = "PAYMENT_PLAN",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  monthlyPayment: number;
  numberOfPayments: number;
  remainingPayments: number;
  nextPaymentDate: Date;
  status: PaymentPlanStatus;
  autopay: boolean;
}

export enum PaymentPlanStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DEFAULTED = "DEFAULTED",
  CANCELLED = "CANCELLED",
}

export interface InsuranceCoverage {
  insuranceId: string;
  insuranceName: string;
  policyNumber: string;
  groupNumber?: string;
  effectiveDate: Date;
  terminationDate?: Date;
  copay?: number;
  deductible?: number;
  deductibleMet: number;
  outOfPocketMax?: number;
  outOfPocketMet: number;
  coverageLevel: CoverageLevel;
}

export enum CoverageLevel {
  INDIVIDUAL = "INDIVIDUAL",
  FAMILY = "FAMILY",
  EMPLOYEE_SPOUSE = "EMPLOYEE_SPOUSE",
  EMPLOYEE_CHILDREN = "EMPLOYEE_CHILDREN",
}

export interface GoodFaithEstimate {
  id: string;
  patientId: string;
  serviceDate: Date;
  provider: string;
  services: EstimatedService[];
  estimatedTotal: number;
  estimatedPatientResponsibility: number;
  validUntil: Date;
  disclaimers: string[];
}

export interface EstimatedService {
  description: string;
  cptCode: string;
  estimatedCost: number;
  estimatedInsurance: number;
  estimatedPatientCost: number;
}

// ============================================================================
// Health Tools
// ============================================================================

export interface SymptomCheck {
  id: string;
  patientId: string;
  symptoms: Symptom[];
  duration: string;
  severity: SymptomSeverity;
  aiAssessment: AIAssessment;
  recommendations: SymptomRecommendation[];
  createdAt: Date;
}

export interface Symptom {
  name: string;
  description?: string;
  bodyPart?: string;
  onset: Date;
  severity: SymptomSeverity;
}

export enum SymptomSeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  EMERGENCY = "EMERGENCY",
}

export interface AIAssessment {
  urgency: UrgencyLevel;
  possibleConditions: PossibleCondition[];
  redFlags: string[];
  confidence: number;
  disclaimer: string;
}

export enum UrgencyLevel {
  EMERGENCY = "EMERGENCY",
  URGENT = "URGENT",
  SCHEDULE_SOON = "SCHEDULE_SOON",
  ROUTINE = "ROUTINE",
  SELF_CARE = "SELF_CARE",
}

export interface PossibleCondition {
  name: string;
  probability: number;
  description: string;
  commonTreatments?: string[];
}

export interface SymptomRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: number;
  actionable: boolean;
  actionUrl?: string;
}

export enum RecommendationType {
  CALL_911 = "CALL_911",
  GO_TO_ER = "GO_TO_ER",
  URGENT_CARE = "URGENT_CARE",
  SCHEDULE_APPOINTMENT = "SCHEDULE_APPOINTMENT",
  TELEMEDICINE = "TELEMEDICINE",
  SELF_CARE = "SELF_CARE",
  MONITOR = "MONITOR",
}

export interface MedicationInteractionCheck {
  medications: string[];
  interactions: Interaction[];
  warnings: InteractionWarning[];
  recommendations: string[];
}

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
  clinicalEffects: string;
  management: string;
}

export enum InteractionSeverity {
  MINOR = "MINOR",
  MODERATE = "MODERATE",
  MAJOR = "MAJOR",
  CONTRAINDICATED = "CONTRAINDICATED",
}

export interface InteractionWarning {
  type: WarningType;
  title: string;
  message: string;
  severity: string;
}

export enum WarningType {
  DRUG_DRUG = "DRUG_DRUG",
  DRUG_ALLERGY = "DRUG_ALLERGY",
  DRUG_CONDITION = "DRUG_CONDITION",
  DRUG_FOOD = "DRUG_FOOD",
  DUPLICATE_THERAPY = "DUPLICATE_THERAPY",
}

export interface HealthRiskAssessment {
  id: string;
  patientId: string;
  assessmentType: AssessmentType;
  completedAt: Date;
  responses: AssessmentResponse[];
  results: RiskResults;
  recommendations: RiskRecommendation[];
}

export enum AssessmentType {
  CARDIOVASCULAR = "CARDIOVASCULAR",
  DIABETES = "DIABETES",
  CANCER = "CANCER",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  OVERALL_WELLNESS = "OVERALL_WELLNESS",
}

export interface AssessmentResponse {
  questionId: string;
  question: string;
  answer: string | number | boolean;
}

export interface RiskResults {
  overallRisk: RiskLevel;
  specificRisks: SpecificRisk[];
  protectiveFactors: string[];
  riskFactors: string[];
}

export enum RiskLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export interface SpecificRisk {
  condition: string;
  risk: RiskLevel;
  probability: number;
  timeframe: string;
}

export interface RiskRecommendation {
  category: string;
  recommendation: string;
  priority: number;
  actionable: boolean;
}

export interface EducationalContent {
  id: string;
  title: string;
  category: ContentCategory;
  description: string;
  content: string;
  mediaType: MediaType;
  mediaUrl?: string;
  duration?: number;
  author: string;
  publishedDate: Date;
  lastUpdated: Date;
  tags: string[];
  relatedContent: string[];
}

export enum ContentCategory {
  CONDITION = "CONDITION",
  PROCEDURE = "PROCEDURE",
  MEDICATION = "MEDICATION",
  LIFESTYLE = "LIFESTYLE",
  PREVENTION = "PREVENTION",
  SYMPTOM = "SYMPTOM",
}

export enum MediaType {
  ARTICLE = "ARTICLE",
  VIDEO = "VIDEO",
  INFOGRAPHIC = "INFOGRAPHIC",
  PODCAST = "PODCAST",
  INTERACTIVE = "INTERACTIVE",
}

// ============================================================================
// Care Team
// ============================================================================

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  photo?: string;
  phone: string;
  email: string;
  fax?: string;
  address?: Address;
  isPrimary: boolean;
  canMessage: boolean;
  acceptingNewPatients: boolean;
}

// ============================================================================
// Notifications
// ============================================================================

export interface PortalNotification {
  id: string;
  patientId: string;
  type: NotificationType;
  category: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt: Date | null;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export enum NotificationType {
  APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
  LAB_RESULT = "LAB_RESULT",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  PRESCRIPTION_READY = "PRESCRIPTION_READY",
  BILL_DUE = "BILL_DUE",
  INSURANCE_UPDATE = "INSURANCE_UPDATE",
  CARE_GAP = "CARE_GAP",
  IMMUNIZATION_DUE = "IMMUNIZATION_DUE",
  SYSTEM = "SYSTEM",
}

export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

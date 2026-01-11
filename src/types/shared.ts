/**
 * Lithic Healthcare Platform v0.5 - Shared Type Definitions
 * Coordination Hub - Agent 13
 *
 * This file contains all shared types that will be used across v0.5 modules:
 * - Mobile Application
 * - Notification Hub
 * - AI Integration
 * - Voice Integration
 * - Remote Patient Monitoring (RPM)
 * - Social Determinants of Health (SDOH)
 * - Clinical Research
 * - Patient Engagement
 * - Document Management
 * - E-Signature
 * - Internationalization (i18n)
 */

// ============================================================================
// Mobile Application Types
// ============================================================================

export interface MobileDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: MobilePlatform;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  deviceName: string;
  isActive: boolean;
  lastSeen: Date;
  pushEnabled: boolean;
  biometricEnabled: boolean;
  offlineMode: boolean;
  syncStatus: SyncStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum MobilePlatform {
  IOS = "IOS",
  ANDROID = "ANDROID",
  WEB = "WEB",
}

export enum SyncStatus {
  SYNCED = "SYNCED",
  PENDING = "PENDING",
  SYNCING = "SYNCING",
  FAILED = "FAILED",
  CONFLICT = "CONFLICT",
}

export interface MobileAppConfig {
  features: MobileFeatureFlags;
  offlineMode: OfflineConfig;
  pushNotifications: PushConfig;
  biometric: BiometricConfig;
  theme: ThemeConfig;
}

export interface MobileFeatureFlags {
  offlineAccess: boolean;
  biometricAuth: boolean;
  pushNotifications: boolean;
  voiceCommands: boolean;
  aiAssistant: boolean;
  telemetry: boolean;
  crashReporting: boolean;
}

export interface OfflineConfig {
  enabled: boolean;
  syncInterval: number;
  maxStorageSize: number;
  cacheDuration: number;
  syncOnWifiOnly: boolean;
}

export interface PushConfig {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface BiometricConfig {
  enabled: boolean;
  type: BiometricType;
  fallbackToPin: boolean;
  timeout: number;
}

export enum BiometricType {
  FINGERPRINT = "FINGERPRINT",
  FACE_ID = "FACE_ID",
  IRIS = "IRIS",
  NONE = "NONE",
}

export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  fontSize: FontSize;
}

export enum FontSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  EXTRA_LARGE = "EXTRA_LARGE",
}

// ============================================================================
// Notification Hub Types
// ============================================================================

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl: string | null;
  actions: NotificationAction[];
  status: NotificationStatus;
  channel: NotificationChannel[];
  scheduledFor: Date | null;
  sentAt: Date | null;
  readAt: Date | null;
  expiresAt: Date | null;
  metadata: NotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  SYSTEM = "SYSTEM",
  APPOINTMENT = "APPOINTMENT",
  LAB_RESULT = "LAB_RESULT",
  MEDICATION = "MEDICATION",
  BILLING = "BILLING",
  MESSAGE = "MESSAGE",
  ALERT = "ALERT",
  REMINDER = "REMINDER",
  TASK = "TASK",
  RPM = "RPM",
  RESEARCH = "RESEARCH",
  CONSENT = "CONSENT",
}

export enum NotificationCategory {
  INFORMATIONAL = "INFORMATIONAL",
  ACTION_REQUIRED = "ACTION_REQUIRED",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
  MARKETING = "MARKETING",
  EDUCATIONAL = "EDUCATIONAL",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export enum NotificationStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  SENDING = "SENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
  VOICE = "VOICE",
  WEBHOOK = "WEBHOOK",
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  url: string | null;
  style: "primary" | "secondary" | "danger";
}

export interface NotificationMetadata {
  source: string;
  relatedResource: string | null;
  relatedResourceId: string | null;
  templateId: string | null;
  campaignId: string | null;
  tags: string[];
  customData: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  subject: string;
  body: string;
  channels: NotificationChannel[];
  variables: TemplateVariable[];
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface NotificationPreference {
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
  quietHours: QuietHours | null;
  frequency: NotificationFrequency;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

export enum NotificationFrequency {
  IMMEDIATE = "IMMEDIATE",
  HOURLY_DIGEST = "HOURLY_DIGEST",
  DAILY_DIGEST = "DAILY_DIGEST",
  WEEKLY_DIGEST = "WEEKLY_DIGEST",
}

// ============================================================================
// AI Integration Types
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  type: AIModelType;
  provider: AIProvider;
  version: string;
  capabilities: AICapability[];
  configuration: AIModelConfig;
  status: AIModelStatus;
  accuracy: number | null;
  lastTrainedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum AIModelType {
  NLP = "NLP",
  DIAGNOSTIC = "DIAGNOSTIC",
  PREDICTIVE = "PREDICTIVE",
  RECOMMENDATION = "RECOMMENDATION",
  IMAGE_ANALYSIS = "IMAGE_ANALYSIS",
  VOICE_RECOGNITION = "VOICE_RECOGNITION",
  CLINICAL_CODING = "CLINICAL_CODING",
  RISK_ASSESSMENT = "RISK_ASSESSMENT",
}

export enum AIProvider {
  OPENAI = "OPENAI",
  ANTHROPIC = "ANTHROPIC",
  GOOGLE = "GOOGLE",
  AZURE = "AZURE",
  AWS = "AWS",
  CUSTOM = "CUSTOM",
}

export enum AICapability {
  TEXT_GENERATION = "TEXT_GENERATION",
  TEXT_ANALYSIS = "TEXT_ANALYSIS",
  SUMMARIZATION = "SUMMARIZATION",
  TRANSLATION = "TRANSLATION",
  SENTIMENT_ANALYSIS = "SENTIMENT_ANALYSIS",
  ENTITY_EXTRACTION = "ENTITY_EXTRACTION",
  CLASSIFICATION = "CLASSIFICATION",
  PREDICTION = "PREDICTION",
  RECOMMENDATION = "RECOMMENDATION",
  IMAGE_RECOGNITION = "IMAGE_RECOGNITION",
  VOICE_TO_TEXT = "VOICE_TO_TEXT",
  TEXT_TO_VOICE = "TEXT_TO_VOICE",
}

export enum AIModelStatus {
  ACTIVE = "ACTIVE",
  TRAINING = "TRAINING",
  TESTING = "TESTING",
  INACTIVE = "INACTIVE",
  DEPRECATED = "DEPRECATED",
}

export interface AIModelConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  timeout: number;
  retries: number;
}

export interface AIRequest {
  id: string;
  userId: string;
  organizationId: string;
  modelId: string;
  type: AIRequestType;
  input: any;
  context: Record<string, any>;
  status: AIRequestStatus;
  response: any | null;
  error: string | null;
  tokensUsed: number | null;
  processingTime: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export enum AIRequestType {
  CLINICAL_SUMMARY = "CLINICAL_SUMMARY",
  DIAGNOSIS_SUGGESTION = "DIAGNOSIS_SUGGESTION",
  TREATMENT_RECOMMENDATION = "TREATMENT_RECOMMENDATION",
  DRUG_INTERACTION = "DRUG_INTERACTION",
  RISK_ASSESSMENT = "RISK_ASSESSMENT",
  CLINICAL_CODING = "CLINICAL_CODING",
  CHART_REVIEW = "CHART_REVIEW",
  PATIENT_TRIAGE = "PATIENT_TRIAGE",
  VOICE_TRANSCRIPTION = "VOICE_TRANSCRIPTION",
  IMAGE_ANALYSIS = "IMAGE_ANALYSIS",
}

export enum AIRequestStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface AIInsight {
  id: string;
  type: AIInsightType;
  title: string;
  description: string;
  confidence: number;
  severity: InsightSeverity;
  recommendations: string[];
  evidence: Evidence[];
  relatedResourceType: string;
  relatedResourceId: string;
  status: InsightStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export enum AIInsightType {
  CLINICAL = "CLINICAL",
  OPERATIONAL = "OPERATIONAL",
  FINANCIAL = "FINANCIAL",
  QUALITY = "QUALITY",
  SAFETY = "SAFETY",
  COMPLIANCE = "COMPLIANCE",
}

export enum InsightSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum InsightStatus {
  NEW = "NEW",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export interface Evidence {
  source: string;
  text: string;
  confidence: number;
  link: string | null;
}

// ============================================================================
// Voice Integration Types
// ============================================================================

export interface VoiceSession {
  id: string;
  userId: string;
  organizationId: string;
  type: VoiceSessionType;
  status: VoiceSessionStatus;
  language: string;
  transcript: VoiceTranscript[];
  commands: VoiceCommand[];
  audioUrl: string | null;
  duration: number;
  startedAt: Date;
  endedAt: Date | null;
  metadata: Record<string, any>;
}

export enum VoiceSessionType {
  DICTATION = "DICTATION",
  COMMAND = "COMMAND",
  CONVERSATION = "CONVERSATION",
  TRANSCRIPTION = "TRANSCRIPTION",
}

export enum VoiceSessionStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface VoiceTranscript {
  id: string;
  sessionId: string;
  text: string;
  confidence: number;
  speaker: string | null;
  timestamp: Date;
  isFinal: boolean;
  alternatives: TranscriptAlternative[];
}

export interface TranscriptAlternative {
  text: string;
  confidence: number;
}

export interface VoiceCommand {
  id: string;
  sessionId: string;
  command: string;
  intent: VoiceIntent;
  parameters: Record<string, any>;
  confidence: number;
  executed: boolean;
  result: any | null;
  timestamp: Date;
}

export enum VoiceIntent {
  NAVIGATE = "NAVIGATE",
  CREATE_NOTE = "CREATE_NOTE",
  SEARCH_PATIENT = "SEARCH_PATIENT",
  ORDER_LAB = "ORDER_LAB",
  PRESCRIBE_MEDICATION = "PRESCRIBE_MEDICATION",
  SCHEDULE_APPOINTMENT = "SCHEDULE_APPOINTMENT",
  SIGN_DOCUMENT = "SIGN_DOCUMENT",
  SEND_MESSAGE = "SEND_MESSAGE",
  SET_REMINDER = "SET_REMINDER",
  CUSTOM = "CUSTOM",
}

export interface VoiceConfiguration {
  enabled: boolean;
  language: string;
  dialect: string | null;
  speakerRecognition: boolean;
  punctuationMode: PunctuationMode;
  profanityFilter: boolean;
  commandMode: CommandMode;
  wakeWord: string | null;
  confidence: number;
}

export enum PunctuationMode {
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
  NONE = "NONE",
}

export enum CommandMode {
  ALWAYS_LISTENING = "ALWAYS_LISTENING",
  PUSH_TO_TALK = "PUSH_TO_TALK",
  WAKE_WORD = "WAKE_WORD",
}

// ============================================================================
// Remote Patient Monitoring (RPM) Types
// ============================================================================

export interface RPMDevice {
  id: string;
  patientId: string;
  organizationId: string;
  type: RPMDeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  status: RPMDeviceStatus;
  batteryLevel: number | null;
  lastSync: Date | null;
  assignedAt: Date;
  returnedAt: Date | null;
  metadata: Record<string, any>;
}

export enum RPMDeviceType {
  BLOOD_PRESSURE_MONITOR = "BLOOD_PRESSURE_MONITOR",
  GLUCOMETER = "GLUCOMETER",
  PULSE_OXIMETER = "PULSE_OXIMETER",
  WEIGHT_SCALE = "WEIGHT_SCALE",
  THERMOMETER = "THERMOMETER",
  ECG_MONITOR = "ECG_MONITOR",
  SPIROMETER = "SPIROMETER",
  CONTINUOUS_GLUCOSE_MONITOR = "CONTINUOUS_GLUCOSE_MONITOR",
  ACTIVITY_TRACKER = "ACTIVITY_TRACKER",
  SMART_WATCH = "SMART_WATCH",
}

export enum RPMDeviceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
  LOST = "LOST",
  DAMAGED = "DAMAGED",
  RETURNED = "RETURNED",
}

export interface RPMReading {
  id: string;
  deviceId: string;
  patientId: string;
  type: RPMReadingType;
  value: any;
  unit: string;
  timestamp: Date;
  source: ReadingSource;
  quality: ReadingQuality;
  flags: ReadingFlag[];
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  metadata: Record<string, any>;
}

export enum RPMReadingType {
  BLOOD_PRESSURE = "BLOOD_PRESSURE",
  HEART_RATE = "HEART_RATE",
  BLOOD_GLUCOSE = "BLOOD_GLUCOSE",
  OXYGEN_SATURATION = "OXYGEN_SATURATION",
  WEIGHT = "WEIGHT",
  TEMPERATURE = "TEMPERATURE",
  RESPIRATORY_RATE = "RESPIRATORY_RATE",
  ECG = "ECG",
  STEPS = "STEPS",
  SLEEP = "SLEEP",
  ACTIVITY = "ACTIVITY",
}

export enum ReadingSource {
  DEVICE = "DEVICE",
  MANUAL = "MANUAL",
  IMPORTED = "IMPORTED",
}

export enum ReadingQuality {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  INVALID = "INVALID",
}

export enum ReadingFlag {
  OUT_OF_RANGE = "OUT_OF_RANGE",
  CRITICAL_HIGH = "CRITICAL_HIGH",
  CRITICAL_LOW = "CRITICAL_LOW",
  TRENDING_UP = "TRENDING_UP",
  TRENDING_DOWN = "TRENDING_DOWN",
  ANOMALY = "ANOMALY",
  MISSED_READING = "MISSED_READING",
}

export interface RPMProgram {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  condition: string;
  duration: number;
  frequency: RPMFrequency;
  devices: RPMDeviceType[];
  thresholds: RPMThreshold[];
  alerts: RPMAlertRule[];
  goals: RPMGoal[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RPMFrequency {
  type: FrequencyType;
  interval: number;
  times: string[];
}

export enum FrequencyType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  TWICE_DAILY = "TWICE_DAILY",
  AS_NEEDED = "AS_NEEDED",
}

export interface RPMThreshold {
  readingType: RPMReadingType;
  min: number | null;
  max: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
  unit: string;
}

export interface RPMAlertRule {
  id: string;
  condition: string;
  severity: AlertSeverity;
  notifyPatient: boolean;
  notifyProvider: boolean;
  notifyCaregiver: boolean;
  escalationDelay: number;
}

export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ALERT = "ALERT",
  CRITICAL = "CRITICAL",
  EMERGENCY = "EMERGENCY",
}

export interface RPMGoal {
  id: string;
  type: GoalType;
  target: any;
  unit: string;
  timeframe: number;
  achieved: boolean;
}

export enum GoalType {
  READING_COMPLIANCE = "READING_COMPLIANCE",
  VALUE_TARGET = "VALUE_TARGET",
  IMPROVEMENT = "IMPROVEMENT",
  STABILITY = "STABILITY",
}

export interface RPMEnrollment {
  id: string;
  patientId: string;
  programId: string;
  status: EnrollmentStatus;
  startDate: Date;
  endDate: Date | null;
  devices: string[];
  careTeam: string[];
  notes: string | null;
  metadata: Record<string, any>;
}

export enum EnrollmentStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  WITHDRAWN = "WITHDRAWN",
}

// ============================================================================
// Social Determinants of Health (SDOH) Types
// ============================================================================

export interface SDOHAssessment {
  id: string;
  patientId: string;
  organizationId: string;
  assessedBy: string;
  assessmentDate: Date;
  domains: SDOHDomain[];
  overallScore: number;
  riskLevel: RiskLevel;
  recommendations: SDOHRecommendation[];
  resources: SDOHResource[];
  followUpDate: Date | null;
  status: AssessmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SDOHDomain {
  domain: SDOHDomainType;
  questions: SDOHQuestion[];
  score: number;
  riskLevel: RiskLevel;
  needs: string[];
}

export enum SDOHDomainType {
  FOOD_INSECURITY = "FOOD_INSECURITY",
  HOUSING_INSTABILITY = "HOUSING_INSTABILITY",
  TRANSPORTATION = "TRANSPORTATION",
  UTILITIES = "UTILITIES",
  SAFETY = "SAFETY",
  FINANCIAL_STRAIN = "FINANCIAL_STRAIN",
  SOCIAL_ISOLATION = "SOCIAL_ISOLATION",
  EDUCATION = "EDUCATION",
  EMPLOYMENT = "EMPLOYMENT",
  LEGAL = "LEGAL",
}

export interface SDOHQuestion {
  id: string;
  question: string;
  answer: any;
  type: QuestionType;
  weight: number;
}

export enum QuestionType {
  YES_NO = "YES_NO",
  SCALE = "SCALE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TEXT = "TEXT",
  NUMERIC = "NUMERIC",
}

export enum RiskLevel {
  NONE = "NONE",
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  SEVERE = "SEVERE",
}

export enum AssessmentStatus {
  DRAFT = "DRAFT",
  COMPLETED = "COMPLETED",
  REVIEWED = "REVIEWED",
  ARCHIVED = "ARCHIVED",
}

export interface SDOHRecommendation {
  id: string;
  domain: SDOHDomainType;
  title: string;
  description: string;
  priority: Priority;
  resources: string[];
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface SDOHResource {
  id: string;
  organizationId: string;
  name: string;
  type: ResourceType;
  domains: SDOHDomainType[];
  description: string;
  contactInfo: ContactDetails;
  eligibility: string[];
  availability: Availability;
  location: Location;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ResourceType {
  FOOD_BANK = "FOOD_BANK",
  HOUSING_ASSISTANCE = "HOUSING_ASSISTANCE",
  TRANSPORTATION = "TRANSPORTATION",
  UTILITY_ASSISTANCE = "UTILITY_ASSISTANCE",
  FINANCIAL_COUNSELING = "FINANCIAL_COUNSELING",
  LEGAL_AID = "LEGAL_AID",
  EMPLOYMENT_SERVICES = "EMPLOYMENT_SERVICES",
  EDUCATION = "EDUCATION",
  MENTAL_HEALTH = "MENTAL_HEALTH",
  COMMUNITY_SUPPORT = "COMMUNITY_SUPPORT",
}

export interface ContactDetails {
  phone: string;
  email: string | null;
  website: string | null;
  hours: string;
}

export interface Availability {
  days: string[];
  hours: string;
  appointment: boolean;
  walkIn: boolean;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  zip: string;
  coordinates: Coordinates | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SDOHIntervention {
  id: string;
  patientId: string;
  assessmentId: string;
  domain: SDOHDomainType;
  type: InterventionType;
  description: string;
  resources: string[];
  status: InterventionStatus;
  startDate: Date;
  endDate: Date | null;
  outcome: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum InterventionType {
  REFERRAL = "REFERRAL",
  COUNSELING = "COUNSELING",
  CARE_COORDINATION = "CARE_COORDINATION",
  EDUCATION = "EDUCATION",
  FOLLOW_UP = "FOLLOW_UP",
}

export enum InterventionStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Clinical Research Types
// ============================================================================

export interface ClinicalTrial {
  id: string;
  organizationId: string;
  nctNumber: string;
  title: string;
  description: string;
  phase: TrialPhase;
  status: TrialStatus;
  principalInvestigator: string;
  sponsor: string;
  condition: string[];
  intervention: string[];
  eligibilityCriteria: EligibilityCriteria;
  enrollmentTarget: number;
  enrollmentCurrent: number;
  startDate: Date;
  endDate: Date | null;
  sites: TrialSite[];
  protocols: string[];
  consentForms: string[];
  irb: IRBInfo;
  createdAt: Date;
  updatedAt: Date;
}

export enum TrialPhase {
  PHASE_0 = "PHASE_0",
  PHASE_1 = "PHASE_1",
  PHASE_2 = "PHASE_2",
  PHASE_3 = "PHASE_3",
  PHASE_4 = "PHASE_4",
}

export enum TrialStatus {
  PLANNING = "PLANNING",
  RECRUITING = "RECRUITING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  COMPLETED = "COMPLETED",
  TERMINATED = "TERMINATED",
}

export interface EligibilityCriteria {
  inclusion: string[];
  exclusion: string[];
  ageMin: number | null;
  ageMax: number | null;
  gender: string | null;
  healthyVolunteers: boolean;
}

export interface TrialSite {
  name: string;
  location: string;
  principalInvestigator: string;
  contactInfo: ContactDetails;
  status: string;
}

export interface IRBInfo {
  number: string;
  institution: string;
  approvalDate: Date;
  expirationDate: Date;
  status: string;
}

export interface ResearchParticipant {
  id: string;
  trialId: string;
  patientId: string;
  studyId: string;
  status: ParticipantStatus;
  enrollmentDate: Date;
  withdrawalDate: Date | null;
  withdrawalReason: string | null;
  cohort: string | null;
  arm: string | null;
  consentDate: Date;
  consentVersion: string;
  visits: ResearchVisit[];
  adverseEvents: AdverseEvent[];
  protocolDeviations: ProtocolDeviation[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ParticipantStatus {
  SCREENING = "SCREENING",
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  WITHDRAWN = "WITHDRAWN",
  LOST_TO_FOLLOWUP = "LOST_TO_FOLLOWUP",
}

export interface ResearchVisit {
  id: string;
  participantId: string;
  visitNumber: number;
  visitType: VisitType;
  scheduledDate: Date;
  actualDate: Date | null;
  status: VisitStatus;
  procedures: ResearchProcedure[];
  specimens: Specimen[];
  notes: string | null;
}

export enum VisitType {
  SCREENING = "SCREENING",
  BASELINE = "BASELINE",
  TREATMENT = "TREATMENT",
  FOLLOW_UP = "FOLLOW_UP",
  EARLY_TERMINATION = "EARLY_TERMINATION",
  UNSCHEDULED = "UNSCHEDULED",
}

export enum VisitStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
  CANCELLED = "CANCELLED",
}

export interface ResearchProcedure {
  id: string;
  name: string;
  type: string;
  performed: boolean;
  performedBy: string | null;
  performedAt: Date | null;
  results: any;
  notes: string | null;
}

export interface Specimen {
  id: string;
  type: SpecimenType;
  collectedAt: Date;
  collectedBy: string;
  volume: number;
  unit: string;
  storageLocation: string;
  status: SpecimenStatus;
}

export enum SpecimenType {
  BLOOD = "BLOOD",
  URINE = "URINE",
  TISSUE = "TISSUE",
  SALIVA = "SALIVA",
  DNA = "DNA",
  OTHER = "OTHER",
}

export enum SpecimenStatus {
  COLLECTED = "COLLECTED",
  PROCESSING = "PROCESSING",
  STORED = "STORED",
  ANALYZED = "ANALYZED",
  DEPLETED = "DEPLETED",
  DESTROYED = "DESTROYED",
}

export interface AdverseEvent {
  id: string;
  participantId: string;
  term: string;
  description: string;
  severity: Severity;
  seriousness: Seriousness;
  relationship: Relationship;
  onset: Date;
  resolution: Date | null;
  outcome: Outcome;
  reportedAt: Date;
  reportedBy: string;
}

export enum Severity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  LIFE_THREATENING = "LIFE_THREATENING",
  FATAL = "FATAL",
}

export enum Seriousness {
  NON_SERIOUS = "NON_SERIOUS",
  SERIOUS = "SERIOUS",
}

export enum Relationship {
  UNRELATED = "UNRELATED",
  UNLIKELY = "UNLIKELY",
  POSSIBLE = "POSSIBLE",
  PROBABLE = "PROBABLE",
  DEFINITE = "DEFINITE",
}

export enum Outcome {
  RECOVERED = "RECOVERED",
  RECOVERING = "RECOVERING",
  NOT_RECOVERED = "NOT_RECOVERED",
  RECOVERED_WITH_SEQUELAE = "RECOVERED_WITH_SEQUELAE",
  FATAL = "FATAL",
  UNKNOWN = "UNKNOWN",
}

export interface ProtocolDeviation {
  id: string;
  participantId: string;
  type: DeviationType;
  description: string;
  impact: DeviationImpact;
  reportedAt: Date;
  reportedBy: string;
  resolution: string | null;
}

export enum DeviationType {
  INCLUSION_EXCLUSION = "INCLUSION_EXCLUSION",
  INFORMED_CONSENT = "INFORMED_CONSENT",
  STUDY_PROCEDURE = "STUDY_PROCEDURE",
  VISIT_WINDOW = "VISIT_WINDOW",
  MEDICATION = "MEDICATION",
  OTHER = "OTHER",
}

export enum DeviationImpact {
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL",
}

// ============================================================================
// Patient Engagement Types
// ============================================================================

export interface EngagementProgram {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: ProgramType;
  goals: ProgramGoal[];
  activities: EngagementActivity[];
  rewards: RewardSystem;
  eligibility: ProgramEligibility;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProgramType {
  WELLNESS = "WELLNESS",
  CHRONIC_DISEASE = "CHRONIC_DISEASE",
  PREVENTIVE_CARE = "PREVENTIVE_CARE",
  MEDICATION_ADHERENCE = "MEDICATION_ADHERENCE",
  LIFESTYLE = "LIFESTYLE",
  MATERNITY = "MATERNITY",
  PEDIATRIC = "PEDIATRIC",
}

export interface ProgramGoal {
  id: string;
  title: string;
  description: string;
  target: any;
  metric: string;
  timeframe: number;
}

export interface EngagementActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  frequency: string;
  points: number;
  isRequired: boolean;
}

export enum ActivityType {
  APPOINTMENT = "APPOINTMENT",
  SURVEY = "SURVEY",
  EDUCATION = "EDUCATION",
  EXERCISE = "EXERCISE",
  MEDICATION = "MEDICATION",
  MEASUREMENT = "MEASUREMENT",
  SOCIAL = "SOCIAL",
}

export interface RewardSystem {
  enabled: boolean;
  pointsPerActivity: Record<string, number>;
  milestones: Milestone[];
  redemption: RedemptionOption[];
}

export interface Milestone {
  id: string;
  points: number;
  title: string;
  reward: string;
}

export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: string;
}

export interface ProgramEligibility {
  conditions: string[];
  ageMin: number | null;
  ageMax: number | null;
  requiresEnrollment: boolean;
}

export interface PatientEngagement {
  id: string;
  patientId: string;
  programId: string;
  status: EngagementStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  progress: EngagementProgress;
  activities: CompletedActivity[];
  points: number;
  level: number;
  streakDays: number;
}

export enum EngagementStatus {
  INVITED = "INVITED",
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  DROPPED = "DROPPED",
}

export interface EngagementProgress {
  completionPercentage: number;
  goalsAchieved: number;
  goalsTotal: number;
  activitiesCompleted: number;
  activitiesTotal: number;
}

export interface CompletedActivity {
  id: string;
  activityId: string;
  completedAt: Date;
  points: number;
  notes: string | null;
}

export interface EngagementMetrics {
  patientId: string;
  period: string;
  portalLogins: number;
  messagesRead: number;
  messagesSent: number;
  appointmentsScheduled: number;
  appointmentsAttended: number;
  surveysCompleted: number;
  educationCompleted: number;
  activeDays: number;
  engagementScore: number;
}

// ============================================================================
// Document Management Types
// ============================================================================

export interface Document {
  id: string;
  organizationId: string;
  patientId: string | null;
  name: string;
  description: string | null;
  type: DocumentType;
  category: DocumentCategory;
  mimeType: string;
  size: number;
  version: number;
  status: DocumentStatus;
  storageKey: string;
  checksum: string;
  pages: number | null;
  metadata: DocumentMetadata;
  tags: string[];
  uploadedBy: string;
  uploadedAt: Date;
  lastAccessedAt: Date | null;
  retentionPolicy: RetentionPolicy;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  MEDICAL_RECORD = "MEDICAL_RECORD",
  LAB_REPORT = "LAB_REPORT",
  IMAGING = "IMAGING",
  CONSENT = "CONSENT",
  INSURANCE = "INSURANCE",
  PRESCRIPTION = "PRESCRIPTION",
  REFERRAL = "REFERRAL",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  LEGAL = "LEGAL",
  FINANCIAL = "FINANCIAL",
  CORRESPONDENCE = "CORRESPONDENCE",
  OTHER = "OTHER",
}

export enum DocumentCategory {
  CLINICAL = "CLINICAL",
  ADMINISTRATIVE = "ADMINISTRATIVE",
  FINANCIAL = "FINANCIAL",
  LEGAL = "LEGAL",
  PERSONAL = "PERSONAL",
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  EXPIRED = "EXPIRED",
}

export interface DocumentMetadata {
  author: string | null;
  subject: string | null;
  keywords: string[];
  dateCreated: Date | null;
  dateModified: Date | null;
  application: string | null;
  customFields: Record<string, any>;
}

export interface RetentionPolicy {
  type: RetentionType;
  duration: number;
  deleteAfterExpiry: boolean;
  legalHold: boolean;
}

export enum RetentionType {
  INDEFINITE = "INDEFINITE",
  DAYS = "DAYS",
  MONTHS = "MONTHS",
  YEARS = "YEARS",
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  storageKey: string;
  size: number;
  checksum: string;
  changes: string | null;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  action: DocumentAction;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export enum DocumentAction {
  VIEW = "VIEW",
  DOWNLOAD = "DOWNLOAD",
  PRINT = "PRINT",
  SHARE = "SHARE",
  EDIT = "EDIT",
  DELETE = "DELETE",
  SIGN = "SIGN",
}

export interface DocumentShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string | null;
  shareType: ShareType;
  permissions: SharePermission[];
  expiresAt: Date | null;
  accessCode: string | null;
  accessed: boolean;
  createdAt: Date;
}

export enum ShareType {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
  PUBLIC_LINK = "PUBLIC_LINK",
}

export enum SharePermission {
  VIEW = "VIEW",
  DOWNLOAD = "DOWNLOAD",
  COMMENT = "COMMENT",
  EDIT = "EDIT",
}

// ============================================================================
// E-Signature Types
// ============================================================================

export interface ESignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signatureType: SignatureType;
  signatureData: string;
  method: SignatureMethod;
  ipAddress: string;
  userAgent: string;
  location: string | null;
  timestamp: Date;
  certificate: SignatureCertificate | null;
  isValid: boolean;
  metadata: Record<string, any>;
}

export enum SignatureType {
  DRAWN = "DRAWN",
  TYPED = "TYPED",
  UPLOADED = "UPLOADED",
  DIGITAL_CERTIFICATE = "DIGITAL_CERTIFICATE",
  BIOMETRIC = "BIOMETRIC",
}

export enum SignatureMethod {
  CLICK_TO_SIGN = "CLICK_TO_SIGN",
  DRAW = "DRAW",
  UPLOAD = "UPLOAD",
  SMS_OTP = "SMS_OTP",
  EMAIL_OTP = "EMAIL_OTP",
  DIGITAL_ID = "DIGITAL_ID",
  BIOMETRIC = "BIOMETRIC",
}

export interface SignatureCertificate {
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  algorithm: string;
  fingerprint: string;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  requestedBy: string;
  requestedAt: Date;
  signers: SignerInfo[];
  status: SignatureRequestStatus;
  dueDate: Date | null;
  message: string | null;
  completedAt: Date | null;
  metadata: Record<string, any>;
}

export enum SignatureRequestStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface SignerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  order: number;
  status: SignerStatus;
  sentAt: Date | null;
  viewedAt: Date | null;
  signedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  signatureId: string | null;
}

export enum SignerStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  VIEWED = "VIEWED",
  SIGNED = "SIGNED",
  DECLINED = "DECLINED",
}

export interface SignatureField {
  id: string;
  documentId: string;
  signerId: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isRequired: boolean;
  value: string | null;
}

export enum FieldType {
  SIGNATURE = "SIGNATURE",
  INITIAL = "INITIAL",
  DATE = "DATE",
  TEXT = "TEXT",
  CHECKBOX = "CHECKBOX",
}

export interface SignatureAuditTrail {
  documentId: string;
  events: AuditEvent[];
  createdAt: Date;
  completedAt: Date | null;
}

export interface AuditEvent {
  id: string;
  type: string;
  actor: string;
  timestamp: Date;
  ipAddress: string;
  description: string;
  metadata: Record<string, any>;
}

// ============================================================================
// Internationalization (i18n) Types
// ============================================================================

export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  direction: TextDirection;
  dateFormat: string;
  timeFormat: string;
  numberFormat: NumberFormatConfig;
  currency: string;
  isRTL: boolean;
  isActive: boolean;
}

export enum TextDirection {
  LTR = "LTR",
  RTL = "RTL",
}

export interface NumberFormatConfig {
  decimal: string;
  thousands: string;
  precision: number;
}

export interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  context: string | null;
  pluralForms: Record<string, string> | null;
  variables: string[];
  namespace: string;
  isApproved: boolean;
  translatedBy: string | null;
  translatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationNamespace {
  id: string;
  name: string;
  description: string;
  keys: number;
  locales: string[];
  completeness: Record<string, number>;
}

export interface LocalizationSettings {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  autoDetect: boolean;
  cacheEnabled: boolean;
  cacheDuration: number;
}

// ============================================================================
// Integration & Event Types
// ============================================================================

export interface IntegrationEvent {
  id: string;
  type: string;
  source: string;
  target: string;
  payload: any;
  timestamp: Date;
  status: EventStatus;
  retries: number;
  error: string | null;
  processedAt: Date | null;
}

export enum EventStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  DEAD_LETTER = "DEAD_LETTER",
}

export interface EventSubscription {
  id: string;
  eventType: string;
  subscriber: string;
  filter: Record<string, any> | null;
  isActive: boolean;
}

// ============================================================================
// Shared Utility Types
// ============================================================================

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: UploadStatus;
  error: string | null;
}

export enum UploadStatus {
  PENDING = "PENDING",
  UPLOADING = "UPLOADING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BatchOperation {
  id: string;
  type: string;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  status: BatchStatus;
  errors: BatchError[];
  startedAt: Date;
  completedAt: Date | null;
}

export enum BatchStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED",
}

export interface BatchError {
  item: any;
  error: string;
  code: string;
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  // Re-export commonly used types
  Address,
  ContactInfo,
  Name,
} from "./index";
